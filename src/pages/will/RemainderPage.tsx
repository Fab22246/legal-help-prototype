import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RadioGroup } from '../../components/forms/RadioGroup'
import { TextInput } from '../../components/forms/TextInput'
import { ErrorSummary, type ErrorSummaryItem } from '../../components/forms/ErrorSummary'
import { WillFormPage } from '../../components/will/WillFormPage'
import { ClearMyAnswersLink } from '../../components/will/WillPage'
import { useWillGuard } from '../../components/will/useWillGuard'
import { proceed } from '../../components/will/nav'
import {
  RecipientFields,
  commitRecipient,
  emptyRecipient,
  recipientErrorItems,
  recipientFromRefs,
  recipientHasError,
  validateRecipient,
  type RecipientErrors,
  type RecipientValue,
} from '../../components/will/recipientEditor'
import { useWillState } from '../../state/will/WillState'
import { changeDestination, nextStep } from '../../state/will/journey'
import { computeDerived } from '../../state/will/routeEngine'
import { formatPercentage, totalPercentageHundredths } from '../../state/will/checkYourAnswers'
import { findOrganisationName, findPerson, fullName } from '../../state/will/format'
import { invalidRemainderFallbackError, percentageError, percentageTotalError, requiredRadioError } from '../../state/will/validation'
import type { RemainderBeneficiary, RemainderFallback, WillAnswers } from '../../state/will/types'

type Mode = 'forward' | 'change'

function recipientName(answers: WillAnswers, b: RemainderBeneficiary): string {
  if (b.recipientType === 'organisation') return findOrganisationName(answers, b.recipientOrgId)
  return fullName(findPerson(answers, b.recipientPersonId)?.name)
}

export function RemainderPage({ mode, recordId }: { mode: Mode; recordId?: string }) {
  const active = useWillGuard()
  const { answers, applyAndGet, newId } = useWillState()
  const navigate = useNavigate()
  const list = answers.remainder

  const editing = recordId ? list.find((b) => b.id === recordId) : undefined
  const [view, setView] = useState<'list' | 'form'>(recordId || list.length === 0 ? 'form' : 'list')
  const idRef = useRef<string>(recordId ?? newId())

  const [recipient, setRecipient] = useState<RecipientValue>(
    editing ? recipientFromRefs(answers, editing.recipientType, editing.recipientPersonId, editing.recipientOrgId) : emptyRecipient(),
  )
  const [percentage, setPercentage] = useState(editing?.percentage ?? '')
  const [fallback, setFallback] = useState<string | undefined>(editing?.fallback)
  const [replacement, setReplacement] = useState<RecipientValue>(
    editing ? recipientFromRefs(answers, editing.replacementType, editing.replacementPersonId, editing.replacementOrgId) : emptyRecipient(),
  )

  const [recipientErrors, setRecipientErrors] = useState<RecipientErrors>({})
  const [pctErr, setPctErr] = useState<string | undefined>()
  const [fallbackErr, setFallbackErr] = useState<string | undefined>()
  const [replacementErrors, setReplacementErrors] = useState<RecipientErrors>({})
  const [attempt, setAttempt] = useState(0)

  // List-view validation. Inline percentage errors are keyed by beneficiary id
  // so each message shows beside its own input and in the error summary.
  const [listItems, setListItems] = useState<ErrorSummaryItem[]>([])
  const [pctErrors, setPctErrors] = useState<Record<string, string>>({})
  const [listAttempt, setListAttempt] = useState(0)
  const listSummaryRef = useRef<HTMLDivElement>(null)

  if (!active) return null

  const otherCount = list.filter((b) => b.id !== idRef.current).length
  const fallbackQuestion =
    recipient.type === 'organisation'
      ? 'What should happen to this share if the organisation no longer exists?'
      : 'What should happen to this share if they die before you?'
  const fallbackOptions =
    recipient.type === 'organisation'
      ? [
          ...(otherCount >= 1 ? [{ value: 'share-among-others', label: 'Share it among the other people or organisations named to receive the remainder' }] : []),
          { value: 'to-replacement', label: 'Give it to another person or organisation' },
        ]
      : [
          ...(otherCount >= 1 ? [{ value: 'share-among-others', label: 'Share it among the other people or organisations named to receive the remainder' }] : []),
          { value: 'to-children', label: 'Give it to their children in equal shares' },
          { value: 'to-replacement', label: 'Give it to another person or organisation' },
        ]

  function resetForm() {
    idRef.current = newId()
    setRecipient(emptyRecipient())
    setPercentage('')
    setFallback(undefined)
    setReplacement(emptyRecipient())
    setRecipientErrors({})
    setPctErr(undefined)
    setFallbackErr(undefined)
    setReplacementErrors({})
  }

  function saveRecord() {
    const re = validateRecipient(answers, recipient, 'Who should receive the remainder of your estate?')
    const pe = percentageError(percentage)
    let fe: string | undefined
    let rre: RecipientErrors = {}
    if (!fallback) fe = requiredRadioError(fallbackQuestion)
    if (fallback === 'to-replacement') rre = validateRecipient(answers, replacement, 'Who should receive the remainder of your estate?')

    setRecipientErrors(re)
    setPctErr(pe)
    setFallbackErr(fe)
    setReplacementErrors(rre)
    setAttempt((a) => a + 1)
    if (recipientHasError(re) || pe || fe || (fallback === 'to-replacement' && recipientHasError(rre))) return

    const id = idRef.current
    applyAndGet((d) => {
      const primary = commitRecipient(d, answers, recipient, newId)
      const record: RemainderBeneficiary = {
        id,
        recipientType: primary.type,
        recipientPersonId: primary.personId,
        recipientOrgId: primary.orgId,
        percentage: percentage.trim(),
        fallback: fallback as RemainderFallback,
      }
      if (fallback === 'to-replacement') {
        const rep = commitRecipient(d, answers, replacement, newId)
        record.replacementType = rep.type
        record.replacementPersonId = rep.personId
        record.replacementOrgId = rep.orgId
      }
      const found = d.remainder.some((b) => b.id === id)
      d.remainder = found ? d.remainder.map((b) => (b.id === id ? record : b)) : [...d.remainder, record]
    })

    if (mode === 'change') {
      // Return to the remainder list so the running total and every fallback are
      // re-validated before the change can return to Check your answers.
      proceed(navigate, mode, 'r2')
      return
    }
    resetForm()
    setView('list')
  }

  function removeRecord(id: string) {
    applyAndGet((d) => {
      d.remainder = d.remainder.filter((b) => b.id !== id)
    })
    if (list.length - 1 === 0) setView('form')
  }

  function beginChange(id: string) {
    const b = list.find((x) => x.id === id)
    if (!b) return
    idRef.current = id
    setRecipient(recipientFromRefs(answers, b.recipientType, b.recipientPersonId, b.recipientOrgId))
    setPercentage(b.percentage ?? '')
    setFallback(b.fallback)
    setReplacement(recipientFromRefs(answers, b.replacementType, b.replacementPersonId, b.replacementOrgId))
    setView('form')
  }

  function setPercentageFor(id: string, v: string) {
    applyAndGet((d) => {
      d.remainder = d.remainder.map((b) => (b.id === id ? { ...b, percentage: v } : b))
    })
  }

  function onContinue() {
    if (list.length === 0) {
      setListItems([{ fieldId: 'r2-add', message: 'Add at least one person or organisation to receive the remainder.' }])
      setListAttempt((a) => a + 1)
      return
    }
    // A beneficiary whose fallback is no longer valid (for example, a
    // share-among-others fallback cleared after the other beneficiaries were
    // removed) is corrected on its own record, not on a percentage field.
    const badFallback = list.find((b) => !b.fallback)
    if (badFallback) {
      setPctErrors({})
      beginChange(badFallback.id)
      setRecipientErrors({})
      setPctErr(undefined)
      setReplacementErrors({})
      setFallbackErr(invalidRemainderFallbackError)
      setAttempt((a) => a + 1)
      return
    }
    // Recalculate percentage errors from the current values on every attempt so
    // corrected errors do not remain. Each message shows inline and in the
    // summary; the total error targets the first beneficiary's percentage field.
    const fieldErrors: Record<string, string> = {}
    const items: ErrorSummaryItem[] = []
    for (const b of list) {
      const pe = percentageError(b.percentage ?? '')
      if (pe) {
        fieldErrors[b.id] = pe
        items.push({ fieldId: `r2-pct-${b.id}`, message: pe })
      }
    }
    if (items.length === 0) {
      const total = totalPercentageHundredths(list)
      if (total !== 10000) {
        const message = percentageTotalError(total)
        fieldErrors[list[0].id] = message
        items.push({ fieldId: `r2-pct-${list[0].id}`, message })
      }
    }
    setPctErrors(fieldErrors)
    setListItems(items)
    setListAttempt((a) => a + 1)
    if (items.length > 0) {
      window.setTimeout(() => listSummaryRef.current?.focus(), 0)
      return
    }
    proceed(navigate, mode, mode === 'change' ? changeDestination(answers, computeDerived(answers)) : nextStep(answers, computeDerived(answers), 'r2'))
  }

  if (view === 'list') {
    const total = formatPercentage(totalPercentageHundredths(list))
    return (
      <div className="page">
        <button type="button" className="govbb-back-link" onClick={() => (mode === 'change' ? navigate(-1) : navigate(-1))}>
          <span className="govbb-back-link__icon" aria-hidden="true">
            ←
          </span>{' '}
          Back
        </button>
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1}>
            Who should receive the remainder of your estate?
          </h1>
        </div>
        <ErrorSummary items={listItems} ref={listSummaryRef} key={listAttempt} />
        <ul className="govbb-summary-list">
          {list.map((b) => (
            <li className="govbb-summary-list__row" key={b.id}>
              <span className="govbb-summary-list__value">
                <span className="task-item__desc" style={{ display: 'block' }}>
                  {recipientName(answers, b)}
                </span>
                <TextInput
                  id={`r2-pct-${b.id}`}
                  label="Percentage of the remainder"
                  value={b.percentage ?? ''}
                  onChange={(v) => setPercentageFor(b.id, v)}
                  error={pctErrors[b.id]}
                />
                <span style={{ display: 'block' }}>
                  <button type="button" className="govbb-btn--link" onClick={() => beginChange(b.id)}>
                    Change<span className="govbb-visually-hidden"> remainder share, {recipientName(answers, b)}</span>
                  </button>{' '}
                  <button type="button" className="govbb-btn--link" onClick={() => removeRecord(b.id)}>
                    Remove<span className="govbb-visually-hidden"> remainder share, {recipientName(answers, b)}</span>
                  </button>
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p className="page__text">
          <strong>Total percentage:</strong> {total}%
        </p>
        <div className="govbb-btn-group">
          <button
            type="button"
            className="govbb-btn--secondary"
            id="r2-add"
            onClick={() => {
              resetForm()
              setView('form')
            }}
          >
            Add another person or organisation
          </button>
          <button type="button" className="govbb-btn" onClick={onContinue}>
            Continue
          </button>
        </div>
        <ClearMyAnswersLink />
      </div>
    )
  }

  const items: ErrorSummaryItem[] = []
  items.push(...recipientErrorItems('r2-recipient', recipientErrors))
  if (pctErr) items.push({ fieldId: 'r2-percentage', message: pctErr })
  if (fallbackErr) items.push({ fieldId: `r2-fallback-${fallbackOptions[0]?.value ?? 'to-replacement'}`, message: fallbackErr })
  items.push(...recipientErrorItems('r2-replacement', replacementErrors))

  return (
    <WillFormPage
      title="Who should receive the remainder of your estate?"
      mode={mode}
      errorItems={items}
      submitAttempt={attempt}
      onSubmit={saveRecord}
    >
      <RecipientFields
        prefix="r2-recipient"
        question="Who should receive the remainder of your estate?"
        answers={answers}
        value={recipient}
        onChange={setRecipient}
        errors={recipientErrors}
      />
      <TextInput id="r2-percentage" label="Percentage of the remainder" value={percentage} onChange={setPercentage} error={pctErr} />
      <RadioGroup name="r2-fallback" legend={fallbackQuestion} options={fallbackOptions} value={fallback} onChange={setFallback} error={fallbackErr} />
      {fallback === 'to-replacement' ? (
        <RecipientFields
          prefix="r2-replacement"
          question="Who should receive the remainder of your estate?"
          answers={answers}
          value={replacement}
          onChange={setReplacement}
          errors={replacementErrors}
        />
      ) : null}
    </WillFormPage>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BackLink } from '../components/navigation/BackLink'
import { ErrorSummary, type ErrorSummaryItem } from '../components/forms/ErrorSummary'
import { RadioGroup } from '../components/forms/RadioGroup'
import { TextInput } from '../components/forms/TextInput'
import { TextArea } from '../components/forms/TextArea'
import { RecoveryView } from '../components/tenancy/RecoveryView'
import { StorageWarning } from '../components/tenancy/StorageWarning'
import { DeleteAnswersAction } from '../components/tenancy/DeleteAnswersAction'
import { InsetText } from '../components/tenancy/InsetText'
import { useStageGate } from '../components/tenancy/useStageGate'
import {
  useTenancyBuilder,
  parseWholeNumber,
  type ItemRecord,
  type YesNo,
  type YesNotYet,
} from '../state/tenancyBuilderContext'
import { STAGES } from '../state/tenancyBuilderStageStatus'

type View = 'decision' | 'form' | 'list'

interface Errors {
  willProvide?: string
  item?: string
  quantity?: string
  conditionChecked?: string
  conditionDescription?: string
}

const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]
const CONDITION_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'not-yet', label: 'Not yet' },
]

function itemDetailLines(rec: ItemRecord): string[] {
  const lines = [rec.quantity]
  if (rec.location) lines.push(rec.location)
  lines.push(
    rec.conditionChecked === 'yes' ? (rec.conditionDescription ?? '') : 'Not checked yet',
  )
  return lines.filter(Boolean)
}

export function TenancyAgreementItemsPage() {
  const navigate = useNavigate()
  const {
    state,
    setItemsAnswer,
    clearItemsRecords,
    setItemDraft,
    clearItemDraft,
    saveItemDraft,
    removeItem,
    startEditingItem,
  } = useTenancyBuilder()

  const gate = useStageGate('items')
  const draft = state.editing?.itemDraft
  const records = state.items?.records ?? []

  const [willProvide, setWillProvide] = useState<YesNo | undefined>(state.items?.willProvide)
  const [view, setView] = useState<View>(() => (draft ? 'form' : 'decision'))
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)
  const [confirmDeleteRecords, setConfirmDeleteRecords] = useState(false)
  const [confirmClearCondition, setConfirmClearCondition] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [focusErrorSummary, setFocusErrorSummary] = useState(false)

  const headingRef = useRef<HTMLHeadingElement>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [view, pendingRemoveId, confirmDeleteRecords, confirmClearCondition])

  useEffect(() => {
    if (focusErrorSummary) {
      errorSummaryRef.current?.focus()
      setFocusErrorSummary(false)
    }
  }, [focusErrorSummary])

  useEffect(() => {
    if (gate.kind !== 'ok') return
    if (view === 'form' && !draft) setItemDraft({})
  }, [gate.kind, view, draft, setItemDraft])

  const summaryItems = useMemo<ErrorSummaryItem[]>(() => {
    const items: ErrorSummaryItem[] = []
    if (errors.willProvide) items.push({ fieldId: 'items-will-provide-yes', message: errors.willProvide })
    if (errors.item) items.push({ fieldId: 'item-name', message: errors.item })
    if (errors.quantity) items.push({ fieldId: 'item-quantity', message: errors.quantity })
    if (errors.conditionChecked)
      items.push({ fieldId: 'item-condition-checked-yes', message: errors.conditionChecked })
    if (errors.conditionDescription)
      items.push({ fieldId: 'item-condition-description', message: errors.conditionDescription })
    return items
  }, [errors])

  if (gate.kind === 'unsuitable')
    return <Navigate to="/renting-home/agreement/not-suitable" replace />
  if (gate.kind === 'missing') return <RecoveryView missing={STAGES[gate.key]} />

  function handleDecisionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!willProvide) {
      setErrors({
        willProvide: 'Select whether the landlord will provide any furniture, appliances or other items.',
      })
      setFocusErrorSummary(true)
      return
    }
    setErrors({})
    if (willProvide === 'yes') {
      setItemsAnswer('yes')
      setView(records.length === 0 ? 'form' : 'list')
      return
    }
    if (records.length > 0) {
      setConfirmDeleteRecords(true)
      return
    }
    setItemsAnswer('no')
    navigate('/renting-home/agreement/repairs')
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: Errors = {}
    if (!draft?.item?.trim()) next.item = 'Enter the item.'
    if (!draft?.quantity?.trim()) {
      next.quantity = 'Enter how many are included.'
    } else {
      const q = parseWholeNumber(draft.quantity)
      if (q === null || q <= 0) next.quantity = 'Enter a whole number greater than 0.'
    }
    if (!draft?.conditionChecked) {
      next.conditionChecked = 'Select whether the item’s condition has been checked.'
    } else if (draft.conditionChecked === 'yes' && !draft?.conditionDescription?.trim()) {
      next.conditionDescription = 'Describe the item’s condition.'
    }
    setErrors(next)
    if (Object.keys(next).length > 0) {
      setFocusErrorSummary(true)
      return
    }
    saveItemDraft()
    setView('list')
  }

  if (confirmDeleteRecords) {
    return (
      <div className="page">
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Delete the furniture and other items?
          </h1>
        </div>
        <StorageWarning />
        <p className="page__text">
          Changing this answer will delete the furniture and other items you added. Your other
          answers will not be affected.
        </p>
        <div className="govbb-btn-group">
          <button
            type="button"
            className="govbb-btn"
            onClick={() => {
              clearItemsRecords()
              setConfirmDeleteRecords(false)
              navigate('/renting-home/agreement/repairs')
            }}
          >
            Delete items
          </button>
          <button
            type="button"
            className="govbb-btn--secondary"
            onClick={() => {
              setWillProvide('yes')
              setConfirmDeleteRecords(false)
            }}
          >
            Cancel
          </button>
        </div>
        <DeleteAnswersAction />
      </div>
    )
  }

  if (confirmClearCondition) {
    return (
      <div className="page">
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Delete the condition you entered?
          </h1>
        </div>
        <StorageWarning />
        <p className="page__text">
          Changing this answer will delete the condition you entered for this item. Your other
          answers will not be affected.
        </p>
        <div className="govbb-btn-group">
          <button
            type="button"
            className="govbb-btn"
            onClick={() => {
              setItemDraft({ conditionChecked: 'not-yet', conditionDescription: undefined })
              setConfirmClearCondition(false)
            }}
          >
            Delete condition
          </button>
          <button
            type="button"
            className="govbb-btn--secondary"
            onClick={() => setConfirmClearCondition(false)}
          >
            Cancel
          </button>
        </div>
        <DeleteAnswersAction />
      </div>
    )
  }

  if (pendingRemoveId) {
    const target = records.find((it) => it.id === pendingRemoveId)
    const name = target ? target.item : 'this item'
    return (
      <div className="page">
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Remove {name}?
          </h1>
        </div>
        <StorageWarning />
        <p className="page__text">
          This will delete {name} from the list of items provided with the home. Your other answers
          will not be affected.
        </p>
        <div className="govbb-btn-group">
          <button
            type="button"
            className="govbb-btn"
            onClick={() => {
              removeItem(pendingRemoveId)
              setPendingRemoveId(null)
              const remaining = records.filter((it) => it.id !== pendingRemoveId)
              setView(remaining.length === 0 ? 'decision' : 'list')
            }}
          >
            Remove {name}
          </button>
          <button
            type="button"
            className="govbb-btn--secondary"
            onClick={() => setPendingRemoveId(null)}
          >
            Cancel
          </button>
        </div>
        <DeleteAnswersAction />
      </div>
    )
  }

  if (view === 'list') {
    return (
      <div className="page">
        <button type="button" className="govbb-back-link" onClick={() => setView('decision')}>
          <span className="govbb-back-link__icon" aria-hidden="true">
            ←
          </span>{' '}
          Back
        </button>
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Furniture and other items
          </h1>
          <p className="page__text">The landlord will provide these items with the home.</p>
        </div>
        <StorageWarning />
        <ul className="govbb-summary-list">
          {records.map((it) => (
            <li className="govbb-summary-list__row" key={it.id}>
              <span className="govbb-summary-list__key">{it.item}</span>
              <span className="govbb-summary-list__value">
                {itemDetailLines(it).map((line, i) => (
                  <span className="task-item__desc" key={i} style={{ display: 'block' }}>
                    {line}
                  </span>
                ))}
                <span style={{ display: 'block' }}>
                  <button
                    type="button"
                    className="govbb-btn--link"
                    onClick={() => {
                      startEditingItem(it.id)
                      setErrors({})
                      setView('form')
                    }}
                  >
                    Change<span className="govbb-visually-hidden"> {it.item}</span>
                  </button>{' '}
                  <button
                    type="button"
                    className="govbb-btn--link"
                    onClick={() => setPendingRemoveId(it.id)}
                  >
                    Remove<span className="govbb-visually-hidden"> {it.item}</span>
                  </button>
                </span>
              </span>
            </li>
          ))}
        </ul>
        <div className="govbb-btn-group">
          <button
            type="button"
            className="govbb-btn--secondary"
            onClick={() => {
              clearItemDraft()
              setErrors({})
              setView('form')
            }}
          >
            Add another item
          </button>
          <button
            type="button"
            className="govbb-btn"
            onClick={() => navigate('/renting-home/agreement/repairs')}
          >
            Continue
          </button>
        </div>
        <DeleteAnswersAction />
      </div>
    )
  }

  if (view === 'form') {
    const conditionChecked = draft?.conditionChecked
    return (
      <div className="page">
        <button type="button" className="govbb-back-link" onClick={() => setView('decision')}>
          <span className="govbb-back-link__icon" aria-hidden="true">
            ←
          </span>{' '}
          Back
        </button>
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Add furniture or another item
          </h1>
        </div>
        <StorageWarning />
        <ErrorSummary items={summaryItems} ref={errorSummaryRef} />
        <form className="govbb-form stack" onSubmit={handleFormSubmit} noValidate>
          <TextInput
            id="item-name"
            label="What item are you adding?"
            value={draft?.item ?? ''}
            onChange={(v) => setItemDraft({ item: v })}
            error={errors.item}
          />
          <TextInput
            id="item-quantity"
            label="How many are included?"
            value={draft?.quantity ?? ''}
            onChange={(v) => setItemDraft({ quantity: v })}
            error={errors.quantity}
          />
          <TextInput
            id="item-location"
            label="Where in the home is the item?"
            optional
            value={draft?.location ?? ''}
            onChange={(v) => setItemDraft({ location: v })}
          />
          <RadioGroup
            name="item-condition-checked"
            legend="Has its condition been checked?"
            options={CONDITION_OPTIONS}
            value={conditionChecked}
            onChange={(v) => {
              const nv = v as YesNotYet
              if (nv === 'not-yet' && draft?.conditionDescription?.trim()) {
                setConfirmClearCondition(true)
              } else if (nv === 'yes') {
                setItemDraft({ conditionChecked: 'yes' })
              } else {
                setItemDraft({ conditionChecked: 'not-yet', conditionDescription: undefined })
              }
            }}
            error={errors.conditionChecked}
          />
          {conditionChecked === 'yes' ? (
            <TextArea
              id="item-condition-description"
              label="Describe the condition"
              hint="Include any existing damage."
              value={draft?.conditionDescription ?? ''}
              onChange={(v) => setItemDraft({ conditionDescription: v })}
              error={errors.conditionDescription}
            />
          ) : null}
          {conditionChecked === 'not-yet' ? (
            <InsetText>
              <p>This will be shown as something to check before the document is signed.</p>
            </InsetText>
          ) : null}
          <div className="govbb-btn-group">
            <button type="submit" className="govbb-btn">
              Save and continue
            </button>
          </div>
        </form>
        <DeleteAnswersAction />
      </div>
    )
  }

  return (
    <div className="page">
      <BackLink to="/renting-home/agreement/occupants">Back</BackLink>
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Furniture and other items
        </h1>
      </div>
      <StorageWarning />
      <ErrorSummary items={summaryItems} ref={errorSummaryRef} />
      <form className="govbb-form stack" onSubmit={handleDecisionSubmit} noValidate>
        <RadioGroup
          name="items-will-provide"
          legend="Will the landlord provide any furniture, appliances or other items with the home?"
          options={YES_NO_OPTIONS}
          value={willProvide}
          onChange={(v) => setWillProvide(v as YesNo)}
          error={errors.willProvide}
        />
        <div className="govbb-btn-group">
          <button type="submit" className="govbb-btn">
            Continue
          </button>
        </div>
      </form>
      <DeleteAnswersAction />
    </div>
  )
}

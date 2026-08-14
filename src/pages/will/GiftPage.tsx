import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RadioGroup } from '../../components/forms/RadioGroup'
import { TextInput } from '../../components/forms/TextInput'
import type { ErrorSummaryItem } from '../../components/forms/ErrorSummary'
import { WillFormPage } from '../../components/will/WillFormPage'
import { RepeatableRecordList } from '../../components/will/RepeatableRecordList'
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
import { findOrganisationName, findPerson, fullName } from '../../state/will/format'
import { currencyError, moneyAmountError, requiredRadioError, requiredTextError } from '../../state/will/validation'
import type { Gift, GiftKind, WillAnswers } from '../../state/will/types'

type Mode = 'forward' | 'change'

const GIFT_KINDS = [
  { value: 'money', label: 'An amount of money' },
  { value: 'item', label: 'An item' },
  { value: 'land', label: 'Land or a home' },
  { value: 'other', label: 'Something else' },
]

const FALLBACK_OPTIONS = [
  { value: 'to-estate', label: 'Add the gift to everything left in my estate' },
  { value: 'to-replacement', label: 'Give the gift to another person or organisation' },
]

function giftValue(answers: WillAnswers, gift: Gift): string {
  if (gift.kind === 'money') return [gift.currency, gift.amount].map((p) => (p ?? '').trim()).filter(Boolean).join(' ')
  return (gift.description ?? '').trim()
}

function recipientName(answers: WillAnswers, gift: Gift): string {
  if (gift.recipientType === 'organisation') return findOrganisationName(answers, gift.recipientOrgId)
  return fullName(findPerson(answers, gift.recipientPersonId)?.name)
}

export function GiftPage({ mode, recordId }: { mode: Mode; recordId?: string }) {
  const active = useWillGuard()
  const { answers, applyAndGet, newId } = useWillState()
  const navigate = useNavigate()
  const gifts = answers.gifts

  const editingGift = recordId ? gifts.find((g) => g.id === recordId) : undefined
  const [view, setView] = useState<'list' | 'form'>(recordId || gifts.length === 0 ? 'form' : 'list')
  const idRef = useRef<string>(recordId ?? newId())

  const [kind, setKind] = useState<string | undefined>(editingGift?.kind)
  const [amount, setAmount] = useState(editingGift?.amount ?? '')
  const [currency, setCurrency] = useState(editingGift?.currency ?? '')
  const [description, setDescription] = useState(editingGift?.description ?? '')
  const [recipient, setRecipient] = useState<RecipientValue>(
    editingGift ? recipientFromRefs(answers, editingGift.recipientType, editingGift.recipientPersonId, editingGift.recipientOrgId) : emptyRecipient(),
  )
  const [fallback, setFallback] = useState<string | undefined>(editingGift?.fallback)
  const [replacement, setReplacement] = useState<RecipientValue>(
    editingGift ? recipientFromRefs(answers, editingGift.replacementType, editingGift.replacementPersonId, editingGift.replacementOrgId) : emptyRecipient(),
  )

  const [kindErr, setKindErr] = useState<string | undefined>()
  const [amountErr, setAmountErr] = useState<string | undefined>()
  const [currencyErr, setCurrencyErr] = useState<string | undefined>()
  const [descErr, setDescErr] = useState<string | undefined>()
  const [recipientErrors, setRecipientErrors] = useState<RecipientErrors>({})
  const [fallbackErr, setFallbackErr] = useState<string | undefined>()
  const [replacementErrors, setReplacementErrors] = useState<RecipientErrors>({})
  const [attempt, setAttempt] = useState(0)
  const [listErr, setListErr] = useState<string | undefined>()

  if (!active) return null

  const fallbackQuestion =
    recipient.type === 'organisation'
      ? 'What should happen if this organisation no longer exists?'
      : 'What should happen if this person dies before you?'

  function resetForm() {
    idRef.current = newId()
    setKind(undefined)
    setAmount('')
    setCurrency('')
    setDescription('')
    setRecipient(emptyRecipient())
    setFallback(undefined)
    setReplacement(emptyRecipient())
    setKindErr(undefined)
    setAmountErr(undefined)
    setCurrencyErr(undefined)
    setDescErr(undefined)
    setRecipientErrors({})
    setFallbackErr(undefined)
    setReplacementErrors({})
  }

  function saveRecord() {
    let ke: string | undefined
    let ae: string | undefined
    let ce: string | undefined
    let de: string | undefined
    if (!kind) ke = requiredRadioError('What do you want to give?')
    if (kind === 'money') {
      ae = moneyAmountError(amount)
      ce = currencyError(currency)
    } else if (kind) {
      de = requiredTextError(description, 'Enter description of the gift.')
    }
    const re = validateRecipient(answers, recipient, 'Who do you want to receive this gift?')
    let fe: string | undefined
    let rre: RecipientErrors = {}
    if (!fallback) fe = requiredRadioError(fallbackQuestion)
    if (fallback === 'to-replacement') rre = validateRecipient(answers, replacement, 'Who do you want to receive this gift?')

    setKindErr(ke)
    setAmountErr(ae)
    setCurrencyErr(ce)
    setDescErr(de)
    setRecipientErrors(re)
    setFallbackErr(fe)
    setReplacementErrors(rre)
    setAttempt((a) => a + 1)

    if (ke || ae || ce || de || recipientHasError(re) || fe || (fallback === 'to-replacement' && recipientHasError(rre))) return

    const id = idRef.current
    const next = applyAndGet((d) => {
      const primary = commitRecipient(d, answers, recipient, newId)
      const gift: Gift = {
        id,
        kind: kind as GiftKind,
        amount: kind === 'money' ? amount.trim() : undefined,
        currency: kind === 'money' ? currency.trim() : undefined,
        description: kind !== 'money' ? description.trim() : undefined,
        recipientType: primary.type,
        recipientPersonId: primary.personId,
        recipientOrgId: primary.orgId,
        fallback: fallback as Gift['fallback'],
      }
      if (fallback === 'to-replacement') {
        const rep = commitRecipient(d, answers, replacement, newId)
        gift.replacementType = rep.type
        gift.replacementPersonId = rep.personId
        gift.replacementOrgId = rep.orgId
      }
      const found = d.gifts.some((g) => g.id === id)
      d.gifts = found ? d.gifts.map((g) => (g.id === id ? gift : g)) : [...d.gifts, gift]
    })

    if (mode === 'change') {
      proceed(navigate, mode, changeDestination(next, computeDerived(next)))
      return
    }
    resetForm()
    setView('list')
  }

  function removeRecord(id: string) {
    applyAndGet((d) => {
      d.gifts = d.gifts.filter((g) => g.id !== id)
    })
    if (gifts.length - 1 === 0) setView('form')
  }

  function beginChange(id: string) {
    const g = gifts.find((x) => x.id === id)
    if (!g) return
    idRef.current = id
    setKind(g.kind)
    setAmount(g.amount ?? '')
    setCurrency(g.currency ?? '')
    setDescription(g.description ?? '')
    setRecipient(recipientFromRefs(answers, g.recipientType, g.recipientPersonId, g.recipientOrgId))
    setFallback(g.fallback)
    setReplacement(recipientFromRefs(answers, g.replacementType, g.replacementPersonId, g.replacementOrgId))
    setView('form')
  }

  function onContinue() {
    if (gifts.length === 0) {
      setListErr('Add at least one specific gift.')
      return
    }
    proceed(navigate, mode, mode === 'change' ? changeDestination(answers, computeDerived(answers)) : nextStep(answers, computeDerived(answers), 'sg2'))
  }

  if (view === 'list') {
    return (
      <RepeatableRecordList
        title="Specific gifts"
        records={gifts.map((g) => ({
          id: g.id,
          lines: [giftValue(answers, g), recipientName(answers, g)].filter(Boolean),
          changeName: `specific gift, ${giftValue(answers, g)}`,
          removeName: `specific gift, ${giftValue(answers, g)}`,
        }))}
        onChange={beginChange}
        onRemove={removeRecord}
        onAdd={() => {
          resetForm()
          setView('form')
        }}
        onContinue={onContinue}
        addLabel="Add another gift"
      />
    )
  }

  const items: ErrorSummaryItem[] = []
  if (kindErr) items.push({ fieldId: 'gift-kind-money', message: kindErr })
  if (amountErr) items.push({ fieldId: 'gift-amount', message: amountErr })
  if (currencyErr) items.push({ fieldId: 'gift-currency', message: currencyErr })
  if (descErr) items.push({ fieldId: 'gift-description', message: descErr })
  items.push(...recipientErrorItems('gift-recipient', recipientErrors))
  if (fallbackErr) items.push({ fieldId: 'gift-fallback-to-estate', message: fallbackErr })
  items.push(...recipientErrorItems('gift-replacement', replacementErrors))

  return (
    <WillFormPage
      title="Add a gift"
      mode={mode}
      errorItems={items}
      submitAttempt={attempt}
      onSubmit={saveRecord}
    >
      <RadioGroup name="gift-kind" legend="What do you want to give?" options={GIFT_KINDS} value={kind} onChange={setKind} error={kindErr} />
      {kind === 'money' ? (
        <>
          <TextInput id="gift-amount" label="Amount" value={amount} onChange={setAmount} error={amountErr} />
          <TextInput id="gift-currency" label="Currency" value={currency} onChange={setCurrency} error={currencyErr} />
        </>
      ) : null}
      {kind && kind !== 'money' ? (
        <TextInput id="gift-description" label="Description of the gift" value={description} onChange={setDescription} error={descErr} />
      ) : null}

      <RecipientFields
        prefix="gift-recipient"
        question="Who do you want to receive this gift?"
        answers={answers}
        value={recipient}
        onChange={setRecipient}
        errors={recipientErrors}
      />

      <RadioGroup name="gift-fallback" legend={fallbackQuestion} options={FALLBACK_OPTIONS} value={fallback} onChange={setFallback} error={fallbackErr} />
      {fallback === 'to-replacement' ? (
        <RecipientFields
          prefix="gift-replacement"
          question="Who do you want to receive this gift?"
          answers={answers}
          value={replacement}
          onChange={setReplacement}
          errors={replacementErrors}
        />
      ) : null}
      {listErr ? <p className="govbb-error-message">{listErr}</p> : null}
    </WillFormPage>
  )
}

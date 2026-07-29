import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackLink } from '../components/navigation/BackLink'
import { RadioGroup } from '../components/forms/RadioGroup'
import { ErrorSummary, type ErrorSummaryItem } from '../components/forms/ErrorSummary'
import { StorageWarning } from '../components/tenancy/StorageWarning'
import { DeleteAnswersAction } from '../components/tenancy/DeleteAnswersAction'
import {
  useTenancyBuilder,
  type AgreementSituation,
  type ScopeAnswers,
  type WhatIsRented,
  type YesNo,
} from '../state/tenancyBuilderContext'

const Q1 = 'q1-renting-home-barbados'
const Q2 = 'q2-what-rented'
const Q3 = 'q3-private-home-only'
const Q4 = 'q4-agreement-situation'

const Q1_ANCHOR = `${Q1}-yes`
const Q2_ANCHOR = `${Q2}-house-apartment`
const Q3_ANCHOR = `${Q3}-yes`
const Q4_ANCHOR = `${Q4}-preparing-new`

const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

const WHAT_IS_RENTED_OPTIONS = [
  { value: 'house-apartment', label: 'A house or apartment' },
  {
    value: 'self-contained-part',
    label: 'A self-contained part of a house or building',
    hint: 'It has its own living space and is not shared with the landlord.',
  },
  { value: 'room-shared', label: 'A room in someone else’s home' },
  { value: 'business', label: 'Business premises' },
  { value: 'land', label: 'Land only' },
  { value: 'other', label: 'Something else' },
]

const AGREEMENT_SITUATION_OPTIONS = [
  {
    value: 'preparing-new',
    label: 'The landlord and tenant are preparing a new agreement before the tenancy starts',
  },
  { value: 'change-existing', label: 'They want to change or replace an agreement that has already started' },
  { value: 'disagree', label: 'They disagree about the tenancy' },
  { value: 'asked-to-leave', label: 'Someone has been asked to leave' },
]

const ERROR_Q1 = 'Select whether the agreement is for renting a home in Barbados'
const ERROR_Q2 = 'Select what will be rented'
const ERROR_Q3 = 'Select whether the home will be used only as a private home'
const ERROR_Q4 = 'Select what is happening with the agreement'

interface Errors {
  q1?: string
  q2?: string
  q3?: string
  q4?: string
}

function isSuitable(answers: ScopeAnswers | undefined): boolean {
  if (!answers) return false
  return (
    answers.forRentingHomeBarbados === 'yes' &&
    (answers.whatIsRented === 'house-apartment' ||
      answers.whatIsRented === 'self-contained-part') &&
    answers.privateHomeOnly === 'yes' &&
    answers.agreementSituation === 'preparing-new'
  )
}

export function TenancyAgreementScopePage() {
  const navigate = useNavigate()
  const {
    state,
    setScope,
    clearFromLandlordsOnwards,
    clearHomeIdentifiers,
  } = useTenancyBuilder()

  // Radio selections stay in this local draft until the user selects Continue.
  // state.scope only changes on the suitable / no-downstream / confirmed-delete
  // paths inside handleSubmit and the holding view. This preserves the last
  // confirmed scope if the user leaves the page without submitting.
  const [draft, setDraft] = useState<ScopeAnswers>(() => state.scope ?? {})

  // Property-type at mount (i.e. the previously confirmed value) is used to
  // decide whether a suitable property-type change should clear the
  // now-incompatible home identifier field.
  const previousWhatIsRented = useRef(state.scope?.whatIsRented).current
  const hasDownstreamData = useMemo(() => {
    return !!(
      state.landlords?.length ||
      state.agent ||
      state.tenants?.length ||
      state.home ||
      state.dates
    )
  }, [state.landlords, state.agent, state.tenants, state.home, state.dates])

  const [errors, setErrors] = useState<Errors>({})
  const [focusErrorSummary, setFocusErrorSummary] = useState(false)
  const [confirmingUnsuitable, setConfirmingUnsuitable] = useState(false)

  const headingRef = useRef<HTMLHeadingElement>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [confirmingUnsuitable])

  useEffect(() => {
    if (focusErrorSummary) {
      errorSummaryRef.current?.focus()
      setFocusErrorSummary(false)
    }
  }, [focusErrorSummary])

  const summaryItems = useMemo<ErrorSummaryItem[]>(() => {
    const items: ErrorSummaryItem[] = []
    if (errors.q1) items.push({ fieldId: Q1_ANCHOR, message: errors.q1 })
    if (errors.q2) items.push({ fieldId: Q2_ANCHOR, message: errors.q2 })
    if (errors.q3) items.push({ fieldId: Q3_ANCHOR, message: errors.q3 })
    if (errors.q4) items.push({ fieldId: Q4_ANCHOR, message: errors.q4 })
    return items
  }, [errors])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: Errors = {}
    if (!draft.forRentingHomeBarbados) next.q1 = ERROR_Q1
    if (!draft.whatIsRented) next.q2 = ERROR_Q2
    if (!draft.privateHomeOnly) next.q3 = ERROR_Q3
    if (!draft.agreementSituation) next.q4 = ERROR_Q4
    setErrors(next)

    if (Object.keys(next).length > 0) {
      setFocusErrorSummary(true)
      return
    }

    if (isSuitable(draft)) {
      // Property-type change (still suitable) — clear only the incompatible
      // home identifier field, preserve everything else.
      if (
        previousWhatIsRented &&
        draft.whatIsRented &&
        previousWhatIsRented !== draft.whatIsRented &&
        state.home
      ) {
        clearHomeIdentifiers(draft.whatIsRented)
      }
      setScope(draft)
      navigate('/renting-home/agreement/landlords')
      return
    }

    // Unsuitable outcome. If there is downstream data, hold the draft locally
    // and show the deletion-warning view; state.scope is not written until the
    // user confirms deletion.
    if (hasDownstreamData) {
      setConfirmingUnsuitable(true)
      return
    }
    setScope(draft)
    navigate('/renting-home/agreement/not-suitable')
  }

  if (confirmingUnsuitable) {
    return (
      <div className="page">
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            This will delete your other answers
          </h1>
        </div>
        <StorageWarning />
        <p className="page__text">
          Your new answers mean you cannot prepare this agreement here.
        </p>
        <p className="page__text">
          If you continue, we will save your new answers and delete the landlord, agent or manager,
          tenant, home and date information you entered.
        </p>
        <p className="page__text">You can cancel to keep your saved answers.</p>
        <div className="govbb-btn-group">
          <button
            type="button"
            className="govbb-btn"
            onClick={() => {
              // Commit the held unsuitable draft, then clear the downstream
              // stages and drafts before routing to the safe exit.
              setScope(draft)
              clearFromLandlordsOnwards()
              setConfirmingUnsuitable(false)
              navigate('/renting-home/agreement/not-suitable')
            }}
          >
            Continue and delete the answers
          </button>
          <button
            type="button"
            className="govbb-btn--secondary"
            onClick={() => {
              // Discard the local unsuitable draft and reset the form to the
              // previously confirmed scope. state.scope was never written, so
              // downstream answers are already untouched.
              setDraft(state.scope ?? {})
              setConfirmingUnsuitable(false)
            }}
          >
            Cancel
          </button>
        </div>
        <DeleteAnswersAction />
      </div>
    )
  }

  return (
    <div className="page">
      <BackLink to="/renting-home/agreement">Back</BackLink>
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Check if you can prepare an agreement here
        </h1>
        <p className="page__text">
          Answer these questions to check whether you can prepare a draft agreement for renting a
          home in Barbados.
        </p>
      </div>

      <StorageWarning />
      <ErrorSummary items={summaryItems} ref={errorSummaryRef} />

      <form className="govbb-form stack" onSubmit={handleSubmit} noValidate>
        <RadioGroup
          name={Q1}
          legend="Is the agreement for renting a home in Barbados?"
          options={YES_NO_OPTIONS}
          value={draft.forRentingHomeBarbados}
          onChange={(v) => setDraft((d) => ({ ...d, forRentingHomeBarbados: v as YesNo }))}
          error={errors.q1}
        />
        <RadioGroup
          name={Q2}
          legend="What will be rented?"
          options={WHAT_IS_RENTED_OPTIONS}
          value={draft.whatIsRented}
          onChange={(v) => setDraft((d) => ({ ...d, whatIsRented: v as WhatIsRented }))}
          error={errors.q2}
        />
        <RadioGroup
          name={Q3}
          legend="Will the home be used only as a private home?"
          options={YES_NO_OPTIONS}
          value={draft.privateHomeOnly}
          onChange={(v) => setDraft((d) => ({ ...d, privateHomeOnly: v as YesNo }))}
          error={errors.q3}
        />
        <RadioGroup
          name={Q4}
          legend="What is happening with the agreement?"
          options={AGREEMENT_SITUATION_OPTIONS}
          value={draft.agreementSituation}
          onChange={(v) => setDraft((d) => ({ ...d, agreementSituation: v as AgreementSituation }))}
          error={errors.q4}
        />
        <div className="prototype-notice" role="note">
          <p>
            Your answers are kept in this browser tab while you prepare the draft. They are not sent
            to GovTech.
          </p>
        </div>
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

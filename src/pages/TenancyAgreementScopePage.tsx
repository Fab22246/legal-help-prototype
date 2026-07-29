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
  const scope = state.scope ?? {}

  // Snapshot the previously saved scope at mount so Cancel from the "delete
  // downstream" confirmation can restore it. Also snapshot the what-is-rented
  // value so we can detect a compatible change between the two suitable
  // property types.
  const savedScopeSnapshot = useRef<ScopeAnswers | undefined>(state.scope).current
  const previousWhatIsRented = useRef(scope.whatIsRented).current
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
    if (!scope.forRentingHomeBarbados) next.q1 = ERROR_Q1
    if (!scope.whatIsRented) next.q2 = ERROR_Q2
    if (!scope.privateHomeOnly) next.q3 = ERROR_Q3
    if (!scope.agreementSituation) next.q4 = ERROR_Q4
    setErrors(next)

    if (Object.keys(next).length > 0) {
      setFocusErrorSummary(true)
      return
    }

    if (isSuitable(scope)) {
      // Property-type change (still suitable) — clear only the incompatible
      // home identifier field, preserve everything else.
      if (
        previousWhatIsRented &&
        scope.whatIsRented &&
        previousWhatIsRented !== scope.whatIsRented &&
        state.home
      ) {
        clearHomeIdentifiers(scope.whatIsRented)
      }
      navigate('/renting-home/agreement/landlords')
      return
    }

    // Unsuitable outcome. If there is downstream data, warn before clearing.
    if (hasDownstreamData) {
      setConfirmingUnsuitable(true)
      return
    }
    navigate('/renting-home/agreement/not-suitable')
  }

  if (confirmingUnsuitable) {
    return (
      <div className="page">
        <BackLink to="/renting-home/agreement/scope">Back</BackLink>
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            This will delete your other answers
          </h1>
        </div>
        <StorageWarning />
        <p className="page__text">
          Your new answers mean this builder cannot help with the agreement.
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
              // The newly selected scope answers are already in state (radios
              // committed on click). Confirming persists them and clears the
              // downstream stages and drafts.
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
              // Restore the form (and state) to the previously saved scope so
              // the discarded unsuitable selections do not appear as though
              // they were saved. Downstream answers are untouched.
              if (savedScopeSnapshot) {
                setScope({
                  forRentingHomeBarbados: savedScopeSnapshot.forRentingHomeBarbados,
                  whatIsRented: savedScopeSnapshot.whatIsRented,
                  privateHomeOnly: savedScopeSnapshot.privateHomeOnly,
                  agreementSituation: savedScopeSnapshot.agreementSituation,
                })
              }
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
          Check if this builder is suitable
        </h1>
        <p className="page__text">
          This builder helps you prepare a draft agreement for renting a home in Barbados. It does
          not give legal advice.
        </p>
      </div>

      <StorageWarning />
      <ErrorSummary items={summaryItems} ref={errorSummaryRef} />

      <form className="govbb-form stack" onSubmit={handleSubmit} noValidate>
        <RadioGroup
          name={Q1}
          legend="Is the agreement for renting a home in Barbados?"
          options={YES_NO_OPTIONS}
          value={scope.forRentingHomeBarbados}
          onChange={(v) => setScope({ forRentingHomeBarbados: v as YesNo })}
          error={errors.q1}
        />
        <RadioGroup
          name={Q2}
          legend="What will be rented?"
          options={WHAT_IS_RENTED_OPTIONS}
          value={scope.whatIsRented}
          onChange={(v) => setScope({ whatIsRented: v as WhatIsRented })}
          error={errors.q2}
        />
        <RadioGroup
          name={Q3}
          legend="Will the home be used only as a private home?"
          options={YES_NO_OPTIONS}
          value={scope.privateHomeOnly}
          onChange={(v) => setScope({ privateHomeOnly: v as YesNo })}
          error={errors.q3}
        />
        <RadioGroup
          name={Q4}
          legend="What is happening with the agreement?"
          options={AGREEMENT_SITUATION_OPTIONS}
          value={scope.agreementSituation}
          onChange={(v) => setScope({ agreementSituation: v as AgreementSituation })}
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

import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BackLink } from '../components/navigation/BackLink'
import { RadioGroup } from '../components/forms/RadioGroup'
import { ErrorSummary, type ErrorSummaryItem } from '../components/forms/ErrorSummary'
import {
  useTenancyBuilder,
  type AgreementSituation,
  type WhatIsRented,
  type YesNo,
} from '../state/tenancyBuilderContext'

// Field-name constants — used for the radio input `name`, for the id of the
// first radio in each group (which is the anchor target for its error-summary
// link), and for keying inline error messages.
const Q1 = 'q1-renting-home-barbados'
const Q2 = 'q2-what-rented'
const Q3 = 'q3-private-home-only'
const Q4 = 'q4-agreement-situation'

// Each question's first radio value — pairs with the RadioGroup id scheme
// (`${name}-${value}`) to build the anchor id used by the error summary.
const Q1_FIRST: YesNo = 'yes'
const Q2_FIRST: WhatIsRented = 'house-apartment'
const Q3_FIRST: YesNo = 'yes'
const Q4_FIRST: AgreementSituation = 'preparing-new'

const Q1_ANCHOR = `${Q1}-${Q1_FIRST}`
const Q2_ANCHOR = `${Q2}-${Q2_FIRST}`
const Q3_ANCHOR = `${Q3}-${Q3_FIRST}`
const Q4_ANCHOR = `${Q4}-${Q4_FIRST}`

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

type View = 'form' | 'suitable'

// Scope check for the tenancy-agreement builder. Four required radio questions;
// suitable combinations show an in-page holding state, everything else routes
// to the safe exit. Errors show only after Continue is pressed.
export function TenancyAgreementScopePage() {
  const navigate = useNavigate()
  const { state, setScope } = useTenancyBuilder()
  const scope = state.scope ?? {}

  const [view, setView] = useState<View>('form')
  const [errors, setErrors] = useState<Errors>({})

  const headingRef = useRef<HTMLHeadingElement>(null)
  const holdingHeadingRef = useRef<HTMLHeadingElement>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)

  // Focus the H1 when the page mounts (route navigation) and when the user
  // returns to the form view from the holding state.
  useEffect(() => {
    if (view === 'form') {
      headingRef.current?.focus()
    } else {
      holdingHeadingRef.current?.focus()
    }
  }, [view])

  // Errors are only shown after Continue is pressed. When the error set
  // becomes non-empty (or changes while still non-empty), move focus to the
  // error summary so keyboard users hear the alert and can act on it.
  const [focusErrorSummary, setFocusErrorSummary] = useState(false)
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

  function isSuitable(answers: typeof scope): boolean {
    return (
      answers.forRentingHomeBarbados === 'yes' &&
      (answers.whatIsRented === 'house-apartment' ||
        answers.whatIsRented === 'self-contained-part') &&
      answers.privateHomeOnly === 'yes' &&
      answers.agreementSituation === 'preparing-new'
    )
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: Errors = {}
    if (!scope.forRentingHomeBarbados) next.q1 = ERROR_Q1
    if (!scope.whatIsRented) next.q2 = ERROR_Q2
    if (!scope.privateHomeOnly) next.q3 = ERROR_Q3
    if (!scope.agreementSituation) next.q4 = ERROR_Q4
    setErrors(next)

    if (Object.keys(next).length > 0) {
      // Move focus to the error summary on failed validation. The actual
      // focus() call runs from the effect above once React has committed the
      // rendered ErrorSummary — a raw call here would fire before the ref
      // resolves.
      setFocusErrorSummary(true)
      return
    }

    if (isSuitable(scope)) {
      setView('suitable')
    } else {
      navigate('/renting-home/agreement/not-suitable')
    }
  }

  if (view === 'suitable') {
    return (
      <div className="page">
        <BackLink to="/renting-home/agreement">Back</BackLink>
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={holdingHeadingRef}>
            Check if this builder is suitable
          </h1>
        </div>

        <section className="stack--tight prototype-notice" role="note" aria-label="Prototype holding state">
          <h2 className="card-group__title">You can use this builder</h2>
          <p className="page__text">
            This agreement is within the scope of the tenancy-agreement builder.
          </p>
          <p className="page__text">
            The questions about the landlord, tenant, home and agreed terms will be added in the next
            build stage.
          </p>
        </section>

        <section className="stack--tight">
          <p className="page__text">
            <button
              type="button"
              className="govbb-btn--link"
              onClick={() => setView('form')}
            >
              Change these answers
            </button>
          </p>
          <p className="page__text">
            <Link className="govbb-link-default" to="/renting-home">
              Understand renting a home
            </Link>
          </p>
        </section>
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
    </div>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BackLink } from '../components/navigation/BackLink'
import { ErrorSummary, type ErrorSummaryItem } from '../components/forms/ErrorSummary'
import { TextInput } from '../components/forms/TextInput'
import { RecoveryView } from '../components/tenancy/RecoveryView'
import { StorageWarning } from '../components/tenancy/StorageWarning'
import { DeleteAnswersAction } from '../components/tenancy/DeleteAnswersAction'
import { useStageGate } from '../components/tenancy/useStageGate'
import {
  PARISHES,
  useTenancyBuilder,
  type BarbadosAddress,
  type Parish,
} from '../state/tenancyBuilderContext'
import { STAGES } from '../state/tenancyBuilderStageStatus'

interface Errors {
  addressLine1?: string
  townOrArea?: string
  parish?: string
  selfContainedIdentifier?: string
}

export function TenancyAgreementHomePage() {
  const navigate = useNavigate()
  const { state, saveHome } = useTenancyBuilder()
  const gate = useStageGate('home')

  const [address, setAddress] = useState<Partial<BarbadosAddress>>(() => ({
    addressLine1: state.home?.address.addressLine1 ?? '',
    addressLine2: state.home?.address.addressLine2 ?? '',
    townOrArea: state.home?.address.townOrArea ?? '',
    parish: state.home?.address.parish,
  }))
  const [sci, setSci] = useState(state.home?.selfContainedIdentifier ?? '')
  const [oi, setOi] = useState(state.home?.optionalIdentifier ?? '')
  const [errors, setErrors] = useState<Errors>({})
  const [focusErrorSummary, setFocusErrorSummary] = useState(false)

  const headingRef = useRef<HTMLHeadingElement>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  useEffect(() => {
    if (focusErrorSummary) {
      errorSummaryRef.current?.focus()
      setFocusErrorSummary(false)
    }
  }, [focusErrorSummary])

  const whatIsRented = state.scope?.whatIsRented
  const isSelfContained = whatIsRented === 'self-contained-part'

  const summaryItems = useMemo<ErrorSummaryItem[]>(() => {
    const items: ErrorSummaryItem[] = []
    if (errors.addressLine1) items.push({ fieldId: 'home-line1', message: errors.addressLine1 })
    if (errors.townOrArea) items.push({ fieldId: 'home-town', message: errors.townOrArea })
    if (errors.parish) items.push({ fieldId: 'home-parish', message: errors.parish })
    if (errors.selfContainedIdentifier)
      items.push({ fieldId: 'home-self-contained-id', message: errors.selfContainedIdentifier })
    return items
  }, [errors])

  if (gate.kind === 'unsuitable')
    return <Navigate to="/renting-home/agreement/not-suitable" replace />
  if (gate.kind === 'missing') return <RecoveryView missing={STAGES[gate.key]} />

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: Errors = {}
    if (!address.addressLine1) next.addressLine1 = 'Enter address line 1'
    if (!address.townOrArea) next.townOrArea = 'Enter the town or area'
    if (!address.parish) next.parish = 'Select a parish'
    if (isSelfContained && !sci) {
      next.selfContainedIdentifier = 'Enter how this part of the building is identified'
    }
    setErrors(next)
    if (Object.keys(next).length > 0) {
      setFocusErrorSummary(true)
      return
    }
    const home: import('../state/tenancyBuilderContext').HomeStage = {
      address: {
        addressLine1: address.addressLine1!,
        addressLine2: address.addressLine2 || undefined,
        townOrArea: address.townOrArea!,
        parish: address.parish!,
      },
    }
    if (isSelfContained) {
      home.selfContainedIdentifier = sci
    } else if (oi) {
      home.optionalIdentifier = oi
    }
    saveHome(home)
    navigate('/renting-home/agreement/dates')
  }

  return (
    <div className="page">
      <BackLink to="/renting-home/agreement/tenants">Back</BackLink>
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Home being rented
        </h1>
      </div>
      <StorageWarning />
      <ErrorSummary items={summaryItems} ref={errorSummaryRef} />
      <form className="govbb-form stack" onSubmit={handleSubmit} noValidate>
        <TextInput
          id="home-line1"
          label="Address line 1"
          value={address.addressLine1 ?? ''}
          onChange={(v) => setAddress((a) => ({ ...a, addressLine1: v }))}
          error={errors.addressLine1}
        />
        <TextInput
          id="home-line2"
          label="Address line 2"
          value={address.addressLine2 ?? ''}
          onChange={(v) => setAddress((a) => ({ ...a, addressLine2: v }))}
          optional
        />
        <TextInput
          id="home-town"
          label="Town or area"
          value={address.townOrArea ?? ''}
          onChange={(v) => setAddress((a) => ({ ...a, townOrArea: v }))}
          error={errors.townOrArea}
        />
        <div className="govbb-form-group">
          <label className="govbb-label" htmlFor="home-parish">
            Parish
          </label>
          <select
            className="govbb-input"
            id="home-parish"
            name="home-parish"
            value={address.parish ?? ''}
            onChange={(e) => setAddress((a) => ({ ...a, parish: (e.target.value || undefined) as Parish | undefined }))}
            aria-describedby={errors.parish ? 'home-parish-error' : undefined}
            aria-invalid={errors.parish ? true : undefined}
          >
            <option value="">Select a parish</option>
            {PARISHES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          {errors.parish ? (
            <p className="govbb-error-message" id="home-parish-error">
              {errors.parish}
            </p>
          ) : null}
        </div>

        {isSelfContained ? (
          <TextInput
            id="home-self-contained-id"
            label="How is this part of the building identified?"
            hint="For example, Apartment 3, the upstairs unit or the unit on the left."
            value={sci}
            onChange={setSci}
            error={errors.selfContainedIdentifier}
          />
        ) : (
          <TextInput
            id="home-optional-id"
            label="Apartment, unit or other identifying detail"
            value={oi}
            onChange={setOi}
            optional
          />
        )}

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

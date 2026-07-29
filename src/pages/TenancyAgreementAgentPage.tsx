import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BackLink } from '../components/navigation/BackLink'
import { ErrorSummary, type ErrorSummaryItem } from '../components/forms/ErrorSummary'
import { RadioGroup } from '../components/forms/RadioGroup'
import { PartyNameFields } from '../components/tenancy/PartyNameFields'
import { PartyAddressFields } from '../components/tenancy/PartyAddressFields'
import { RecoveryView } from '../components/tenancy/RecoveryView'
import { StorageWarning } from '../components/tenancy/StorageWarning'
import { DeleteAnswersAction } from '../components/tenancy/DeleteAnswersAction'
import { useStageGate } from '../components/tenancy/useStageGate'
import {
  useTenancyBuilder,
  type BarbadosAddress,
  type OverseasAddress,
  type PartyAddress,
  type PartyType,
  type PersonName,
  type YesNo,
} from '../state/tenancyBuilderContext'
import { STAGES } from '../state/tenancyBuilderStageStatus'

interface Errors {
  hasAgent?: string
  partyType?: string
  firstName?: string
  lastName?: string
  organisationName?: string
  isInBarbados?: string
  addressLine1?: string
  townOrArea?: string
  parish?: string
  townOrCity?: string
  country?: string
}

const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

export function TenancyAgreementAgentPage() {
  const navigate = useNavigate()
  const { state, setAgentAnswer, setAgentDraft, saveAgentDraft, clearAgent } = useTenancyBuilder()

  const gate = useStageGate('agent')
  const saved = state.agent
  const draft = state.editing?.agentDraft
  const [localHasAgent, setLocalHasAgent] = useState<YesNo | undefined>(saved?.hasAgent)
  const [confirmingClear, setConfirmingClear] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [focusErrorSummary, setFocusErrorSummary] = useState(false)

  const headingRef = useRef<HTMLHeadingElement>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [confirmingClear])

  useEffect(() => {
    if (focusErrorSummary) {
      errorSummaryRef.current?.focus()
      setFocusErrorSummary(false)
    }
  }, [focusErrorSummary])

  // When switching TO Yes and no draft exists, prime draft from saved details.
  useEffect(() => {
    if (localHasAgent === 'yes' && !draft) {
      if (saved?.details) {
        setAgentDraft({
          partyType: saved.details.partyType,
          personName: saved.details.personName,
          organisationName: saved.details.organisationName,
          address: saved.details.address,
        })
      } else {
        setAgentDraft({})
      }
    }
  }, [localHasAgent, draft, saved, setAgentDraft])

  const summaryItems = useMemo<ErrorSummaryItem[]>(() => {
    const items: ErrorSummaryItem[] = []
    if (errors.hasAgent) items.push({ fieldId: 'agent-has-agent-yes', message: errors.hasAgent })
    if (errors.partyType) items.push({ fieldId: 'agent-party-type-person', message: errors.partyType })
    if (errors.firstName) items.push({ fieldId: 'agent-first-name', message: errors.firstName })
    if (errors.lastName) items.push({ fieldId: 'agent-last-name', message: errors.lastName })
    if (errors.organisationName) items.push({ fieldId: 'agent-organisation-name', message: errors.organisationName })
    if (errors.isInBarbados) items.push({ fieldId: 'agent-in-barbados-yes', message: errors.isInBarbados })
    if (errors.addressLine1) items.push({ fieldId: draft?.address?.isInBarbados === 'no' ? 'agent-overseas-line1' : 'agent-barbados-line1', message: errors.addressLine1 })
    if (errors.townOrArea) items.push({ fieldId: 'agent-barbados-town', message: errors.townOrArea })
    if (errors.parish) items.push({ fieldId: 'agent-barbados-parish', message: errors.parish })
    if (errors.townOrCity) items.push({ fieldId: 'agent-overseas-town', message: errors.townOrCity })
    if (errors.country) items.push({ fieldId: 'agent-overseas-country', message: errors.country })
    return items
  }, [errors, draft?.address?.isInBarbados])

  if (gate.kind === 'unsuitable')
    return <Navigate to="/renting-home/agreement/not-suitable" replace />
  if (gate.kind === 'missing') return <RecoveryView missing={STAGES[gate.key]} />

  function handleLocationChange(v: YesNo) {
    // Preserve shared fields (line 1, line 2, town) across the location
    // switch; only clear the field that no longer applies (Parish or
    // Country). Previously entered Parish/Country is not retained after
    // switching away and back.
    const b = draft?.address?.barbados
    const o = draft?.address?.overseas
    if (v === 'yes') {
      setAgentDraft({
        address: {
          isInBarbados: 'yes',
          barbados: {
            addressLine1: b?.addressLine1 ?? o?.addressLine1 ?? '',
            addressLine2: b?.addressLine2 ?? o?.addressLine2,
            townOrArea: b?.townOrArea ?? o?.townOrCity ?? '',
            parish: '' as never,
          },
        },
      })
    } else {
      setAgentDraft({
        address: {
          isInBarbados: 'no',
          overseas: {
            addressLine1: o?.addressLine1 ?? b?.addressLine1 ?? '',
            addressLine2: o?.addressLine2 ?? b?.addressLine2,
            townOrCity: o?.townOrCity ?? b?.townOrArea ?? '',
            country: '',
          },
        },
      })
    }
  }

  function handleBarbadosPatch(patch: Partial<BarbadosAddress>) {
    const current = draft?.address?.barbados ?? { addressLine1: '', townOrArea: '', parish: '' as never }
    setAgentDraft({ address: { isInBarbados: 'yes', barbados: { ...current, ...patch } } })
  }

  function handleOverseasPatch(patch: Partial<OverseasAddress>) {
    const current = draft?.address?.overseas ?? { addressLine1: '', townOrCity: '', country: '' }
    setAgentDraft({ address: { isInBarbados: 'no', overseas: { ...current, ...patch } } })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!localHasAgent) {
      const next: Errors = {
        hasAgent: 'Select whether someone will manage the tenancy for the landlord or landlords',
      }
      setErrors(next)
      setFocusErrorSummary(true)
      return
    }
    if (localHasAgent === 'no') {
      // If previously Yes with saved details, warn before discarding.
      if (saved?.hasAgent === 'yes' && saved.details) {
        setConfirmingClear(true)
        return
      }
      setAgentAnswer('no')
      navigate('/renting-home/agreement/tenants')
      return
    }
    // Yes — validate the details form.
    const next: Errors = {}
    if (!draft?.partyType) {
      next.partyType = 'Select whether the agent or manager is a person or a business or other organisation'
    } else if (draft.partyType === 'person') {
      if (!draft.personName?.firstName) next.firstName = 'Enter the agent or manager’s first name'
      if (!draft.personName?.lastName) next.lastName = 'Enter the agent or manager’s last name'
    } else {
      if (!draft.organisationName) next.organisationName = 'Enter the name of the business or organisation'
    }
    if (!draft?.address?.isInBarbados) {
      next.isInBarbados = 'Select whether this address is in Barbados'
    } else if (draft.address.isInBarbados === 'yes') {
      const b = draft.address.barbados
      if (!b?.addressLine1) next.addressLine1 = 'Enter address line 1'
      if (!b?.townOrArea) next.townOrArea = 'Enter the town or area'
      if (!b?.parish) next.parish = 'Select a parish'
    } else {
      const o = draft.address.overseas
      if (!o?.addressLine1) next.addressLine1 = 'Enter address line 1'
      if (!o?.townOrCity) next.townOrCity = 'Enter the town or city'
      if (!o?.country) next.country = 'Enter the country'
    }
    setErrors(next)
    if (Object.keys(next).length > 0) {
      setFocusErrorSummary(true)
      return
    }
    saveAgentDraft()
    navigate('/renting-home/agreement/tenants')
  }

  if (confirmingClear) {
    return (
      <div className="page">
        <BackLink to="/renting-home/agreement/agent">Back</BackLink>
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Remove the saved agent or manager?
          </h1>
        </div>
        <StorageWarning />
        <p className="page__text">
          Changing your answer to No will delete the agent or manager details you saved. Landlords, tenants and later answers will not be changed.
        </p>
        <div className="govbb-btn-group">
          <button
            type="button"
            className="govbb-btn"
            onClick={() => {
              clearAgent()
              setAgentAnswer('no')
              setConfirmingClear(false)
              navigate('/renting-home/agreement/tenants')
            }}
          >
            Yes, remove the details
          </button>
          <button
            type="button"
            className="govbb-btn--secondary"
            onClick={() => {
              setConfirmingClear(false)
              setLocalHasAgent('yes')
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
      <BackLink to="/renting-home/agreement/landlords">Back</BackLink>
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Agent or manager
        </h1>
      </div>
      <StorageWarning />
      <ErrorSummary items={summaryItems} ref={errorSummaryRef} />
      <form className="govbb-form stack" onSubmit={handleSubmit} noValidate>
        <RadioGroup
          name="agent-has-agent"
          legend="Will someone manage the tenancy for the landlord or landlords?"
          hint="This could be a person or organisation that deals with the tenant or collects rent for the landlord."
          options={YES_NO_OPTIONS}
          value={localHasAgent}
          onChange={(v) => setLocalHasAgent(v as YesNo)}
          error={errors.hasAgent}
        />
        {localHasAgent === 'yes' ? (
          <>
            <PartyNameFields
              idPrefix="agent"
              partyTypeLegend="Is the agent or manager a person or a business or other organisation?"
              partyType={draft?.partyType}
              onPartyTypeChange={(v: PartyType) => setAgentDraft({ partyType: v })}
              personName={draft?.personName}
              onPersonNamePatch={(p: Partial<PersonName>) =>
                setAgentDraft({ personName: { ...(draft?.personName ?? { firstName: '', lastName: '' }), ...p } })
              }
              organisationName={draft?.organisationName}
              onOrganisationNameChange={(v) => setAgentDraft({ organisationName: v })}
              errors={errors}
              personLabelSubject="Agent or manager"
              organisationLabelSubject="business or organisation"
            />
            <PartyAddressFields
              idPrefix="agent"
              address={draft?.address as PartyAddress | undefined}
              onLocationChange={handleLocationChange}
              onBarbadosPatch={handleBarbadosPatch}
              onOverseasPatch={handleOverseasPatch}
              errors={errors}
            />
          </>
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

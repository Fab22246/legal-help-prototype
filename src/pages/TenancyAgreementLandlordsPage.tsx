import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BackLink } from '../components/navigation/BackLink'
import { ErrorSummary, type ErrorSummaryItem } from '../components/forms/ErrorSummary'
import { PartyNameFields } from '../components/tenancy/PartyNameFields'
import { PartyAddressFields } from '../components/tenancy/PartyAddressFields'
import { RecoveryView } from '../components/tenancy/RecoveryView'
import { StorageWarning } from '../components/tenancy/StorageWarning'
import { DeleteAnswersAction } from '../components/tenancy/DeleteAnswersAction'
import { partyDisplayName } from '../components/tenancy/partyDisplayName'
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

type View = 'list' | 'form'

interface Errors {
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

export function TenancyAgreementLandlordsPage() {
  const navigate = useNavigate()
  const {
    state,
    setLandlordDraft,
    clearLandlordDraft,
    saveLandlordDraft,
    removeLandlord,
    startEditingLandlord,
  } = useTenancyBuilder()

  const gate = useStageGate('landlords')
  const draft = state.editing?.landlordDraft
  const landlords = state.landlords ?? []

  // View selection: form if a draft is active or no completed landlords yet.
  const [view, setView] = useState<View>(() => {
    if (draft) return 'form'
    return landlords.length === 0 ? 'form' : 'list'
  })
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [focusErrorSummary, setFocusErrorSummary] = useState(false)

  const headingRef = useRef<HTMLHeadingElement>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [view])

  useEffect(() => {
    if (focusErrorSummary) {
      errorSummaryRef.current?.focus()
      setFocusErrorSummary(false)
    }
  }, [focusErrorSummary])

  // Ensure a draft exists when the user is on the form view. This handles the
  // "first visit → add view" case and the "Add another" case. Only creates a
  // draft when the page is actually rendering (gate open); otherwise the
  // recovery/unsuitable branch short-circuits and no draft should be seeded.
  useEffect(() => {
    if (gate.kind !== 'ok') return
    if (view === 'form' && !draft) {
      setLandlordDraft({})
    }
  }, [gate.kind, view, draft, setLandlordDraft])

  const summaryItems = useMemo<ErrorSummaryItem[]>(() => {
    const items: ErrorSummaryItem[] = []
    if (errors.partyType) items.push({ fieldId: 'landlord-party-type-person', message: errors.partyType })
    if (errors.firstName) items.push({ fieldId: 'landlord-first-name', message: errors.firstName })
    if (errors.lastName) items.push({ fieldId: 'landlord-last-name', message: errors.lastName })
    if (errors.organisationName) items.push({ fieldId: 'landlord-organisation-name', message: errors.organisationName })
    if (errors.isInBarbados) items.push({ fieldId: 'landlord-in-barbados-yes', message: errors.isInBarbados })
    if (errors.addressLine1) items.push({ fieldId: draft?.address?.isInBarbados === 'no' ? 'landlord-overseas-line1' : 'landlord-barbados-line1', message: errors.addressLine1 })
    if (errors.townOrArea) items.push({ fieldId: 'landlord-barbados-town', message: errors.townOrArea })
    if (errors.parish) items.push({ fieldId: 'landlord-barbados-parish', message: errors.parish })
    if (errors.townOrCity) items.push({ fieldId: 'landlord-overseas-town', message: errors.townOrCity })
    if (errors.country) items.push({ fieldId: 'landlord-overseas-country', message: errors.country })
    return items
  }, [errors, draft?.address?.isInBarbados])

  if (gate.kind === 'unsuitable')
    return <Navigate to="/renting-home/agreement/not-suitable" replace />
  if (gate.kind === 'missing') return <RecoveryView missing={STAGES[gate.key]} />

  function handleLocationChange(v: YesNo) {
    // Shared address fields (line 1, line 2, town) are preserved across the
    // switch. Only the field that no longer applies is cleared: Parish is
    // cleared when switching to overseas; Country is cleared when switching
    // to Barbados. A previously entered Parish or Country is not retained
    // after switching away and back.
    const b = draft?.address?.barbados
    const o = draft?.address?.overseas
    if (v === 'yes') {
      setLandlordDraft({
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
      setLandlordDraft({
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
    setLandlordDraft({
      address: {
        isInBarbados: 'yes',
        barbados: { ...current, ...patch },
      },
    })
  }

  function handleOverseasPatch(patch: Partial<OverseasAddress>) {
    const current = draft?.address?.overseas ?? { addressLine1: '', townOrCity: '', country: '' }
    setLandlordDraft({
      address: {
        isInBarbados: 'no',
        overseas: { ...current, ...patch },
      },
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: Errors = {}
    if (!draft?.partyType) {
      next.partyType = 'Select whether the landlord is a person or a business or other organisation'
    }
    if (draft?.partyType === 'person') {
      if (!draft.personName?.firstName) next.firstName = 'Enter the landlord’s first name'
      if (!draft.personName?.lastName) next.lastName = 'Enter the landlord’s last name'
    } else if (draft?.partyType === 'organisation') {
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
    saveLandlordDraft()
    setView('list')
  }

  // Confirmation view for removing a landlord when two or more exist.
  if (pendingRemoveId) {
    const target = landlords.find((l) => l.id === pendingRemoveId)
    const displayName = target ? partyDisplayName(target, 'this landlord') : 'this landlord'
    return (
      <div className="page">
        <BackLink to="/renting-home/agreement/landlords">Back</BackLink>
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Remove {displayName}?
          </h1>
        </div>
        <StorageWarning />
        <p className="page__text">This landlord will be removed from the agreement.</p>
        <div className="govbb-btn-group">
          <button
            type="button"
            className="govbb-btn"
            onClick={() => {
              removeLandlord(pendingRemoveId)
              setPendingRemoveId(null)
              // If that was the last one, drop back to form (first-visit behaviour).
              const remaining = landlords.filter((l) => l.id !== pendingRemoveId)
              setView(remaining.length === 0 ? 'form' : 'list')
            }}
          >
            Yes, remove {displayName}
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
    const canRemove = landlords.length >= 2
    return (
      <div className="page">
        <BackLink to="/renting-home/agreement/scope">Back</BackLink>
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Landlords
          </h1>
          <p className="page__text">You must add every landlord who will be named in the agreement.</p>
        </div>
        <StorageWarning />
        <ul className="govbb-summary-list">
          {landlords.map((l) => {
            const displayName = partyDisplayName(l, 'Landlord')
            return (
              <li className="govbb-summary-list__row" key={l.id}>
                <span className="govbb-summary-list__key">{displayName}</span>
                <span className="govbb-summary-list__value">
                  <button
                    type="button"
                    className="govbb-btn--link"
                    onClick={() => {
                      startEditingLandlord(l.id)
                      setErrors({})
                      setView('form')
                    }}
                  >
                    Change<span className="govbb-visually-hidden"> {displayName}</span>
                  </button>
                  {canRemove ? (
                    <>
                      {' '}
                      <button
                        type="button"
                        className="govbb-btn--link"
                        onClick={() => setPendingRemoveId(l.id)}
                      >
                        Remove<span className="govbb-visually-hidden"> {displayName}</span>
                      </button>
                    </>
                  ) : null}
                </span>
              </li>
            )
          })}
        </ul>
        <div className="govbb-btn-group">
          <button
            type="button"
            className="govbb-btn--secondary"
            onClick={() => {
              clearLandlordDraft()
              setErrors({})
              setView('form')
            }}
          >
            Add another landlord
          </button>
          <button
            type="button"
            className="govbb-btn"
            onClick={() => navigate('/renting-home/agreement/agent')}
          >
            Continue
          </button>
        </div>
        <DeleteAnswersAction />
      </div>
    )
  }

  // Form view (add or edit).
  const isEditing = !!draft?.editingId
  const backTo = isEditing
    ? '/renting-home/agreement/landlords'
    : landlords.length > 0
      ? '/renting-home/agreement/landlords'
      : '/renting-home/agreement/scope'
  return (
    <div className="page">
      <BackLink to={backTo}>Back</BackLink>
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          {isEditing ? 'Change landlord details' : 'Add a landlord'}
        </h1>
      </div>
      <StorageWarning />
      <ErrorSummary items={summaryItems} ref={errorSummaryRef} />
      <form className="govbb-form stack" onSubmit={handleSubmit} noValidate>
        <PartyNameFields
          idPrefix="landlord"
          partyTypeLegend="Is the landlord a person or a business or other organisation?"
          partyType={draft?.partyType}
          onPartyTypeChange={(v: PartyType) => setLandlordDraft({ partyType: v })}
          personName={draft?.personName}
          onPersonNamePatch={(p: Partial<PersonName>) =>
            setLandlordDraft({ personName: { ...(draft?.personName ?? { firstName: '', lastName: '' }), ...p } })
          }
          organisationName={draft?.organisationName}
          onOrganisationNameChange={(v) => setLandlordDraft({ organisationName: v })}
          errors={errors}
          personLabelSubject="Landlord"
          organisationLabelSubject="business or organisation"
        />
        <PartyAddressFields
          idPrefix="landlord"
          address={draft?.address as PartyAddress | undefined}
          onLocationChange={handleLocationChange}
          onBarbadosPatch={handleBarbadosPatch}
          onOverseasPatch={handleOverseasPatch}
          errors={errors}
        />
        <div className="govbb-btn-group">
          <button type="submit" className="govbb-btn">
            Save landlord
          </button>
        </div>
      </form>
      <DeleteAnswersAction />
    </div>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BackLink } from '../components/navigation/BackLink'
import { ErrorSummary, type ErrorSummaryItem } from '../components/forms/ErrorSummary'
import { PartyNameFields } from '../components/tenancy/PartyNameFields'
import { RecoveryView } from '../components/tenancy/RecoveryView'
import { StorageWarning } from '../components/tenancy/StorageWarning'
import { DeleteAnswersAction } from '../components/tenancy/DeleteAnswersAction'
import { partyDisplayName } from '../components/tenancy/partyDisplayName'
import { useStageGate } from '../components/tenancy/useStageGate'
import {
  useTenancyBuilder,
  type PartyType,
  type PersonName,
} from '../state/tenancyBuilderContext'
import { STAGES } from '../state/tenancyBuilderStageStatus'

type View = 'list' | 'form'

interface Errors {
  partyType?: string
  firstName?: string
  lastName?: string
  organisationName?: string
}

export function TenancyAgreementTenantsPage() {
  const navigate = useNavigate()
  const {
    state,
    setTenantDraft,
    clearTenantDraft,
    saveTenantDraft,
    removeTenant,
    startEditingTenant,
  } = useTenancyBuilder()

  const gate = useStageGate('tenants')
  const draft = state.editing?.tenantDraft
  const tenants = state.tenants ?? []

  const [view, setView] = useState<View>(() => {
    if (draft) return 'form'
    return tenants.length === 0 ? 'form' : 'list'
  })
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [focusErrorSummary, setFocusErrorSummary] = useState(false)

  const headingRef = useRef<HTMLHeadingElement>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [view, pendingRemoveId])

  useEffect(() => {
    if (focusErrorSummary) {
      errorSummaryRef.current?.focus()
      setFocusErrorSummary(false)
    }
  }, [focusErrorSummary])

  useEffect(() => {
    if (gate.kind !== 'ok') return
    if (view === 'form' && !draft) {
      setTenantDraft({})
    }
  }, [gate.kind, view, draft, setTenantDraft])

  const summaryItems = useMemo<ErrorSummaryItem[]>(() => {
    const items: ErrorSummaryItem[] = []
    if (errors.partyType) items.push({ fieldId: 'tenant-party-type-person', message: errors.partyType })
    if (errors.firstName) items.push({ fieldId: 'tenant-first-name', message: errors.firstName })
    if (errors.lastName) items.push({ fieldId: 'tenant-last-name', message: errors.lastName })
    if (errors.organisationName) items.push({ fieldId: 'tenant-organisation-name', message: errors.organisationName })
    return items
  }, [errors])

  if (gate.kind === 'unsuitable')
    return <Navigate to="/renting-home/agreement/not-suitable" replace />
  if (gate.kind === 'missing') return <RecoveryView missing={STAGES[gate.key]} />

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: Errors = {}
    if (!draft?.partyType) {
      next.partyType = 'Select whether the tenant is a person or a business or other organisation'
    } else if (draft.partyType === 'person') {
      if (!draft.personName?.firstName) next.firstName = 'Enter the tenant’s first name'
      if (!draft.personName?.lastName) next.lastName = 'Enter the tenant’s last name'
    } else {
      if (!draft.organisationName) next.organisationName = 'Enter the name of the business or organisation'
    }
    setErrors(next)
    if (Object.keys(next).length > 0) {
      setFocusErrorSummary(true)
      return
    }
    saveTenantDraft()
    setView('list')
  }

  if (pendingRemoveId) {
    const target = tenants.find((t) => t.id === pendingRemoveId)
    const displayName = target ? partyDisplayName(target, 'this tenant') : 'this tenant'
    return (
      <div className="page">
        <BackLink to="/renting-home/agreement/tenants">Back</BackLink>
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Remove {displayName}?
          </h1>
        </div>
        <StorageWarning />
        <p className="page__text">This tenant will be removed from the agreement.</p>
        <div className="govbb-btn-group">
          <button
            type="button"
            className="govbb-btn"
            onClick={() => {
              removeTenant(pendingRemoveId)
              const remaining = tenants.filter((t) => t.id !== pendingRemoveId)
              setPendingRemoveId(null)
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
    const canRemove = tenants.length >= 2
    return (
      <div className="page">
        <BackLink to="/renting-home/agreement/agent">Back</BackLink>
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Tenants
          </h1>
          <p className="page__text">You must add every tenant who will be named in the agreement.</p>
        </div>
        <StorageWarning />
        <ul className="govbb-summary-list">
          {tenants.map((t) => {
            const displayName = partyDisplayName(t, 'Tenant')
            return (
              <li className="govbb-summary-list__row" key={t.id}>
                <span className="govbb-summary-list__key">{displayName}</span>
                <span className="govbb-summary-list__value">
                  <button
                    type="button"
                    className="govbb-btn--link"
                    onClick={() => {
                      startEditingTenant(t.id)
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
                        onClick={() => setPendingRemoveId(t.id)}
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
              clearTenantDraft()
              setErrors({})
              setView('form')
            }}
          >
            Add another tenant
          </button>
          <button
            type="button"
            className="govbb-btn"
            onClick={() => navigate('/renting-home/agreement/home')}
          >
            Continue
          </button>
        </div>
        <DeleteAnswersAction />
      </div>
    )
  }

  const isEditing = !!draft?.editingId
  const backTo = tenants.length > 0
    ? '/renting-home/agreement/tenants'
    : '/renting-home/agreement/agent'
  return (
    <div className="page">
      <BackLink to={backTo}>Back</BackLink>
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          {isEditing ? 'Change tenant details' : 'Add a tenant'}
        </h1>
      </div>
      <StorageWarning />
      <ErrorSummary items={summaryItems} ref={errorSummaryRef} />
      <form className="govbb-form stack" onSubmit={handleSubmit} noValidate>
        <PartyNameFields
          idPrefix="tenant"
          partyTypeLegend="Is the tenant a person or a business or other organisation?"
          partyType={draft?.partyType}
          onPartyTypeChange={(v: PartyType) => setTenantDraft({ partyType: v })}
          personName={draft?.personName}
          onPersonNamePatch={(p: Partial<PersonName>) =>
            setTenantDraft({ personName: { ...(draft?.personName ?? { firstName: '', lastName: '' }), ...p } })
          }
          organisationName={draft?.organisationName}
          onOrganisationNameChange={(v) => setTenantDraft({ organisationName: v })}
          errors={errors}
          personLabelSubject="Tenant"
          organisationLabelSubject="business or organisation"
        />
        <div className="govbb-btn-group">
          <button type="submit" className="govbb-btn">
            Save tenant
          </button>
        </div>
      </form>
      <DeleteAnswersAction />
    </div>
  )
}

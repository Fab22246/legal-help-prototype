import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BackLink } from '../components/navigation/BackLink'
import { ErrorSummary, type ErrorSummaryItem } from '../components/forms/ErrorSummary'
import { RadioGroup } from '../components/forms/RadioGroup'
import { RecoveryView } from '../components/tenancy/RecoveryView'
import { StorageWarning } from '../components/tenancy/StorageWarning'
import { DeleteAnswersAction } from '../components/tenancy/DeleteAnswersAction'
import { useStageGate } from '../components/tenancy/useStageGate'
import { useTenancyBuilder, type PermissionAnswer } from '../state/tenancyBuilderContext'
import { STAGES } from '../state/tenancyBuilderStageStatus'

interface Errors {
  business?: string
  changes?: string
  subletting?: string
}

const PERMISSION_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'written-permission', label: 'Only with written permission' },
  { value: 'no', label: 'No' },
  { value: 'not-agreed-yet', label: 'Not agreed yet' },
]

export function TenancyAgreementUsingHomePage() {
  const navigate = useNavigate()
  const { state, saveUsingHome } = useTenancyBuilder()
  const gate = useStageGate('using-home')

  const [business, setBusiness] = useState<PermissionAnswer | undefined>(state.usingHome?.business)
  const [changes, setChanges] = useState<PermissionAnswer | undefined>(state.usingHome?.changes)
  const [subletting, setSubletting] = useState<PermissionAnswer | undefined>(
    state.usingHome?.subletting,
  )
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

  const summaryItems = useMemo<ErrorSummaryItem[]>(() => {
    const items: ErrorSummaryItem[] = []
    if (errors.business) items.push({ fieldId: 'business-yes', message: errors.business })
    if (errors.changes) items.push({ fieldId: 'changes-yes', message: errors.changes })
    if (errors.subletting) items.push({ fieldId: 'subletting-yes', message: errors.subletting })
    return items
  }, [errors])

  if (gate.kind === 'unsuitable')
    return <Navigate to="/renting-home/agreement/not-suitable" replace />
  if (gate.kind === 'missing') return <RecoveryView missing={STAGES[gate.key]} />

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: Errors = {}
    if (!business) next.business = 'Select whether a tenant can run a business from the home.'
    if (!changes) next.changes = 'Select whether a tenant can make changes to the home.'
    if (!subletting)
      next.subletting =
        'Select whether a tenant can rent out all or part of the home to someone else.'
    setErrors(next)
    if (Object.keys(next).length > 0) {
      setFocusErrorSummary(true)
      return
    }
    saveUsingHome({
      business: business as PermissionAnswer,
      changes: changes as PermissionAnswer,
      subletting: subletting as PermissionAnswer,
    })
    navigate('/renting-home/agreement/ending')
  }

  return (
    <div className="page">
      <BackLink to="/renting-home/agreement/pets-smoking">Back</BackLink>
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Using the home
        </h1>
      </div>
      <StorageWarning />
      <ErrorSummary items={summaryItems} ref={errorSummaryRef} />
      <form className="govbb-form stack" onSubmit={handleSubmit} noValidate>
        <RadioGroup
          name="business"
          legend="Can a tenant run a business from the home?"
          options={PERMISSION_OPTIONS}
          value={business}
          onChange={(v) => setBusiness(v as PermissionAnswer)}
          error={errors.business}
        />
        <RadioGroup
          name="changes"
          legend="Can a tenant make changes to the home?"
          hint="For example, painting, installing fixtures or making structural changes."
          options={PERMISSION_OPTIONS}
          value={changes}
          onChange={(v) => setChanges(v as PermissionAnswer)}
          error={errors.changes}
        />
        <RadioGroup
          name="subletting"
          legend="Can a tenant rent out all or part of the home to someone else?"
          hint="This is sometimes called subletting."
          options={PERMISSION_OPTIONS}
          value={subletting}
          onChange={(v) => setSubletting(v as PermissionAnswer)}
          error={errors.subletting}
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

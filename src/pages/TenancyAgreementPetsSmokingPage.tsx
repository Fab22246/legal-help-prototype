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
  pets?: string
  smoking?: string
}

const PERMISSION_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'written-permission', label: 'Only with written permission' },
  { value: 'no', label: 'No' },
  { value: 'not-agreed-yet', label: 'Not agreed yet' },
]

export function TenancyAgreementPetsSmokingPage() {
  const navigate = useNavigate()
  const { state, savePetsSmoking } = useTenancyBuilder()
  const gate = useStageGate('pets-smoking')

  const [pets, setPets] = useState<PermissionAnswer | undefined>(state.petsSmoking?.pets)
  const [smoking, setSmoking] = useState<PermissionAnswer | undefined>(state.petsSmoking?.smoking)
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
    if (errors.pets) items.push({ fieldId: 'pets-yes', message: errors.pets })
    if (errors.smoking) items.push({ fieldId: 'smoking-yes', message: errors.smoking })
    return items
  }, [errors])

  if (gate.kind === 'unsuitable')
    return <Navigate to="/renting-home/agreement/not-suitable" replace />
  if (gate.kind === 'missing') return <RecoveryView missing={STAGES[gate.key]} />

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: Errors = {}
    if (!pets) next.pets = 'Select whether pets are allowed in the home.'
    if (!smoking) next.smoking = 'Select whether smoking or vaping is allowed inside the home.'
    setErrors(next)
    if (Object.keys(next).length > 0) {
      setFocusErrorSummary(true)
      return
    }
    savePetsSmoking({ pets: pets as PermissionAnswer, smoking: smoking as PermissionAnswer })
    navigate('/renting-home/agreement/using-home')
  }

  return (
    <div className="page">
      <BackLink to="/renting-home/agreement/access">Back</BackLink>
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Pets and smoking
        </h1>
      </div>
      <StorageWarning />
      <ErrorSummary items={summaryItems} ref={errorSummaryRef} />
      <form className="govbb-form stack" onSubmit={handleSubmit} noValidate>
        <RadioGroup
          name="pets"
          legend="Are pets allowed in the home?"
          options={PERMISSION_OPTIONS}
          value={pets}
          onChange={(v) => setPets(v as PermissionAnswer)}
          error={errors.pets}
        />
        <RadioGroup
          name="smoking"
          legend="Is smoking or vaping allowed inside the home?"
          options={PERMISSION_OPTIONS}
          value={smoking}
          onChange={(v) => setSmoking(v as PermissionAnswer)}
          error={errors.smoking}
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

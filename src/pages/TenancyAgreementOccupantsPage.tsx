import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BackLink } from '../components/navigation/BackLink'
import { ErrorSummary, type ErrorSummaryItem } from '../components/forms/ErrorSummary'
import { RadioGroup } from '../components/forms/RadioGroup'
import { TextInput } from '../components/forms/TextInput'
import { RecoveryView } from '../components/tenancy/RecoveryView'
import { StorageWarning } from '../components/tenancy/StorageWarning'
import { DeleteAnswersAction } from '../components/tenancy/DeleteAnswersAction'
import { useStageGate } from '../components/tenancy/useStageGate'
import { useTenancyBuilder, type YesNo } from '../state/tenancyBuilderContext'
import { STAGES } from '../state/tenancyBuilderStageStatus'

type View = 'decision' | 'form' | 'list'

interface Errors {
  willLive?: string
  firstName?: string
  lastName?: string
}

const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

function occupantName(o: { firstName: string; middleNames?: string; lastName: string }): string {
  return [o.firstName, o.middleNames, o.lastName].filter(Boolean).join(' ')
}

export function TenancyAgreementOccupantsPage() {
  const navigate = useNavigate()
  const {
    state,
    setOccupantsAnswer,
    clearOccupantsRecords,
    setOccupantDraft,
    clearOccupantDraft,
    saveOccupantDraft,
    removeOccupant,
    startEditingOccupant,
  } = useTenancyBuilder()

  const gate = useStageGate('occupants')
  const draft = state.editing?.occupantDraft
  const records = state.occupants?.records ?? []

  const [willLive, setWillLive] = useState<YesNo | undefined>(state.occupants?.willLive)
  const [view, setView] = useState<View>(() => (draft ? 'form' : 'decision'))
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)
  const [confirmDeleteRecords, setConfirmDeleteRecords] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [focusErrorSummary, setFocusErrorSummary] = useState(false)

  const headingRef = useRef<HTMLHeadingElement>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [view, pendingRemoveId, confirmDeleteRecords])

  useEffect(() => {
    if (focusErrorSummary) {
      errorSummaryRef.current?.focus()
      setFocusErrorSummary(false)
    }
  }, [focusErrorSummary])

  useEffect(() => {
    if (gate.kind !== 'ok') return
    if (view === 'form' && !draft) setOccupantDraft({})
  }, [gate.kind, view, draft, setOccupantDraft])

  const summaryItems = useMemo<ErrorSummaryItem[]>(() => {
    const items: ErrorSummaryItem[] = []
    if (errors.willLive) items.push({ fieldId: 'occupants-will-live-yes', message: errors.willLive })
    if (errors.firstName) items.push({ fieldId: 'occupant-first-name', message: errors.firstName })
    if (errors.lastName) items.push({ fieldId: 'occupant-last-name', message: errors.lastName })
    return items
  }, [errors])

  if (gate.kind === 'unsuitable')
    return <Navigate to="/renting-home/agreement/not-suitable" replace />
  if (gate.kind === 'missing') return <RecoveryView missing={STAGES[gate.key]} />

  function handleDecisionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!willLive) {
      setErrors({ willLive: 'Select whether anyone who is not named as a tenant will live in the home.' })
      setFocusErrorSummary(true)
      return
    }
    setErrors({})
    if (willLive === 'yes') {
      setOccupantsAnswer('yes')
      setView(records.length === 0 ? 'form' : 'list')
      return
    }
    if (records.length > 0) {
      setConfirmDeleteRecords(true)
      return
    }
    setOccupantsAnswer('no')
    navigate('/renting-home/agreement/included-items')
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next: Errors = {}
    if (!draft?.firstName?.trim()) next.firstName = 'Enter the person’s first name.'
    if (!draft?.lastName?.trim()) next.lastName = 'Enter the person’s last name.'
    setErrors(next)
    if (Object.keys(next).length > 0) {
      setFocusErrorSummary(true)
      return
    }
    saveOccupantDraft()
    setView('list')
  }

  if (confirmDeleteRecords) {
    return (
      <div className="page">
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Delete the people you added?
          </h1>
        </div>
        <StorageWarning />
        <p className="page__text">
          Changing this answer will delete the people you added. Your other answers will not be
          affected.
        </p>
        <div className="govbb-btn-group">
          <button
            type="button"
            className="govbb-btn"
            onClick={() => {
              clearOccupantsRecords()
              setConfirmDeleteRecords(false)
              navigate('/renting-home/agreement/included-items')
            }}
          >
            Delete people
          </button>
          <button
            type="button"
            className="govbb-btn--secondary"
            onClick={() => {
              setWillLive('yes')
              setConfirmDeleteRecords(false)
            }}
          >
            Cancel
          </button>
        </div>
        <DeleteAnswersAction />
      </div>
    )
  }

  if (pendingRemoveId) {
    const target = records.find((o) => o.id === pendingRemoveId)
    const name = target ? occupantName(target) : 'this person'
    return (
      <div className="page">
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Remove {name}?
          </h1>
        </div>
        <StorageWarning />
        <p className="page__text">
          This will delete {name} from the list of people who will live in the home. Your other
          answers will not be affected.
        </p>
        <div className="govbb-btn-group">
          <button
            type="button"
            className="govbb-btn"
            onClick={() => {
              removeOccupant(pendingRemoveId)
              setPendingRemoveId(null)
              const remaining = records.filter((o) => o.id !== pendingRemoveId)
              setView(remaining.length === 0 ? 'decision' : 'list')
            }}
          >
            Remove {name}
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
    return (
      <div className="page">
        <button type="button" className="govbb-back-link" onClick={() => setView('decision')}>
          <span className="govbb-back-link__icon" aria-hidden="true">
            ←
          </span>{' '}
          Back
        </button>
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Other people living in the home
          </h1>
          <p className="page__text">
            These people will live in the home but are not named as tenants.
          </p>
        </div>
        <StorageWarning />
        <ul className="govbb-summary-list">
          {records.map((o) => {
            const name = occupantName(o)
            return (
              <li className="govbb-summary-list__row" key={o.id}>
                <span className="govbb-summary-list__key">{name}</span>
                <span className="govbb-summary-list__value">
                  <button
                    type="button"
                    className="govbb-btn--link"
                    onClick={() => {
                      startEditingOccupant(o.id)
                      setErrors({})
                      setView('form')
                    }}
                  >
                    Change<span className="govbb-visually-hidden"> {name}</span>
                  </button>{' '}
                  <button
                    type="button"
                    className="govbb-btn--link"
                    onClick={() => setPendingRemoveId(o.id)}
                  >
                    Remove<span className="govbb-visually-hidden"> {name}</span>
                  </button>
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
              clearOccupantDraft()
              setErrors({})
              setView('form')
            }}
          >
            Add another person
          </button>
          <button
            type="button"
            className="govbb-btn"
            onClick={() => navigate('/renting-home/agreement/included-items')}
          >
            Continue
          </button>
        </div>
        <DeleteAnswersAction />
      </div>
    )
  }

  if (view === 'form') {
    return (
      <div className="page">
        <button type="button" className="govbb-back-link" onClick={() => setView('decision')}>
          <span className="govbb-back-link__icon" aria-hidden="true">
            ←
          </span>{' '}
          Back
        </button>
        <div className="page__header">
          <h1 className="page__title" tabIndex={-1} ref={headingRef}>
            Add someone who will live in the home
          </h1>
        </div>
        <StorageWarning />
        <ErrorSummary items={summaryItems} ref={errorSummaryRef} />
        <form className="govbb-form stack" onSubmit={handleFormSubmit} noValidate>
          <TextInput
            id="occupant-first-name"
            label="First name"
            value={draft?.firstName ?? ''}
            onChange={(v) => setOccupantDraft({ firstName: v })}
            error={errors.firstName}
          />
          <TextInput
            id="occupant-middle-names"
            label="Middle name or names"
            optional
            value={draft?.middleNames ?? ''}
            onChange={(v) => setOccupantDraft({ middleNames: v })}
          />
          <TextInput
            id="occupant-last-name"
            label="Last name"
            value={draft?.lastName ?? ''}
            onChange={(v) => setOccupantDraft({ lastName: v })}
            error={errors.lastName}
          />
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

  return (
    <div className="page">
      <BackLink to="/renting-home/agreement/bills">Back</BackLink>
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Other people living in the home
        </h1>
      </div>
      <StorageWarning />
      <ErrorSummary items={summaryItems} ref={errorSummaryRef} />
      <form className="govbb-form stack" onSubmit={handleDecisionSubmit} noValidate>
        <RadioGroup
          name="occupants-will-live"
          legend="Will anyone who is not named as a tenant live in the home?"
          hint="Do not include anyone already named as a tenant."
          options={YES_NO_OPTIONS}
          value={willLive}
          onChange={(v) => setWillLive(v as YesNo)}
          error={errors.willLive}
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

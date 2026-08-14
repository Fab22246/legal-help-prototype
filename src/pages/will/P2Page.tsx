import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextInput } from '../../components/forms/TextInput'
import type { ErrorSummaryItem } from '../../components/forms/ErrorSummary'
import { WillFormPage } from '../../components/will/WillFormPage'
import { RepeatableRecordList } from '../../components/will/RepeatableRecordList'
import { useWillGuard } from '../../components/will/useWillGuard'
import { proceed } from '../../components/will/nav'
import { useWillState } from '../../state/will/WillState'
import { changeDestination, nextStep } from '../../state/will/journey'
import { computeDerived } from '../../state/will/routeEngine'
import { requiredTextError } from '../../state/will/validation'

type Mode = 'forward' | 'change'

export function P2Page({ mode, recordId }: { mode: Mode; recordId?: string }) {
  const active = useWillGuard()
  const { answers, applyAndGet, newId } = useWillState()
  const navigate = useNavigate()
  const records = answers.jointAssets

  const [view, setView] = useState<'list' | 'form'>(recordId || records.length === 0 ? 'form' : 'list')
  const idRef = useRef<string>(recordId ?? newId())
  const editing = records.find((r) => r.id === idRef.current)
  const [description, setDescription] = useState(editing?.description ?? '')
  const [error, setError] = useState<string | undefined>()
  const [attempt, setAttempt] = useState(0)
  const [listErr, setListErr] = useState<string | undefined>()

  if (!active) return null

  function saveRecord() {
    const e = requiredTextError(description, 'Enter description.')
    setError(e)
    setAttempt((a) => a + 1)
    if (e) return
    const id = idRef.current
    applyAndGet((d) => {
      const found = d.jointAssets.some((r) => r.id === id)
      d.jointAssets = found
        ? d.jointAssets.map((r) => (r.id === id ? { ...r, description: description.trim() } : r))
        : [...d.jointAssets, { id, description: description.trim() }]
    })
    if (mode === 'change') {
      proceed(navigate, mode, changeDestination(answers, computeDerived(answers)))
      return
    }
    idRef.current = newId()
    setDescription('')
    setView('list')
  }

  function removeRecord(id: string) {
    applyAndGet((d) => {
      d.jointAssets = d.jointAssets.filter((r) => r.id !== id)
    })
    if (records.length - 1 === 0) setView('form')
  }

  function onContinue() {
    if (records.length === 0) {
      setListErr('Add at least one description of jointly owned money or property.')
      return
    }
    proceed(navigate, mode, mode === 'change' ? changeDestination(answers, computeDerived(answers)) : nextStep(answers, computeDerived(answers), 'p2'))
  }

  if (view === 'list') {
    return (
      <RepeatableRecordList
        title="What do you own with someone else?"
        records={records.map((r) => ({ id: r.id, lines: [r.description], changeName: r.description, removeName: r.description }))}
        onChange={(id) => {
          idRef.current = id
          setDescription(records.find((r) => r.id === id)?.description ?? '')
          setView('form')
        }}
        onRemove={removeRecord}
        onAdd={() => {
          idRef.current = newId()
          setDescription('')
          setView('form')
        }}
        onContinue={onContinue}
        addLabel="Add another"
      />
    )
  }

  const items: ErrorSummaryItem[] = error ? [{ fieldId: 'p2-description', message: error }] : []

  return (
    <WillFormPage
      title="What do you own with someone else?"
      mode={mode}
      errorItems={items}
      submitAttempt={attempt}
      onSubmit={saveRecord}
      continueLabel="Save and continue"
    >
      <TextInput
        id="p2-description"
        label="Description"
        hint="Give a short description. You do not need to enter an account number or document number."
        value={description}
        onChange={setDescription}
        error={error}
      />
      {listErr ? <p className="govbb-error-message">{listErr}</p> : null}
    </WillFormPage>
  )
}

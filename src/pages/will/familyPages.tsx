import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RadioGroup } from '../../components/forms/RadioGroup'
import { TextInput } from '../../components/forms/TextInput'
import { TextArea } from '../../components/forms/TextArea'
import { DateInput } from '../../components/forms/DateInput'
import type { ErrorSummaryItem } from '../../components/forms/ErrorSummary'
import { WillFormPage } from '../../components/will/WillFormPage'
import { RepeatableRecordList } from '../../components/will/RepeatableRecordList'
import { useWillGuard } from '../../components/will/useWillGuard'
import { NameFields, emptyName } from '../../components/will/fieldGroups'
import type { NameErrors } from '../../components/will/fieldGroups'
import { proceed } from '../../components/will/nav'
import { useWillState } from '../../state/will/WillState'
import { changeDestination, nextStep } from '../../state/will/journey'
import { computeDerived } from '../../state/will/routeEngine'
import { formatDateParts, fullName } from '../../state/will/format'
import { dobError, nameError, optionalNameError, requiredTextError } from '../../state/will/validation'
import type { DateParts, Name, PersonRecord, WillAnswers } from '../../state/will/types'

type Mode = 'forward' | 'change'

function nameItems(prefix: string, errors: NameErrors): ErrorSummaryItem[] {
  const items: ErrorSummaryItem[] = []
  if (errors.firstName) items.push({ fieldId: `${prefix}-first-name`, message: errors.firstName })
  if (errors.middleNames) items.push({ fieldId: `${prefix}-middle-names`, message: errors.middleNames })
  if (errors.lastName) items.push({ fieldId: `${prefix}-last-name`, message: errors.lastName })
  return items
}

function trimmedName(name: Name): Name {
  return {
    firstName: name.firstName.trim(),
    middleNames: (name.middleNames ?? '').trim() || undefined,
    lastName: name.lastName.trim(),
  }
}

function idsFor(section: 'f2' | 'f4' | 'f6', a: WillAnswers): string[] {
  if (section === 'f2') return a.minorChildIds
  if (section === 'f4') return a.dependantAdultChildIds
  return a.otherDependantIds
}

const RELATIONSHIP_OPTIONS = [
  { value: 'Son', label: 'Son' },
  { value: 'Daughter', label: 'Daughter' },
  { value: 'Child', label: 'Child' },
  { value: 'Stepchild', label: 'Stepchild' },
  { value: 'Other', label: 'Other' },
]
const FIXED_RELATIONSHIPS = ['Son', 'Daughter', 'Child', 'Stepchild']

// F2: children under 18.
export function F2Page({ mode, recordId }: { mode: Mode; recordId?: string }) {
  const active = useWillGuard()
  const { answers, applyAndGet, newId } = useWillState()
  const navigate = useNavigate()
  const records = answers.minorChildIds
    .map((id) => answers.people.find((p) => p.id === id))
    .filter((p): p is PersonRecord => Boolean(p))

  const [view, setView] = useState<'list' | 'form'>(recordId || records.length === 0 ? 'form' : 'list')
  const idRef = useRef<string>(recordId ?? newId())
  const editing = answers.people.find((p) => p.id === idRef.current)
  const initialRel = editing?.relationship ?? ''
  const [name, setName] = useState<Name>(editing?.name ?? emptyName())
  const [dob, setDob] = useState<DateParts>(editing?.dateOfBirth ?? { day: '', month: '', year: '' })
  const [relationship, setRelationship] = useState<string | undefined>(
    initialRel ? (FIXED_RELATIONSHIPS.includes(initialRel) ? initialRel : 'Other') : undefined,
  )
  const [otherDesc, setOtherDesc] = useState<string>(
    initialRel && !FIXED_RELATIONSHIPS.includes(initialRel) ? initialRel : '',
  )
  const [nameErrors, setNameErrors] = useState<NameErrors>({})
  const [dobErr, setDobErr] = useState<string | undefined>()
  const [relErr, setRelErr] = useState<string | undefined>()
  const [otherErr, setOtherErr] = useState<string | undefined>()
  const [attempt, setAttempt] = useState(0)
  const [listErr, setListErr] = useState<string | undefined>()

  if (!active) return null

  function saveRecord() {
    const ne: NameErrors = {
      firstName: nameError(name.firstName, 'Enter first name.'),
      lastName: nameError(name.lastName, 'Enter last name.'),
      middleNames: optionalNameError(name.middleNames ?? ''),
    }
    const de = dobError(dob, { underMessage: 'Enter a date of birth that makes the child under 18.' })
    const re = relationship ? undefined : 'Select an answer to: Relationship to you.'
    const oe = relationship === 'Other' ? requiredTextError(otherDesc, 'Enter your relationship to the child.') : undefined
    setNameErrors(ne)
    setDobErr(de)
    setRelErr(re)
    setOtherErr(oe)
    setAttempt((a) => a + 1)
    if (ne.firstName || ne.lastName || ne.middleNames || de || re || oe) return
    const id = idRef.current
    const rel = relationship === 'Other' ? otherDesc.trim() : (relationship as string)
    const record: PersonRecord = { id, name: trimmedName(name), dateOfBirth: dob, relationship: rel }
    applyAndGet((d) => {
      const found = d.people.some((p) => p.id === id)
      d.people = found ? d.people.map((p) => (p.id === id ? { ...p, ...record } : p)) : [...d.people, record]
      if (!d.minorChildIds.includes(id)) d.minorChildIds = [...d.minorChildIds, id]
    })
    if (mode === 'change') {
      const na = { ...answers }
      proceed(navigate, mode, changeDestination(na, computeDerived(na)))
      return
    }
    idRef.current = newId()
    setName(emptyName())
    setDob({ day: '', month: '', year: '' })
    setRelationship(undefined)
    setOtherDesc('')
    setView('list')
  }

  function onContinue() {
    if (records.length === 0) {
      setListErr('Add at least one child under 18.')
      return
    }
    const next = answers
    proceed(navigate, mode, mode === 'change' ? changeDestination(next, computeDerived(next)) : nextStep(next, computeDerived(next), 'f2'))
  }

  function removeRecord(id: string) {
    applyAndGet((d) => {
      d.minorChildIds = d.minorChildIds.filter((x) => x !== id)
    })
    if (records.length - 1 === 0) setView('form')
  }

  if (view === 'list') {
    return (
      <RepeatableRecordList
        title="Children under 18"
        records={records.map((p) => ({
          id: p.id,
          lines: [fullName(p.name), formatDateParts(p.dateOfBirth), p.relationship ?? ''].filter(Boolean),
          changeName: fullName(p.name),
          removeName: fullName(p.name),
        }))}
        onChange={(id) => {
          idRef.current = id
          const rec = answers.people.find((p) => p.id === id)
          setName(rec?.name ?? emptyName())
          setDob(rec?.dateOfBirth ?? { day: '', month: '', year: '' })
          const rel = rec?.relationship ?? ''
          setRelationship(rel ? (FIXED_RELATIONSHIPS.includes(rel) ? rel : 'Other') : undefined)
          setOtherDesc(rel && !FIXED_RELATIONSHIPS.includes(rel) ? rel : '')
          setView('form')
        }}
        onRemove={removeRecord}
        onAdd={() => {
          idRef.current = newId()
          setName(emptyName())
          setDob({ day: '', month: '', year: '' })
          setRelationship(undefined)
          setOtherDesc('')
          setView('form')
        }}
        onContinue={onContinue}
        addLabel="Add another child"
      />
    )
  }

  const items = nameItems('f2', nameErrors)
  if (dobErr) items.push({ fieldId: 'f2-dob-day', message: dobErr })
  if (relErr) items.push({ fieldId: 'f2-relationship-Son', message: relErr })
  if (otherErr) items.push({ fieldId: 'f2-other-relationship', message: otherErr })

  return (
    <WillFormPage
      title="Tell us about the child"
      mode={mode}
      errorItems={items}
      submitAttempt={attempt}
      onSubmit={saveRecord}
      continueLabel="Save and continue"
    >
      <NameFields idPrefix="f2" value={name} onChange={setName} errors={nameErrors} />
      <DateInput namePrefix="f2-dob" legend="Date of birth" value={dob} onChange={setDob} error={dobErr} />
      <RadioGroup
        name="f2-relationship"
        legend="Relationship to you"
        options={RELATIONSHIP_OPTIONS}
        value={relationship}
        onChange={setRelationship}
        error={relErr}
      />
      {relationship === 'Other' ? (
        <TextInput
          id="f2-other-relationship"
          label="Describe your relationship to the child"
          value={otherDesc}
          onChange={setOtherDesc}
          error={otherErr}
        />
      ) : null}
      {listErr ? <p className="govbb-error-message">{listErr}</p> : null}
    </WillFormPage>
  )
}

// F4 and F6: dependants with a relationship and support description.
function DependantPage({
  section,
  mode,
  recordId,
  title,
  addLabel,
  listTitle,
  emptyError,
}: {
  section: 'f4' | 'f6'
  mode: Mode
  recordId?: string
  title: string
  addLabel: string
  listTitle: string
  emptyError: string
}) {
  const active = useWillGuard()
  const { answers, applyAndGet, newId } = useWillState()
  const navigate = useNavigate()
  const ids = idsFor(section, answers)
  const records = ids
    .map((id) => answers.people.find((p) => p.id === id))
    .filter((p): p is PersonRecord => Boolean(p))

  const [view, setView] = useState<'list' | 'form'>(recordId || records.length === 0 ? 'form' : 'list')
  const idRef = useRef<string>(recordId ?? newId())
  const editing = answers.people.find((p) => p.id === idRef.current)
  const [name, setName] = useState<Name>(editing?.name ?? emptyName())
  const [relationship, setRelationship] = useState(editing?.relationship ?? '')
  const [support, setSupport] = useState(editing?.supportProvided ?? '')
  const [nameErrors, setNameErrors] = useState<NameErrors>({})
  const [relErr, setRelErr] = useState<string | undefined>()
  const [supportErr, setSupportErr] = useState<string | undefined>()
  const [attempt, setAttempt] = useState(0)
  const [listErr, setListErr] = useState<string | undefined>()

  if (!active) return null

  function saveRecord() {
    const ne: NameErrors = {
      firstName: nameError(name.firstName, 'Enter first name.'),
      lastName: nameError(name.lastName, 'Enter last name.'),
      middleNames: optionalNameError(name.middleNames ?? ''),
    }
    const re = requiredTextError(relationship, 'Enter relationship to you.')
    const se = requiredTextError(support, 'Enter what support you provide.')
    setNameErrors(ne)
    setRelErr(re)
    setSupportErr(se)
    setAttempt((a) => a + 1)
    if (ne.firstName || ne.lastName || ne.middleNames || re || se) return
    const id = idRef.current
    const record: PersonRecord = {
      id,
      name: trimmedName(name),
      relationship: relationship.trim(),
      supportProvided: support.trim(),
    }
    applyAndGet((d) => {
      const found = d.people.some((p) => p.id === id)
      d.people = found ? d.people.map((p) => (p.id === id ? { ...p, ...record } : p)) : [...d.people, record]
      const list = idsFor(section, d)
      if (!list.includes(id)) {
        if (section === 'f4') d.dependantAdultChildIds = [...d.dependantAdultChildIds, id]
        else d.otherDependantIds = [...d.otherDependantIds, id]
      }
    })
    if (mode === 'change') {
      proceed(navigate, mode, changeDestination(answers, computeDerived(answers)))
      return
    }
    idRef.current = newId()
    setName(emptyName())
    setRelationship('')
    setSupport('')
    setView('list')
  }

  function removeRecord(id: string) {
    applyAndGet((d) => {
      if (section === 'f4') d.dependantAdultChildIds = d.dependantAdultChildIds.filter((x) => x !== id)
      else d.otherDependantIds = d.otherDependantIds.filter((x) => x !== id)
    })
    if (records.length - 1 === 0) setView('form')
  }

  function onContinue() {
    if (records.length === 0) {
      setListErr(emptyError)
      return
    }
    proceed(navigate, mode, mode === 'change' ? changeDestination(answers, computeDerived(answers)) : nextStep(answers, computeDerived(answers), section))
  }

  if (view === 'list') {
    return (
      <RepeatableRecordList
        title={listTitle}
        records={records.map((p) => ({
          id: p.id,
          lines: [fullName(p.name), p.relationship ?? '', p.supportProvided ?? ''].filter(Boolean),
          changeName: fullName(p.name),
          removeName: fullName(p.name),
        }))}
        onChange={(id) => {
          idRef.current = id
          const rec = answers.people.find((p) => p.id === id)
          setName(rec?.name ?? emptyName())
          setRelationship(rec?.relationship ?? '')
          setSupport(rec?.supportProvided ?? '')
          setView('form')
        }}
        onRemove={removeRecord}
        onAdd={() => {
          idRef.current = newId()
          setName(emptyName())
          setRelationship('')
          setSupport('')
          setView('form')
        }}
        onContinue={onContinue}
        addLabel={addLabel}
      />
    )
  }

  const items = nameItems(section, nameErrors)
  if (relErr) items.push({ fieldId: `${section}-relationship`, message: relErr })
  if (supportErr) items.push({ fieldId: `${section}-support`, message: supportErr })

  return (
    <WillFormPage
      title={title}
      mode={mode}
      errorItems={items}
      submitAttempt={attempt}
      onSubmit={saveRecord}
      continueLabel="Save and continue"
    >
      <NameFields idPrefix={section} value={name} onChange={setName} errors={nameErrors} />
      <TextInput
        id={`${section}-relationship`}
        label="Relationship to you"
        value={relationship}
        onChange={setRelationship}
        error={relErr}
      />
      <TextArea
        id={`${section}-support`}
        label="What support do you provide?"
        value={support}
        onChange={setSupport}
        error={supportErr}
      />
      {listErr ? <p className="govbb-error-message">{listErr}</p> : null}
    </WillFormPage>
  )
}

export function F4Page({ mode, recordId }: { mode: Mode; recordId?: string }) {
  return (
    <DependantPage
      section="f4"
      mode={mode}
      recordId={recordId}
      title="Tell us about the child"
      addLabel="Add another child"
      listTitle="Adult children who depend on you"
      emptyError="Add at least one adult child who depends on you."
    />
  )
}

export function F6Page({ mode, recordId }: { mode: Mode; recordId?: string }) {
  return (
    <DependantPage
      section="f6"
      mode={mode}
      recordId={recordId}
      title="Tell us about the person"
      addLabel="Add another person"
      listTitle="Other people who depend on you"
      emptyError="Add at least one other person who depends on you."
    />
  )
}

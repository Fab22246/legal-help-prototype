import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextInput } from '../../components/forms/TextInput'
import type { ErrorSummaryItem } from '../../components/forms/ErrorSummary'
import { WillFormPage } from '../../components/will/WillFormPage'
import { RepeatableRecordList } from '../../components/will/RepeatableRecordList'
import { useWillGuard } from '../../components/will/useWillGuard'
import { AddressFields, NameFields, emptyAddress, emptyName } from '../../components/will/fieldGroups'
import type { AddressErrors, NameErrors } from '../../components/will/fieldGroups'
import { PersonChoice } from '../../components/will/recipientControls'
import { proceed } from '../../components/will/nav'
import { useWillState } from '../../state/will/WillState'
import { changeDestination, nextStep, personOptionLabel } from '../../state/will/journey'
import { computeDerived } from '../../state/will/routeEngine'
import { addressLine, fullName, relationshipLabel } from '../../state/will/format'
import { nameError, optionalNameError, requiredTextError } from '../../state/will/validation'
import type { Address, Name, PersonRecord, WillAnswers } from '../../state/will/types'

type Mode = 'forward' | 'change'
type RoleKey = 'executorIds' | 'replacementExecutorIds' | 'guardianIds' | 'replacementGuardianIds'

interface RoleConfig {
  section: string
  roleKey: RoleKey
  title: string
  listTitle: string
  addLabel: string
  emptyError: string
}

const CONFIG: Record<string, RoleConfig> = {
  e2: {
    section: 'e2',
    roleKey: 'executorIds',
    title: 'Who do you want to name as an executor?',
    listTitle: 'Executors',
    addLabel: 'Add another executor',
    emptyError: 'Add at least one executor.',
  },
  e4: {
    section: 'e4',
    roleKey: 'replacementExecutorIds',
    title: 'Who do you want to name as a replacement executor?',
    listTitle: 'Replacement executors',
    addLabel: 'Add another executor',
    emptyError: 'Add at least one replacement executor.',
  },
  g2: {
    section: 'g2',
    roleKey: 'guardianIds',
    title: 'Who do you want to name as a guardian?',
    listTitle: 'Guardians',
    addLabel: 'Add another guardian',
    emptyError: 'Add at least one guardian.',
  },
  g4: {
    section: 'g4',
    roleKey: 'replacementGuardianIds',
    title: 'Who do you want to name as a replacement guardian?',
    listTitle: 'Replacement guardians',
    addLabel: 'Add another guardian',
    emptyError: 'Add at least one replacement guardian.',
  },
}

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

function trimmedAddress(a: Address): Address {
  return {
    line1: a.line1.trim(),
    line2: (a.line2 ?? '').trim() || undefined,
    townOrCity: a.townOrCity.trim(),
    parish: (a.parish ?? '').trim() || undefined,
    country: a.country.trim(),
  }
}

function roleList(answers: WillAnswers, key: RoleKey): string[] {
  return answers[key]
}

function PersonRolePage({ id, mode, recordId }: { id: string; mode: Mode; recordId?: string }) {
  const config = CONFIG[id]
  const active = useWillGuard()
  const { answers, applyAndGet, newId } = useWillState()
  const navigate = useNavigate()

  const ids = roleList(answers, config.roleKey)
  const records = ids
    .map((rid) => answers.people.find((p) => p.id === rid))
    .filter((p): p is PersonRecord => Boolean(p))

  const editingExisting = recordId ? answers.people.find((p) => p.id === recordId) : undefined
  const [view, setView] = useState<'list' | 'form'>(recordId || records.length === 0 ? 'form' : 'list')
  const [editId, setEditId] = useState<string | undefined>(recordId)

  // Person choice: an existing person id or 'new'. When editing a record the
  // choice is fixed to that person.
  const [choice, setChoice] = useState<string | undefined>(editingExisting ? editingExisting.id : undefined)
  const [name, setName] = useState<Name>(editingExisting?.name ?? emptyName())
  const [relationship, setRelationship] = useState(editingExisting?.relationship ?? '')
  const [address, setAddress] = useState<Address>(editingExisting?.address ?? emptyAddress())

  const [nameErrors, setNameErrors] = useState<NameErrors>({})
  const [relErr, setRelErr] = useState<string | undefined>()
  const [addressErrors, setAddressErrors] = useState<AddressErrors>({})
  const [choiceErr, setChoiceErr] = useState<string | undefined>()
  const [attempt, setAttempt] = useState(0)
  const [listErr, setListErr] = useState<string | undefined>()

  if (!active) return null

  // Whether the currently chosen existing person already has each attribute.
  const chosenExisting = editId
    ? editingExisting
    : choice && choice !== 'new'
      ? answers.people.find((p) => p.id === choice)
      : undefined
  const isNew = !editId && choice === 'new'
  const relationshipCollected =
    !!chosenExisting &&
    (chosenExisting.id === answers.spousePersonId ||
      chosenExisting.id === answers.partnerPersonId ||
      Boolean((chosenExisting.relationship ?? '').trim()))
  const needRelationship = isNew || (!!editId && !relationshipCollected)
  const addressAlready = Boolean(chosenExisting?.address)
  const needAddress = isNew || !addressAlready

  function beginAdd() {
    setEditId(undefined)
    setChoice(undefined)
    setName(emptyName())
    setRelationship('')
    setAddress(emptyAddress())
    setNameErrors({})
    setRelErr(undefined)
    setAddressErrors({})
    setChoiceErr(undefined)
    setView('form')
  }

  function beginChange(rid: string) {
    const rec = answers.people.find((p) => p.id === rid)
    setEditId(rid)
    setChoice(rid)
    setName(rec?.name ?? emptyName())
    setRelationship(rec?.relationship ?? '')
    setAddress(rec?.address ?? emptyAddress())
    setNameErrors({})
    setRelErr(undefined)
    setAddressErrors({})
    setChoiceErr(undefined)
    setView('form')
  }

  function removeRecord(rid: string) {
    applyAndGet((d) => {
      d[config.roleKey] = d[config.roleKey].filter((x) => x !== rid)
    })
    if (records.length - 1 === 0) setView('form')
  }

  function afterSave() {
    if (mode === 'change') {
      proceed(navigate, mode, changeDestination(answers, computeDerived(answers)))
      return
    }
    beginAdd()
    setView('list')
  }

  function saveRecord() {
    // Validate
    const ne: NameErrors = {}
    let re: string | undefined
    const ae: AddressErrors = {}
    let ce: string | undefined

    if (!editId && !choice) {
      ce = 'Select an answer to: ' + config.title.replace(/\?\s*$/, '') + '.'
    }
    if (isNew || editId) {
      ne.firstName = nameError(name.firstName, 'Enter first name.')
      ne.lastName = nameError(name.lastName, 'Enter last name.')
      ne.middleNames = optionalNameError(name.middleNames ?? '')
    }
    if (needRelationship) re = requiredTextError(relationship, 'Enter relationship to you.')
    if (needAddress) {
      ae.line1 = requiredTextError(address.line1, 'Enter address line 1.')
      ae.townOrCity = requiredTextError(address.townOrCity, 'Enter town or city.')
      ae.country = requiredTextError(address.country, 'Enter country.')
    }

    setNameErrors(ne)
    setRelErr(re)
    setAddressErrors(ae)
    setChoiceErr(ce)
    setAttempt((a) => a + 1)
    if (ce || ne.firstName || ne.lastName || ne.middleNames || re || ae.line1 || ae.townOrCity || ae.country) return

    const targetId = editId ?? (choice === 'new' ? newId() : (choice as string))
    applyAndGet((d) => {
      const found = d.people.find((p) => p.id === targetId)
      if (isNew || editId) {
        const updated: PersonRecord = {
          id: targetId,
          name: trimmedName(name),
          relationship: needRelationship ? relationship.trim() : found?.relationship,
          address: needAddress ? trimmedAddress(address) : found?.address,
          dateOfBirth: found?.dateOfBirth,
          under18Answer: found?.under18Answer,
          supportProvided: found?.supportProvided,
          livedTogetherFiveYears: found?.livedTogetherFiveYears,
        }
        d.people = found ? d.people.map((p) => (p.id === targetId ? updated : p)) : [...d.people, updated]
      } else if (found && needAddress) {
        d.people = d.people.map((p) => (p.id === targetId ? { ...p, address: trimmedAddress(address) } : p))
      }
      if (!d[config.roleKey].includes(targetId)) d[config.roleKey] = [...d[config.roleKey], targetId]
    })
    afterSave()
  }

  function onContinue() {
    if (records.length === 0) {
      setListErr(config.emptyError)
      return
    }
    proceed(
      navigate,
      mode,
      mode === 'change' ? changeDestination(answers, computeDerived(answers)) : nextStep(answers, computeDerived(answers), id),
    )
  }

  if (view === 'list') {
    return (
      <RepeatableRecordList
        title={config.listTitle}
        records={records.map((p) => ({
          id: p.id,
          lines: [fullName(p.name), relationshipLabel(answers, p), addressLine(p.address)].filter(Boolean),
          changeName: fullName(p.name),
          removeName: fullName(p.name),
        }))}
        onChange={beginChange}
        onRemove={removeRecord}
        onAdd={beginAdd}
        onContinue={onContinue}
        addLabel={config.addLabel}
      />
    )
  }

  const items: ErrorSummaryItem[] = []
  if (choiceErr) items.push({ fieldId: `${config.section}-person-new`, message: choiceErr })
  items.push(...nameItems(config.section, nameErrors))
  if (relErr) items.push({ fieldId: `${config.section}-relationship`, message: relErr })
  if (addressErrors.line1) items.push({ fieldId: `${config.section}-line1`, message: addressErrors.line1 })
  if (addressErrors.townOrCity) items.push({ fieldId: `${config.section}-town`, message: addressErrors.townOrCity })
  if (addressErrors.country) items.push({ fieldId: `${config.section}-country`, message: addressErrors.country })

  return (
    <WillFormPage
      title={config.title}
      mode={mode}
      errorItems={items}
      submitAttempt={attempt}
      onSubmit={saveRecord}
      continueLabel="Save and continue"
    >
      {!editId ? (
        <PersonChoice
          name={`${config.section}-person`}
          legend={config.title}
          answers={answers}
          value={choice}
          onChange={setChoice}
          error={choiceErr}
        />
      ) : (
        <p className="page__text">{personOptionLabel(answers, editId)}</p>
      )}
      {isNew || editId ? (
        <NameFields idPrefix={config.section} value={name} onChange={setName} errors={nameErrors} />
      ) : null}
      {needRelationship ? (
        <TextInput
          id={`${config.section}-relationship`}
          label="Relationship to you"
          value={relationship}
          onChange={setRelationship}
          error={relErr}
        />
      ) : null}
      {needAddress ? (
        <AddressFields idPrefix={config.section} value={address} onChange={setAddress} errors={addressErrors} />
      ) : null}
      {listErr ? <p className="govbb-error-message">{listErr}</p> : null}
    </WillFormPage>
  )
}

export function E2Page(props: { mode: Mode; recordId?: string }) {
  return <PersonRolePage id="e2" {...props} />
}
export function E4Page(props: { mode: Mode; recordId?: string }) {
  return <PersonRolePage id="e4" {...props} />
}
export function G2Page(props: { mode: Mode; recordId?: string }) {
  return <PersonRolePage id="g2" {...props} />
}
export function G4Page(props: { mode: Mode; recordId?: string }) {
  return <PersonRolePage id="g4" {...props} />
}

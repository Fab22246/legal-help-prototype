import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RadioGroup } from '../../components/forms/RadioGroup'
import { TextInput } from '../../components/forms/TextInput'
import { TextArea } from '../../components/forms/TextArea'
import type { ErrorSummaryItem } from '../../components/forms/ErrorSummary'
import { WillFormPage } from '../../components/will/WillFormPage'
import { RepeatableRecordList } from '../../components/will/RepeatableRecordList'
import { useWillGuard } from '../../components/will/useWillGuard'
import { NameFields, emptyName } from '../../components/will/fieldGroups'
import type { NameErrors } from '../../components/will/fieldGroups'
import { PersonChoice, OrgChoice } from '../../components/will/recipientControls'
import { proceed } from '../../components/will/nav'
import { useWillState } from '../../state/will/WillState'
import { changeDestination, nextStep } from '../../state/will/journey'
import { computeDerived, computeIssues } from '../../state/will/routeEngine'
import { findOrganisationName, findPerson, fullName } from '../../state/will/format'
import {
  nameError,
  optionalNameError,
  orgNameMissingError,
  requiredAnswerError,
  requiredRadioError,
  requiredTextError,
} from '../../state/will/validation'
import type { IssueCode, Name, RecipientType } from '../../state/will/types'

type Mode = 'forward' | 'change'

const C2_LABELS: Record<IssueCode, string> = {
  JOINT_WILL: 'What do you and the other person want the will to do?',
  EXISTING_WILL_UNCERTAIN: 'What do you know about the will you may already have?',
  EXISTING_WILL_NOT_REPLACED: 'What do you want to keep from your existing will?',
  BUSINESS_SUCCESSION: 'What do you want to happen to the business?',
  OWNERSHIP_DISPUTE: 'What money or property is disputed?',
  LIFETIME_INTEREST: 'Who should use the money or property during their lifetime, and who should receive it afterwards?',
  CONDITIONAL_GIFT: 'What condition do you want to set?',
  POSSIBLE_INSOLVENCY: 'What are you concerned about owing?',
}
const C2_ORDER: IssueCode[] = [
  'JOINT_WILL',
  'EXISTING_WILL_UNCERTAIN',
  'EXISTING_WILL_NOT_REPLACED',
  'BUSINESS_SUCCESSION',
  'OWNERSHIP_DISPUTE',
  'LIFETIME_INTEREST',
  'CONDITIONAL_GIFT',
  'POSSIBLE_INSOLVENCY',
]
const C3_ROLE_QUESTION = 'What do you want this person or organisation to do or receive?'

export function C2Page({ mode }: { mode: Mode }) {
  const active = useWillGuard()
  const { answers, applyAndGet } = useWillState()
  const navigate = useNavigate()
  const issues = computeIssues(answers).filter((code) => C2_ORDER.includes(code))
  const ordered = C2_ORDER.filter((code) => issues.includes(code))

  const [texts, setTexts] = useState<Partial<Record<IssueCode, string>>>(() => ({ ...answers.cIssueText }))
  const [jointName, setJointName] = useState<Name>(answers.cJointOtherName ?? emptyName())
  const [errors, setErrors] = useState<Partial<Record<IssueCode, string>>>({})
  const [jointErrors, setJointErrors] = useState<NameErrors>({})
  const [attempt, setAttempt] = useState(0)

  if (!active) return null

  function onSubmit() {
    const e: Partial<Record<IssueCode, string>> = {}
    ordered.forEach((code) => {
      const err = requiredTextError(texts[code] ?? '', requiredAnswerError(C2_LABELS[code]))
      if (err) e[code] = err
    })
    let je: NameErrors = {}
    if (issues.includes('JOINT_WILL')) {
      je = {
        firstName: nameError(jointName.firstName, 'Enter first name.'),
        lastName: nameError(jointName.lastName, 'Enter last name.'),
        middleNames: optionalNameError(jointName.middleNames ?? ''),
      }
    }
    setErrors(e)
    setJointErrors(je)
    setAttempt((a) => a + 1)
    if (Object.keys(e).length > 0 || je.firstName || je.lastName || je.middleNames) return

    const next = applyAndGet((d) => {
      const nextText: Partial<Record<IssueCode, string>> = {}
      ordered.forEach((code) => {
        nextText[code] = (texts[code] ?? '').trim()
      })
      d.cIssueText = nextText
      if (issues.includes('JOINT_WILL')) {
        d.cJointOtherName = {
          firstName: jointName.firstName.trim(),
          middleNames: (jointName.middleNames ?? '').trim() || undefined,
          lastName: jointName.lastName.trim(),
        }
      }
    })
    proceed(navigate, mode, mode === 'change' ? changeDestination(next, computeDerived(next)) : nextStep(next, computeDerived(next), 'c2'))
  }

  const items: ErrorSummaryItem[] = []
  ordered.forEach((code) => {
    if (errors[code]) items.push({ fieldId: `c2-${code}`, message: errors[code] as string })
  })
  if (jointErrors.firstName) items.push({ fieldId: 'c2-joint-first-name', message: jointErrors.firstName })
  if (jointErrors.middleNames) items.push({ fieldId: 'c2-joint-middle-names', message: jointErrors.middleNames })
  if (jointErrors.lastName) items.push({ fieldId: 'c2-joint-last-name', message: jointErrors.lastName })

  return (
    <WillFormPage title="Tell us more about what you need the will to do" mode={mode} errorItems={items} submitAttempt={attempt} onSubmit={onSubmit}>
      {ordered.map((code) => (
        <TextArea
          key={code}
          id={`c2-${code}`}
          label={C2_LABELS[code]}
          hint="Give a short description. A lawyer can ask you for documents and more detail."
          value={texts[code] ?? ''}
          onChange={(v) => setTexts((t) => ({ ...t, [code]: v }))}
          error={errors[code]}
        />
      ))}
      {issues.includes('JOINT_WILL') ? <NameFields idPrefix="c2-joint" value={jointName} onChange={setJointName} errors={jointErrors} /> : null}
    </WillFormPage>
  )
}

export function C3Page({ mode, recordId }: { mode: Mode; recordId?: string }) {
  const active = useWillGuard()
  const { answers, applyAndGet, newId } = useWillState()
  const navigate = useNavigate()
  const list = answers.cIncludes

  const editing = recordId ? list.find((r) => r.id === recordId) : undefined
  const [view, setView] = useState<'list' | 'form'>(recordId || list.length === 0 ? 'form' : 'list')
  const idRef = useRef<string>(recordId ?? newId())

  const [type, setType] = useState<RecipientType | undefined>(editing?.recipientType)
  const [personChoice, setPersonChoice] = useState<string | undefined>(editing?.personId)
  const [orgChoice, setOrgChoice] = useState<string | undefined>(editing?.orgId)
  const existingPerson = editing?.personId ? findPerson(answers, editing.personId) : undefined
  const existingOrg = editing?.orgId ? answers.organisations.find((o) => o.id === editing.orgId) : undefined
  const [name, setName] = useState<Name>(existingPerson?.name ?? emptyName())
  const [relationship, setRelationship] = useState(existingPerson?.relationship ?? '')
  const [orgName, setOrgName] = useState(existingOrg?.legalName ?? '')
  const [orgAddress, setOrgAddress] = useState<string>(existingOrg?.address?.line1 ?? '')
  const [roleText, setRoleText] = useState(editing?.roleText ?? '')

  const [typeErr, setTypeErr] = useState<string | undefined>()
  const [choiceErr, setChoiceErr] = useState<string | undefined>()
  const [nameErrors, setNameErrors] = useState<NameErrors>({})
  const [relErr, setRelErr] = useState<string | undefined>()
  const [orgNameErr, setOrgNameErr] = useState<string | undefined>()
  const [roleErr, setRoleErr] = useState<string | undefined>()
  const [attempt, setAttempt] = useState(0)
  const [listErr, setListErr] = useState<string | undefined>()

  if (!active) return null

  const isNewPerson = type === 'person' && personChoice === 'new'
  const isNewOrg = type === 'organisation' && orgChoice === 'new-org'

  function resetForm() {
    idRef.current = newId()
    setType(undefined)
    setPersonChoice(undefined)
    setOrgChoice(undefined)
    setName(emptyName())
    setRelationship('')
    setOrgName('')
    setOrgAddress('')
    setRoleText('')
    setTypeErr(undefined)
    setChoiceErr(undefined)
    setNameErrors({})
    setRelErr(undefined)
    setOrgNameErr(undefined)
    setRoleErr(undefined)
  }

  function saveRecord() {
    let te: string | undefined
    let ce: string | undefined
    let ne: NameErrors = {}
    let re: string | undefined
    let oe: string | undefined
    if (!type) te = requiredRadioError('Who do you want to include in your will?')
    if (type === 'person') {
      if (!personChoice) ce = 'Select a person.'
      else if (personChoice === 'new') {
        ne = {
          firstName: nameError(name.firstName, 'Enter first name.'),
          lastName: nameError(name.lastName, 'Enter last name.'),
          middleNames: optionalNameError(name.middleNames ?? ''),
        }
        re = requiredTextError(relationship, 'Enter relationship to you.')
      }
    }
    if (type === 'organisation') {
      if (!orgChoice) ce = 'Select an organisation.'
      else if (orgChoice === 'new-org') oe = orgName.trim().length === 0 ? orgNameMissingError : undefined
    }
    const roleE = requiredTextError(roleText, requiredAnswerError(C3_ROLE_QUESTION))

    setTypeErr(te)
    setChoiceErr(ce)
    setNameErrors(ne)
    setRelErr(re)
    setOrgNameErr(oe)
    setRoleErr(roleE)
    setAttempt((a) => a + 1)
    if (te || ce || ne.firstName || ne.lastName || ne.middleNames || re || oe || roleE) return

    const id = idRef.current
    const next = applyAndGet((d) => {
      let personId: string | undefined
      let orgId: string | undefined
      if (type === 'person') {
        if (personChoice === 'new') {
          personId = newId()
          d.people = [...d.people, { id: personId, name: { firstName: name.firstName.trim(), middleNames: (name.middleNames ?? '').trim() || undefined, lastName: name.lastName.trim() }, relationship: relationship.trim() }]
        } else {
          personId = personChoice
        }
      } else {
        if (orgChoice === 'new-org') {
          orgId = newId()
          const addressText = orgAddress.trim()
          const addr = addressText ? { line1: addressText, townOrCity: '', country: '' } : undefined
          d.organisations = [...d.organisations, { id: orgId, legalName: orgName.trim(), address: addr }]
        } else {
          orgId = orgChoice
        }
      }
      const record = { id, recipientType: type, personId, orgId, roleText: roleText.trim() }
      const found = d.cIncludes.some((r) => r.id === id)
      d.cIncludes = found ? d.cIncludes.map((r) => (r.id === id ? record : r)) : [...d.cIncludes, record]
    })

    if (mode === 'change') {
      proceed(navigate, mode, changeDestination(next, computeDerived(next)))
      return
    }
    resetForm()
    setView('list')
  }

  function removeRecord(id: string) {
    applyAndGet((d) => {
      d.cIncludes = d.cIncludes.filter((r) => r.id !== id)
    })
    if (list.length - 1 === 0) setView('form')
  }

  function beginChange(id: string) {
    const rec = list.find((r) => r.id === id)
    if (!rec) return
    idRef.current = id
    setType(rec.recipientType)
    setPersonChoice(rec.personId)
    setOrgChoice(rec.orgId)
    const p = rec.personId ? findPerson(answers, rec.personId) : undefined
    const o = rec.orgId ? answers.organisations.find((x) => x.id === rec.orgId) : undefined
    setName(p?.name ?? emptyName())
    setRelationship(p?.relationship ?? '')
    setOrgName(o?.legalName ?? '')
    setOrgAddress(o?.address?.line1 ?? '')
    setRoleText(rec.roleText ?? '')
    setView('form')
  }

  function includeLabel(id: string): string {
    const rec = list.find((r) => r.id === id)
    if (!rec) return ''
    return rec.recipientType === 'organisation' ? findOrganisationName(answers, rec.orgId) : fullName(findPerson(answers, rec.personId)?.name)
  }

  function onContinue() {
    if (list.length === 0) {
      setListErr('Add at least one person or organisation to include.')
      return
    }
    proceed(navigate, mode, mode === 'change' ? changeDestination(answers, computeDerived(answers)) : nextStep(answers, computeDerived(answers), 'c3'))
  }

  if (view === 'list') {
    return (
      <RepeatableRecordList
        title="Who do you want to include in your will?"
        records={list.map((r) => ({
          id: r.id,
          lines: [includeLabel(r.id), r.roleText ?? ''].filter(Boolean),
          changeName: includeLabel(r.id),
          removeName: includeLabel(r.id),
        }))}
        onChange={beginChange}
        onRemove={removeRecord}
        onAdd={() => {
          resetForm()
          setView('form')
        }}
        onContinue={onContinue}
        addLabel="Add another person or organisation"
      />
    )
  }

  const items: ErrorSummaryItem[] = []
  if (typeErr) items.push({ fieldId: 'c3-type-person', message: typeErr })
  if (choiceErr) items.push({ fieldId: type === 'organisation' ? 'c3-org-new-org' : 'c3-person-new', message: choiceErr })
  if (nameErrors.firstName) items.push({ fieldId: 'c3-first-name', message: nameErrors.firstName })
  if (nameErrors.middleNames) items.push({ fieldId: 'c3-middle-names', message: nameErrors.middleNames })
  if (nameErrors.lastName) items.push({ fieldId: 'c3-last-name', message: nameErrors.lastName })
  if (relErr) items.push({ fieldId: 'c3-relationship', message: relErr })
  if (orgNameErr) items.push({ fieldId: 'c3-org-name', message: orgNameErr })
  if (roleErr) items.push({ fieldId: 'c3-role', message: roleErr })

  return (
    <WillFormPage
      title="Who do you want to include in your will?"
      mode={mode}
      errorItems={items}
      submitAttempt={attempt}
      onSubmit={saveRecord}
      intro="Include any person or organisation you want to receive something, and anyone you want to carry out the will or care for your children."
    >
      <RadioGroup
        name="c3-type"
        legend="Who do you want to include in your will?"
        legendVisuallyHidden
        options={[
          { value: 'person', label: 'A person' },
          { value: 'organisation', label: 'An organisation' },
        ]}
        value={type}
        onChange={(v) => setType(v as RecipientType)}
        error={typeErr}
      />
      {type === 'person' ? (
        <>
          <PersonChoice name="c3-person" legend="Select a person" answers={answers} value={personChoice} onChange={setPersonChoice} error={choiceErr} />
          {isNewPerson ? (
            <>
              <NameFields idPrefix="c3" value={name} onChange={setName} errors={nameErrors} />
              <TextInput id="c3-relationship" label="Relationship to you" value={relationship} onChange={setRelationship} error={relErr} />
            </>
          ) : null}
        </>
      ) : null}
      {type === 'organisation' ? (
        <>
          <OrgChoice name="c3-org" legend="Select an organisation" answers={answers} value={orgChoice} onChange={setOrgChoice} error={choiceErr} />
          {isNewOrg ? (
            <>
              <TextInput id="c3-org-name" label="Full legal name of organisation" value={orgName} onChange={setOrgName} error={orgNameErr} />
              <TextInput id="c3-org-address" label="Address" optional value={orgAddress} onChange={setOrgAddress} />
            </>
          ) : null}
        </>
      ) : null}
      {type ? <TextArea id="c3-role" label={C3_ROLE_QUESTION} value={roleText} onChange={setRoleText} error={roleErr} /> : null}
      {listErr ? <p className="govbb-error-message">{listErr}</p> : null}
    </WillFormPage>
  )
}

export function C4Page({ mode, recordId }: { mode: Mode; recordId?: string }) {
  const active = useWillGuard()
  const { answers, applyAndGet, newId } = useWillState()
  const navigate = useNavigate()

  // Prepopulate from P2 descriptions the first time C4 is shown.
  useEffect(() => {
    if (answers.cAssets.length === 0 && answers.jointAssets.length > 0) {
      applyAndGet((d) => {
        d.cAssets = d.jointAssets.map((asset) => ({ id: newId(), type: '', description: asset.description, country: '' }))
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const list = answers.cAssets
  const editing = recordId ? list.find((r) => r.id === recordId) : undefined
  // Prepopulated records from P2 are shown as a list, not a blank new-record
  // form, so the user sees them before continuing.
  const [view, setView] = useState<'list' | 'form'>(
    recordId || (list.length === 0 && answers.jointAssets.length === 0) ? 'form' : 'list',
  )
  const idRef = useRef<string>(recordId ?? newId())
  const [type, setType] = useState(editing?.type ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [country, setCountry] = useState(editing?.country ?? '')
  const [typeErr, setTypeErr] = useState<string | undefined>()
  const [descErr, setDescErr] = useState<string | undefined>()
  const [countryErr, setCountryErr] = useState<string | undefined>()
  const [attempt, setAttempt] = useState(0)
  const [listErr, setListErr] = useState<string | undefined>()

  if (!active) return null

  function saveRecord() {
    const te = requiredTextError(type, 'Enter type of money or property.')
    const de = requiredTextError(description, 'Enter short description.')
    const ce = requiredTextError(country, 'Enter country where it is held or located.')
    setTypeErr(te)
    setDescErr(de)
    setCountryErr(ce)
    setAttempt((a) => a + 1)
    if (te || de || ce) return
    const id = idRef.current
    const next = applyAndGet((d) => {
      const record = { id, type: type.trim(), description: description.trim(), country: country.trim() }
      const found = d.cAssets.some((r) => r.id === id)
      d.cAssets = found ? d.cAssets.map((r) => (r.id === id ? record : r)) : [...d.cAssets, record]
    })
    if (mode === 'change') {
      proceed(navigate, mode, changeDestination(next, computeDerived(next)))
      return
    }
    idRef.current = newId()
    setType('')
    setDescription('')
    setCountry('')
    setView('list')
  }

  function removeRecord(id: string) {
    applyAndGet((d) => {
      d.cAssets = d.cAssets.filter((r) => r.id !== id)
    })
    if (list.length - 1 === 0) setView('form')
  }

  function beginChange(id: string) {
    const rec = list.find((r) => r.id === id)
    if (!rec) return
    idRef.current = id
    setType(rec.type)
    setDescription(rec.description)
    setCountry(rec.country)
    setView('form')
  }

  function onContinue() {
    if (list.length === 0) {
      setListErr('Add at least one item of money or property.')
      return
    }
    const incomplete = list.find((r) => !r.type.trim() || !r.description.trim() || !r.country.trim())
    if (incomplete) {
      beginChange(incomplete.id)
      setAttempt((a) => a + 1)
      setTypeErr(incomplete.type.trim() ? undefined : 'Enter type of money or property.')
      setDescErr(incomplete.description.trim() ? undefined : 'Enter short description.')
      setCountryErr(incomplete.country.trim() ? undefined : 'Enter country where it is held or located.')
      return
    }
    proceed(navigate, mode, mode === 'change' ? changeDestination(answers, computeDerived(answers)) : nextStep(answers, computeDerived(answers), 'c4'))
  }

  if (view === 'list') {
    return (
      <RepeatableRecordList
        title="What money or property do you want to discuss with a lawyer?"
        records={list.map((r) => ({
          id: r.id,
          lines: [r.type, r.description, r.country].filter(Boolean),
          changeName: r.description,
          removeName: r.description,
        }))}
        onChange={beginChange}
        onRemove={removeRecord}
        onAdd={() => {
          idRef.current = newId()
          setType('')
          setDescription('')
          setCountry('')
          setView('form')
        }}
        onContinue={onContinue}
        addLabel="Add another item"
      />
    )
  }

  const items: ErrorSummaryItem[] = []
  if (typeErr) items.push({ fieldId: 'c4-type', message: typeErr })
  if (descErr) items.push({ fieldId: 'c4-description', message: descErr })
  if (countryErr) items.push({ fieldId: 'c4-country', message: countryErr })

  return (
    <WillFormPage
      title="What money or property do you want to discuss with a lawyer?"
      mode={mode}
      errorItems={items}
      submitAttempt={attempt}
      onSubmit={saveRecord}
    >
      <p className="govbb-hint">Do not enter account numbers, passwords or document numbers.</p>
      <TextInput id="c4-type" label="Type of money or property" value={type} onChange={setType} error={typeErr} />
      <TextInput id="c4-description" label="Short description" value={description} onChange={setDescription} error={descErr} />
      <TextInput id="c4-country" label="Country where it is held or located" value={country} onChange={setCountry} error={countryErr} />
      {listErr ? <p className="govbb-error-message">{listErr}</p> : null}
    </WillFormPage>
  )
}

export function C5Page({ mode }: { mode: Mode }) {
  const active = useWillGuard()
  const { answers, applyAndGet } = useWillState()
  const navigate = useNavigate()
  const [other, setOther] = useState(answers.cOther ?? '')

  if (!active) return null

  function onSubmit() {
    const next = applyAndGet((d) => {
      d.cOther = other.trim() || undefined
    })
    proceed(navigate, mode, mode === 'change' ? changeDestination(next, computeDerived(next)) : nextStep(next, computeDerived(next), 'c5'))
  }

  return (
    <WillFormPage title="Is there anything else the lawyer should know?" mode={mode} errorItems={[]} submitAttempt={0} onSubmit={onSubmit}>
      <TextArea
        id="c5-other"
        label="Other information"
        optional
        hint="Do not include passwords or account numbers."
        value={other}
        onChange={setOther}
      />
    </WillFormPage>
  )
}

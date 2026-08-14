import { RadioGroup } from '../forms/RadioGroup'
import { personOptionLabel } from '../../state/will/journey'
import { findOrganisationName } from '../../state/will/format'
import type { WillAnswers } from '../../state/will/types'

// Person chooser: existing shared people as radio options plus "Someone else".
export function PersonChoice({
  name,
  legend,
  answers,
  value,
  onChange,
  error,
  legendVisuallyHidden,
}: {
  name: string
  legend: string
  answers: WillAnswers
  value: string | undefined
  onChange: (value: string) => void
  error?: string
  legendVisuallyHidden?: boolean
}) {
  const options = [
    ...answers.people.map((person) => ({ value: person.id, label: personOptionLabel(answers, person.id) })),
    { value: 'new', label: 'Someone else' },
  ]
  return (
    <RadioGroup name={name} legend={legend} options={options} value={value} onChange={onChange} error={error} legendVisuallyHidden={legendVisuallyHidden} />
  )
}

// Organisation chooser: existing organisations plus "Another organisation".
export function OrgChoice({
  name,
  legend,
  answers,
  value,
  onChange,
  error,
  legendVisuallyHidden,
}: {
  name: string
  legend: string
  answers: WillAnswers
  value: string | undefined
  onChange: (value: string) => void
  error?: string
  legendVisuallyHidden?: boolean
}) {
  const options = [
    ...answers.organisations.map((org) => ({ value: org.id, label: findOrganisationName(answers, org.id) })),
    { value: 'new-org', label: 'Another organisation' },
  ]
  return (
    <RadioGroup name={name} legend={legend} options={options} value={value} onChange={onChange} error={error} legendVisuallyHidden={legendVisuallyHidden} />
  )
}

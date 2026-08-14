import { TextInput } from '../forms/TextInput'
import type { Address, Name } from '../../state/will/types'

export interface NameErrors {
  firstName?: string
  middleNames?: string
  lastName?: string
}

export function emptyName(): Name {
  return { firstName: '', middleNames: '', lastName: '' }
}

export function NameFields({
  idPrefix,
  value,
  onChange,
  errors,
}: {
  idPrefix: string
  value: Name
  onChange: (value: Name) => void
  errors: NameErrors
}) {
  return (
    <>
      <TextInput
        id={`${idPrefix}-first-name`}
        label="First name"
        value={value.firstName}
        onChange={(v) => onChange({ ...value, firstName: v })}
        error={errors.firstName}
      />
      <TextInput
        id={`${idPrefix}-middle-names`}
        label="Middle names"
        optional
        value={value.middleNames ?? ''}
        onChange={(v) => onChange({ ...value, middleNames: v })}
        error={errors.middleNames}
      />
      <TextInput
        id={`${idPrefix}-last-name`}
        label="Last name"
        value={value.lastName}
        onChange={(v) => onChange({ ...value, lastName: v })}
        error={errors.lastName}
      />
    </>
  )
}

export interface AddressErrors {
  line1?: string
  townOrCity?: string
  country?: string
}

export function emptyAddress(): Address {
  return { line1: '', line2: '', townOrCity: '', parish: '', country: '' }
}

export function AddressFields({
  idPrefix,
  value,
  onChange,
  errors,
}: {
  idPrefix: string
  value: Address
  onChange: (value: Address) => void
  errors: AddressErrors
}) {
  return (
    <>
      <TextInput
        id={`${idPrefix}-line1`}
        label="Address line 1"
        value={value.line1}
        onChange={(v) => onChange({ ...value, line1: v })}
        error={errors.line1}
      />
      <TextInput
        id={`${idPrefix}-line2`}
        label="Address line 2"
        optional
        value={value.line2 ?? ''}
        onChange={(v) => onChange({ ...value, line2: v })}
      />
      <TextInput
        id={`${idPrefix}-town`}
        label="Town or city"
        value={value.townOrCity}
        onChange={(v) => onChange({ ...value, townOrCity: v })}
        error={errors.townOrCity}
      />
      <TextInput
        id={`${idPrefix}-parish`}
        label="Parish"
        optional
        value={value.parish ?? ''}
        onChange={(v) => onChange({ ...value, parish: v })}
      />
      <TextInput
        id={`${idPrefix}-country`}
        label="Country"
        value={value.country}
        onChange={(v) => onChange({ ...value, country: v })}
        error={errors.country}
      />
    </>
  )
}

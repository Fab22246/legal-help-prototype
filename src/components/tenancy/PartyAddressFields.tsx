import { RadioGroup } from '../forms/RadioGroup'
import { TextInput } from '../forms/TextInput'
import {
  PARISHES,
  type BarbadosAddress,
  type OverseasAddress,
  type Parish,
  type PartyAddress,
  type YesNo,
} from '../../state/tenancyBuilderContext'

interface PartyAddressFieldsProps {
  idPrefix: string
  address: PartyAddress | undefined
  onLocationChange: (v: YesNo) => void
  onBarbadosPatch: (patch: Partial<BarbadosAddress>) => void
  onOverseasPatch: (patch: Partial<OverseasAddress>) => void
  errors: {
    isInBarbados?: string
    addressLine1?: string
    townOrArea?: string
    parish?: string
    townOrCity?: string
    country?: string
  }
}

const LOCATION_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

export function PartyAddressFields(props: PartyAddressFieldsProps) {
  const { idPrefix, address, onLocationChange, onBarbadosPatch, onOverseasPatch, errors } = props
  const isInBarbados = address?.isInBarbados

  return (
    <>
      <RadioGroup
        name={`${idPrefix}-in-barbados`}
        legend="Is this address in Barbados?"
        options={LOCATION_OPTIONS}
        value={isInBarbados}
        onChange={(v) => onLocationChange(v as YesNo)}
        error={errors.isInBarbados}
      />

      {isInBarbados === 'yes' ? (
        <>
          <TextInput
            id={`${idPrefix}-barbados-line1`}
            label="Address line 1"
            value={address?.barbados?.addressLine1 ?? ''}
            onChange={(v) => onBarbadosPatch({ addressLine1: v })}
            error={errors.addressLine1}
          />
          <TextInput
            id={`${idPrefix}-barbados-line2`}
            label="Address line 2"
            value={address?.barbados?.addressLine2 ?? ''}
            onChange={(v) => onBarbadosPatch({ addressLine2: v })}
            optional
          />
          <TextInput
            id={`${idPrefix}-barbados-town`}
            label="Town or area"
            value={address?.barbados?.townOrArea ?? ''}
            onChange={(v) => onBarbadosPatch({ townOrArea: v })}
            error={errors.townOrArea}
          />
          <ParishSelect
            id={`${idPrefix}-barbados-parish`}
            value={address?.barbados?.parish}
            onChange={(v) => onBarbadosPatch({ parish: v })}
            error={errors.parish}
          />
        </>
      ) : null}

      {isInBarbados === 'no' ? (
        <>
          <TextInput
            id={`${idPrefix}-overseas-line1`}
            label="Address line 1"
            value={address?.overseas?.addressLine1 ?? ''}
            onChange={(v) => onOverseasPatch({ addressLine1: v })}
            error={errors.addressLine1}
          />
          <TextInput
            id={`${idPrefix}-overseas-line2`}
            label="Address line 2"
            value={address?.overseas?.addressLine2 ?? ''}
            onChange={(v) => onOverseasPatch({ addressLine2: v })}
            optional
          />
          <TextInput
            id={`${idPrefix}-overseas-town`}
            label="Town or city"
            value={address?.overseas?.townOrCity ?? ''}
            onChange={(v) => onOverseasPatch({ townOrCity: v })}
            error={errors.townOrCity}
          />
          <TextInput
            id={`${idPrefix}-overseas-country`}
            label="Country"
            value={address?.overseas?.country ?? ''}
            onChange={(v) => onOverseasPatch({ country: v })}
            error={errors.country}
          />
        </>
      ) : null}
    </>
  )
}

interface ParishSelectProps {
  id: string
  value: Parish | undefined
  onChange: (v: Parish) => void
  error?: string
}

function ParishSelect({ id, value, onChange, error }: ParishSelectProps) {
  const errorId = error ? `${id}-error` : undefined
  return (
    <div className="govbb-form-group">
      <label className="govbb-label" htmlFor={id}>
        Parish
      </label>
      <select
        className="govbb-input"
        id={id}
        name={id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value as Parish)}
        aria-describedby={errorId}
        aria-invalid={error ? true : undefined}
      >
        <option value="">Select a parish</option>
        {PARISHES.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="govbb-error-message" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

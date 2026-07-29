import { RadioGroup } from '../forms/RadioGroup'
import { TextInput } from '../forms/TextInput'
import type { PartyType, PersonName } from '../../state/tenancyBuilderContext'

interface PartyNameFieldsProps {
  /** Prefix for input ids and error-summary anchors — e.g. "landlord", "tenant", "agent". */
  idPrefix: string
  /** Legend for the party-type question — subject-appropriate. */
  partyTypeLegend: string
  partyType: PartyType | undefined
  onPartyTypeChange: (v: PartyType) => void
  personName: PersonName | undefined
  onPersonNamePatch: (patch: Partial<PersonName>) => void
  organisationName: string | undefined
  onOrganisationNameChange: (v: string) => void
  errors: {
    partyType?: string
    firstName?: string
    lastName?: string
    organisationName?: string
  }
  /** Optional subject noun used in labels — "landlord", "tenant", "agent or manager". */
  personLabelSubject: string
  organisationLabelSubject: string
}

const PARTY_TYPE_OPTIONS = [
  { value: 'person', label: 'A person' },
  { value: 'organisation', label: 'A business or other organisation' },
]

export function PartyNameFields(props: PartyNameFieldsProps) {
  const {
    idPrefix,
    partyTypeLegend,
    partyType,
    onPartyTypeChange,
    personName,
    onPersonNamePatch,
    organisationName,
    onOrganisationNameChange,
    errors,
    personLabelSubject,
    organisationLabelSubject,
  } = props

  return (
    <>
      <RadioGroup
        name={`${idPrefix}-party-type`}
        legend={partyTypeLegend}
        options={PARTY_TYPE_OPTIONS}
        value={partyType}
        onChange={(v) => onPartyTypeChange(v as PartyType)}
        error={errors.partyType}
      />

      {partyType === 'person' ? (
        <>
          <TextInput
            id={`${idPrefix}-first-name`}
            label={`${personLabelSubject}’s first name`}
            value={personName?.firstName ?? ''}
            onChange={(v) => onPersonNamePatch({ firstName: v })}
            error={errors.firstName}
          />
          <TextInput
            id={`${idPrefix}-middle-names`}
            label={`${personLabelSubject}’s middle names`}
            value={personName?.middleNames ?? ''}
            onChange={(v) => onPersonNamePatch({ middleNames: v })}
            optional
          />
          <TextInput
            id={`${idPrefix}-last-name`}
            label={`${personLabelSubject}’s last name`}
            value={personName?.lastName ?? ''}
            onChange={(v) => onPersonNamePatch({ lastName: v })}
            error={errors.lastName}
          />
        </>
      ) : null}

      {partyType === 'organisation' ? (
        <TextInput
          id={`${idPrefix}-organisation-name`}
          label={`Name of ${organisationLabelSubject}`}
          value={organisationName ?? ''}
          onChange={onOrganisationNameChange}
          error={errors.organisationName}
        />
      ) : null}
    </>
  )
}

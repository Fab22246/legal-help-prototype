import type { LandlordRecord, TenantRecord, AgentDetails } from '../../state/tenancyBuilderContext'

// Human-readable display name for a completed party record. Used in list
// rows, in accessible action labels ("Change [name]", "Remove [name]") and
// in confirmation copy. Falls back to a generic label if data is missing.

export function partyDisplayName(
  party: LandlordRecord | TenantRecord | AgentDetails,
  fallback: string,
): string {
  if (party.partyType === 'person' && party.personName) {
    const { firstName, middleNames, lastName } = party.personName
    return [firstName, middleNames, lastName].filter(Boolean).join(' ') || fallback
  }
  if (party.partyType === 'organisation' && party.organisationName) {
    return party.organisationName
  }
  return fallback
}

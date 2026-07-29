// Stable opaque IDs for repeatable tenancy-builder records. Never shown to
// users and never placed in URLs. `crypto.randomUUID` is used where the
// browser provides it; the fallback is a random-plus-timestamp string that is
// unique enough for one browser tab's session state.

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  const random = Math.random().toString(36).slice(2, 12)
  const time = Date.now().toString(36)
  return `id-${time}-${random}`
}

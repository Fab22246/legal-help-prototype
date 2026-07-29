// Detect whether sessionStorage is usable in this browser tab. Some browsers
// (private windows, storage disabled) throw when the app tries to write. The
// provider still runs in memory when this returns false, but the app shows a
// visible warning to the user.

const PROBE_KEY = 'gov-bb.tenancy-builder.probe.v1'

export function isSessionStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false
  try {
    window.sessionStorage.setItem(PROBE_KEY, '1')
    window.sessionStorage.removeItem(PROBE_KEY)
    return true
  } catch {
    return false
  }
}

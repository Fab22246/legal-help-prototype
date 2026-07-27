import { PROTOTYPE_NOTICE } from '../data/content'

// The prototype / unofficial-service notice shown near the top of every page.
export function PrototypeNotice() {
  return (
    <div className="prototype-notice" role="note">
      <p>{PROTOTYPE_NOTICE}</p>
    </div>
  )
}

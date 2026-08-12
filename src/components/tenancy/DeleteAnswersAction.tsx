import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTenancyBuilder } from '../../state/tenancyBuilderContext'

// Service-wide "Delete my answers and start again" link. Rendered as a
// link-styled button at the bottom of every tenancy-builder route (start
// page, list views, forms, holding view). On click, shows an in-page
// confirmation with cancel/confirm actions. On confirm, clears the entire
// tenancy-builder slice and returns the user to the builder start page.
export function DeleteAnswersAction() {
  const { resetAll } = useTenancyBuilder()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <section className="stack--tight warning-notice" aria-label="Confirm delete">
        <h2 className="card-group__title">Are you sure?</h2>
        <p className="page__text">
          Your answers for the tenancy agreement will be removed. This cannot be undone. Information
          in other parts of the site will not be removed.
        </p>
        <div className="govbb-btn-group">
          <button
            type="button"
            className="govbb-btn"
            onClick={() => {
              resetAll()
              navigate('/renting-home/agreement')
            }}
          >
            Yes, delete my answers
          </button>
          <button
            type="button"
            className="govbb-btn--secondary"
            onClick={() => setConfirming(false)}
          >
            Cancel
          </button>
        </div>
      </section>
    )
  }

  return (
    <p className="page__text">
      <button
        type="button"
        className="govbb-btn--link delete-answers-action"
        onClick={() => setConfirming(true)}
      >
        Delete my answers and start again
      </button>
    </p>
  )
}

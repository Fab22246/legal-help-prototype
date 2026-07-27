import type { FormEvent, ReactNode } from 'react'
import { BackLink } from './navigation/BackLink'
import { PrototypeNotice } from './PrototypeNotice'

interface FormPageShellProps {
  title: string
  intro?: ReactNode
  backTo?: string
  backLabel?: string
  children?: ReactNode
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void
  continueLabel?: string
  afterForm?: ReactNode
}

// Reusable shell for future question pages: back link, title, prototype notice,
// a form with a continue button, and an optional after-form slot. No builder
// logic or session storage yet — structure only.
export function FormPageShell({
  title,
  intro,
  backTo = '/',
  backLabel = 'Back',
  children,
  onSubmit,
  continueLabel = 'Continue',
  afterForm,
}: FormPageShellProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit?.(event)
  }

  return (
    <div className="page">
      <BackLink to={backTo}>{backLabel}</BackLink>
      <div className="page__header">
        <h1 className="page__title">{title}</h1>
        {intro}
      </div>
      <PrototypeNotice />
      <form className="govbb-form stack" onSubmit={handleSubmit} noValidate>
        {children}
        <div className="govbb-btn-group">
          <button type="submit" className="govbb-btn">
            {continueLabel}
          </button>
        </div>
      </form>
      {afterForm}
    </div>
  )
}

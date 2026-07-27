interface MoneyInputProps {
  id: string
  label: string
  value?: string
  onChange?: (value: string) => void
  hint?: string
  error?: string
  optional?: boolean
}

// Money amount in Barbados dollars. The "BDS $" prefix is announced via the hint
// so the amount field is clear to screen-reader users.
export function MoneyInput({ id, label, value, onChange, hint, error, optional = false }: MoneyInputProps) {
  const hintId = `${id}-hint`
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ')

  return (
    <div className="govbb-form-group">
      <label className="govbb-label" htmlFor={id}>
        {label}
        {optional ? ' (optional)' : ''}
      </label>
      <p className="govbb-hint" id={hintId}>
        {hint ? `${hint} ` : ''}Enter the amount in Barbados dollars (BDS $).
      </p>
      <div className="govbb-input-wrapper">
        <input
          className="govbb-input"
          id={id}
          name={id}
          inputMode="decimal"
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
        />
      </div>
      {error ? (
        <p className="govbb-error-message" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

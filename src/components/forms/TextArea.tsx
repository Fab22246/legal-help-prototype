interface TextAreaProps {
  id: string
  label: string
  value?: string
  onChange?: (value: string) => void
  hint?: string
  error?: string
  rows?: number
  optional?: boolean
}

export function TextArea({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  rows = 4,
  optional = false,
}: TextAreaProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="govbb-form-group">
      <label className="govbb-label" htmlFor={id}>
        {label}
        {optional ? ' (optional)' : ''}
      </label>
      {hint ? (
        <p className="govbb-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      <textarea
        className="govbb-textarea"
        id={id}
        name={id}
        rows={rows}
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
      />
      {error ? (
        <p className="govbb-error-message" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

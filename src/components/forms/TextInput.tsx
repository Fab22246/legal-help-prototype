interface TextInputProps {
  id: string
  label: string
  value?: string
  onChange?: (value: string) => void
  hint?: string
  error?: string
  type?: string
  optional?: boolean
}

export function TextInput({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  type = 'text',
  optional = false,
}: TextInputProps) {
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
      <div className="govbb-input-wrapper">
        <input
          className="govbb-input"
          id={id}
          name={id}
          type={type}
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

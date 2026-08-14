export interface RadioOption {
  value: string
  label: string
  hint?: string
}

interface RadioGroupProps {
  name: string
  legend: string
  options: RadioOption[]
  value?: string
  onChange?: (value: string) => void
  hint?: string
  error?: string
  legendVisuallyHidden?: boolean
}

export function RadioGroup({ name, legend, options, value, onChange, hint, error, legendVisuallyHidden }: RadioGroupProps) {
  const hintId = hint ? `${name}-hint` : undefined
  const errorId = error ? `${name}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="govbb-form-group">
      <fieldset className="govbb-fieldset" aria-describedby={describedBy}>
        <legend className={`govbb-fieldset__legend${legendVisuallyHidden ? ' govbb-visually-hidden' : ''}`}>{legend}</legend>
        {hint ? (
          <p className="govbb-hint" id={hintId}>
            {hint}
          </p>
        ) : null}
        {options.map((option) => {
          const id = `${name}-${option.value}`
          return (
            <div className="govbb-radio-item" key={option.value}>
              <input
                type="radio"
                className="govbb-radio"
                id={id}
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange?.(e.target.value)}
              />
              <label className="govbb-radio-item__label" htmlFor={id}>
                {option.label}
              </label>
              {option.hint ? (
                <span className="govbb-radio-item__hint">{option.hint}</span>
              ) : null}
            </div>
          )
        })}
      </fieldset>
      {error ? (
        <p className="govbb-error-message" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

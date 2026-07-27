export interface CheckboxOption {
  value: string
  label: string
  hint?: string
}

interface CheckboxGroupProps {
  name: string
  legend: string
  options: CheckboxOption[]
  value?: string[]
  onChange?: (value: string[]) => void
  hint?: string
  error?: string
}

export function CheckboxGroup({
  name,
  legend,
  options,
  value = [],
  onChange,
  hint,
  error,
}: CheckboxGroupProps) {
  const hintId = hint ? `${name}-hint` : undefined
  const errorId = error ? `${name}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  function toggle(optionValue: string, checked: boolean) {
    if (!onChange) return
    if (checked) onChange([...value, optionValue])
    else onChange(value.filter((v) => v !== optionValue))
  }

  return (
    <div className="govbb-form-group">
      <fieldset className="govbb-fieldset" aria-describedby={describedBy}>
        <legend className="govbb-fieldset__legend">{legend}</legend>
        {hint ? (
          <p className="govbb-hint" id={hintId}>
            {hint}
          </p>
        ) : null}
        {options.map((option) => {
          const id = `${name}-${option.value}`
          return (
            <div className="govbb-checkbox-item" key={option.value}>
              <input
                type="checkbox"
                className="govbb-checkbox"
                id={id}
                name={name}
                value={option.value}
                checked={value.includes(option.value)}
                onChange={(e) => toggle(option.value, e.target.checked)}
              />
              <label className="govbb-checkbox-item__label" htmlFor={id}>
                {option.label}
              </label>
              {option.hint ? (
                <span className="govbb-checkbox-item__hint">{option.hint}</span>
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

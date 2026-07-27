export interface DateValue {
  day: string
  month: string
  year: string
}

interface DateInputProps {
  legend: string
  namePrefix: string
  value?: DateValue
  onChange?: (value: DateValue) => void
  hint?: string
  error?: string
}

const EMPTY: DateValue = { day: '', month: '', year: '' }

// Accessible day / month / year date input (three labelled fields in a fieldset).
export function DateInput({ legend, namePrefix, value = EMPTY, onChange, hint, error }: DateInputProps) {
  const hintId = hint ? `${namePrefix}-hint` : undefined
  const errorId = error ? `${namePrefix}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  function update(part: keyof DateValue, partValue: string) {
    onChange?.({ ...value, [part]: partValue })
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
        <div className="govbb-date-input">
          <div className="govbb-date-input__part">
            <label className="govbb-label govbb-date-input__label" htmlFor={`${namePrefix}-day`}>
              Day
            </label>
            <div className="govbb-input-wrapper govbb-date-input-wrapper">
              <input
                className="govbb-input govbb-date-input__field"
                id={`${namePrefix}-day`}
                name={`${namePrefix}-day`}
                inputMode="numeric"
                value={value.day}
                onChange={(e) => update('day', e.target.value)}
              />
            </div>
          </div>
          <div className="govbb-date-input__part">
            <label className="govbb-label govbb-date-input__label" htmlFor={`${namePrefix}-month`}>
              Month
            </label>
            <div className="govbb-input-wrapper govbb-date-input-wrapper">
              <input
                className="govbb-input govbb-date-input__field"
                id={`${namePrefix}-month`}
                name={`${namePrefix}-month`}
                inputMode="numeric"
                value={value.month}
                onChange={(e) => update('month', e.target.value)}
              />
            </div>
          </div>
          <div className="govbb-date-input__part">
            <label className="govbb-label govbb-date-input__label" htmlFor={`${namePrefix}-year`}>
              Year
            </label>
            <div className="govbb-input-wrapper govbb-date-input-wrapper govbb-date-input-wrapper--year">
              <input
                className="govbb-input govbb-date-input__field"
                id={`${namePrefix}-year`}
                name={`${namePrefix}-year`}
                inputMode="numeric"
                value={value.year}
                onChange={(e) => update('year', e.target.value)}
              />
            </div>
          </div>
        </div>
      </fieldset>
      {error ? (
        <p className="govbb-error-message" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  )
}

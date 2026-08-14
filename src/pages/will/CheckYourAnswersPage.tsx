import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWillState } from '../../state/will/WillState'
import { useWillGuard } from '../../components/will/useWillGuard'
import { ClearMyAnswersLink } from '../../components/will/WillPage'
import { buildCheckYourAnswers, totalPercentageHundredths } from '../../state/will/checkYourAnswers'
import type { CyaRow } from '../../state/will/checkYourAnswers'
import { willPaths } from '../../state/will/willPaths'

function changeHref(key: string): string {
  return `${willPaths.change}?target=${encodeURIComponent(key)}`
}

export function CheckYourAnswersPage() {
  const active = useWillGuard()
  const { answers, derived, captureDateCreated } = useWillState()
  const navigate = useNavigate()
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  if (!active) return null

  const model = buildCheckYourAnswers(answers, derived)
  const total = totalPercentageHundredths(answers.remainder)
  const blockContinue = derived.route !== 'C' && total !== 10000

  function onChange(row: CyaRow) {
    if (row.changeKey) navigate(changeHref(row.changeKey))
  }

  function onCreate() {
    captureDateCreated()
    const target =
      derived.route === 'A' ? willPaths.resultA : derived.route === 'B' ? willPaths.resultB : willPaths.resultC
    navigate(target)
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Check your answers
        </h1>
        <p className="page__text">{model.intro}</p>
      </div>

      {model.sections.map((section, sectionIndex) => (
        <section className="stack--tight" key={sectionIndex}>
          <h2 className="card-group__title">{section.heading}</h2>
          <ul className="govbb-summary-list">
            {section.rows.map((row, rowIndex) => (
              <li className="govbb-summary-list__row" key={`r${rowIndex}`}>
                <span className="govbb-summary-list__key">{row.label}</span>
                <span className="govbb-summary-list__value">{row.value}</span>
                <span className="govbb-summary-list__actions">
                  {row.changeKey ? (
                    <button type="button" className="govbb-btn--link" onClick={() => onChange(row)}>
                      Change<span className="govbb-visually-hidden"> {row.changeName}</span>
                    </button>
                  ) : null}
                </span>
              </li>
            ))}
            {section.records.map((record, recordIndex) => (
              <li className="govbb-summary-list__row" key={`d${recordIndex}`}>
                <span className="govbb-summary-list__value">
                  {record.rows.map((row, rowIndex) => (
                    <span className="task-item__desc" style={{ display: 'block' }} key={rowIndex}>
                      <strong>{row.label}:</strong> {row.value}
                    </span>
                  ))}
                </span>
                <span className="govbb-summary-list__actions">
                  {record.changeKey ? (
                    <button
                      type="button"
                      className="govbb-btn--link"
                      onClick={() => record.changeKey && navigate(changeHref(record.changeKey))}
                    >
                      Change<span className="govbb-visually-hidden"> {record.changeName}</span>
                    </button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
          {section.heading === 'Remainder of your estate' && model.totalPercentage ? (
            <p className="page__text">
              <strong>Total percentage:</strong> {model.totalPercentage}
            </p>
          ) : null}
        </section>
      ))}

      <div className="govbb-btn-group">
        <button type="button" className="govbb-btn" onClick={onCreate} disabled={blockContinue}>
          {model.finalButtonLabel}
        </button>
      </div>
      <ClearMyAnswersLink />
    </div>
  )
}

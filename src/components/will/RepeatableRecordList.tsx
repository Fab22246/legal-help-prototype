import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { ClearMyAnswersLink } from './WillPage'

export interface RecordItem {
  id: string
  lines: string[]
  changeName: string
  removeName: string
}

interface RepeatableRecordListProps {
  title: string
  intro?: string
  records: RecordItem[]
  onChange: (id: string) => void
  onRemove: (id: string) => void
  onAdd: () => void
  onContinue: () => void
  addLabel: string
  continueLabel?: string
  back?: ReactNode
}

// Reusable list of repeatable records with Add, Change and Remove, using the
// existing summary-list styling.
export function RepeatableRecordList({
  title,
  intro,
  records,
  onChange,
  onRemove,
  onAdd,
  onContinue,
  addLabel,
  continueLabel = 'Continue',
  back,
}: RepeatableRecordListProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div className="page">
      {back}
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          {title}
        </h1>
        {intro ? <p className="page__text">{intro}</p> : null}
      </div>
      <ul className="govbb-summary-list">
        {records.map((record) => (
          <li className="govbb-summary-list__row" key={record.id}>
            <span className="govbb-summary-list__value">
              {record.lines.map((line, index) => (
                <span className="task-item__desc" style={{ display: 'block' }} key={index}>
                  {line}
                </span>
              ))}
              <span style={{ display: 'block' }}>
                <button type="button" className="govbb-btn--link" onClick={() => onChange(record.id)}>
                  Change<span className="govbb-visually-hidden"> {record.changeName}</span>
                </button>{' '}
                <button type="button" className="govbb-btn--link" onClick={() => onRemove(record.id)}>
                  Remove<span className="govbb-visually-hidden"> {record.removeName}</span>
                </button>
              </span>
            </span>
          </li>
        ))}
      </ul>
      <div className="govbb-btn-group">
        <button type="button" className="govbb-btn--secondary" onClick={onAdd}>
          {addLabel}
        </button>
        <button type="button" className="govbb-btn" onClick={onContinue}>
          {continueLabel}
        </button>
      </div>
      <ClearMyAnswersLink />
    </div>
  )
}

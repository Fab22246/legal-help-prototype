import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClearMyAnswersLink } from '../../components/will/WillPage'
import { useWillGuard } from '../../components/will/useWillGuard'
import { useWillState } from '../../state/will/WillState'
import { goTo } from '../../components/will/nav'
import { nextStep } from '../../state/will/journey'
import { computeDerived } from '../../state/will/routeEngine'

interface ContentStepConfig {
  h1: string
  paragraphs: string[]
}

const CONTENT: Record<string, ContentStepConfig> = {
  e1: {
    h1: 'Choose who will carry out your will',
    paragraphs: [
      'An executor is a person who carries out the instructions in your will. They deal with your money and property, pay debts and costs, and give gifts to the people and organisations you name.',
      'You can name more than one executor. An executor can also receive a gift in your will.',
    ],
  },
  r1: {
    h1: 'Decide who receives everything left in your estate',
    paragraphs: [
      'Your executors first pay your debts, costs and the specific gifts in your will.',
      'Everything left is the remainder of your estate. You must decide who receives it.',
    ],
  },
  c1: {
    h1: 'Prepare information for a lawyer',
    paragraphs: [
      'Your answers show that a lawyer needs to advise you before your will is written.',
      'You can continue to organise the information a lawyer will need. This service will create a summary for you to take to a lawyer. It will not create a will.',
    ],
  },
}

export function ContentStepPage({ id }: { id: string }) {
  const active = useWillGuard()
  const { answers, derived, applyAndGet } = useWillState()
  const navigate = useNavigate()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const config = CONTENT[id]

  useEffect(() => {
    headingRef.current?.focus()
  }, [id])

  if (!active || !config) return null

  function onContinue() {
    if (id === 'c1') {
      const next = applyAndGet((draft) => {
        draft.cIntroSeen = true
      })
      goTo(navigate, nextStep(next, computeDerived(next), 'c1'))
      return
    }
    goTo(navigate, nextStep(answers, derived, id))
  }

  return (
    <div className="page">
      <button type="button" className="govbb-back-link" onClick={() => navigate(-1)}>
        <span className="govbb-back-link__icon" aria-hidden="true">
          ←
        </span>{' '}
        Back
      </button>
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          {config.h1}
        </h1>
      </div>
      {config.paragraphs.map((paragraph, index) => (
        <p className="page__text" key={index}>
          {paragraph}
        </p>
      ))}
      <div className="govbb-btn-group">
        <button type="button" className="govbb-btn" onClick={onContinue}>
          Continue
        </button>
      </div>
      <ClearMyAnswersLink />
    </div>
  )
}

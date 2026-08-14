import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClearMyAnswersLink } from '../../components/will/WillPage'
import { useWillGuard } from '../../components/will/useWillGuard'
import { useWillState } from '../../state/will/WillState'
import { stepPath, willPaths } from '../../state/will/willPaths'

export function WillStartPage() {
  const { start } = useWillState()
  const navigate = useNavigate()
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  function begin() {
    start()
    navigate(willPaths.suitabilityIntro)
  }

  return (
    <div className="page">
      <div className="page__header">
        <p className="page__caption">Wills and estates</p>
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Make a will
        </h1>
      </div>
      <p className="page__text">Use this service to answer questions about what you want in your will.</p>
      <p className="page__text">Depending on your answers, you can:</p>
      <ul className="govbb-list govbb-list--bullet">
        <li>create a will to print</li>
        <li>create a will to take to a lawyer for review</li>
        <li>organise information to take to a lawyer</li>
      </ul>
      <p className="page__text">You will need to know:</p>
      <ul className="govbb-list govbb-list--bullet">
        <li>who you want to carry out the instructions in your will</li>
        <li>who you want to receive your money and property</li>
        <li>whether you want to name a guardian for any children under 18</li>
      </ul>
      <p className="page__text">
        Do not use this service if someone is pressuring or forcing you to make decisions about your will.
      </p>

      <h2 className="card-group__title">Your answers</h2>
      <p className="page__text">
        Your answers are not sent or saved. They will be cleared if you refresh or close this page.
      </p>

      <div className="govbb-btn-group">
        <button type="button" className="govbb-btn" onClick={begin}>
          Start now
        </button>
      </div>
    </div>
  )
}

export function SuitabilityIntroPage() {
  const active = useWillGuard()
  const navigate = useNavigate()
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  if (!active) return null

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Check if this service is suitable for you
        </h1>
      </div>
      <p className="page__text">We will ask about your circumstances before asking what you want in your will.</p>
      <p className="page__text">
        Someone can help you read the questions or type your answers, but the decisions must be yours.
      </p>
      <div className="govbb-btn-group">
        <button type="button" className="govbb-btn" onClick={() => navigate(stepPath('s1'))}>
          Continue
        </button>
      </div>
      <ClearMyAnswersLink />
    </div>
  )
}

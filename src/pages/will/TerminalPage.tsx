import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWillState } from '../../state/will/WillState'
import { externalPaths } from '../../state/will/willPaths'

interface TerminalConfig {
  h1: string
  paragraphs: string[]
}

const CONTENT: Record<string, TerminalConfig> = {
  t1: {
    h1: 'You cannot use this service to make a will for someone else',
    paragraphs: [
      'The person making the will must make their own decisions.',
      'You can help someone read the questions or type their answers, but you cannot decide what their will should say.',
    ],
  },
  t3: {
    h1: 'Speak to a lawyer before making a will',
    paragraphs: ['A lawyer can advise you about the decisions involved in making a will and whether you can make one now.'],
  },
  t4: {
    h1: 'You cannot use this service to make a will',
    paragraphs: [
      'This service does not support making a will if you are under 18 and have never been married.',
      'Speak to a lawyer if you need advice about your circumstances.',
    ],
  },
}

// T1, T3 and T4: a lawyer link that clears state, and a Back link that keeps
// the current answer so it can be changed.
function StandardTerminal({ id }: { id: string }) {
  const { clearAll } = useWillState()
  const navigate = useNavigate()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const config = CONTENT[id]

  useEffect(() => {
    headingRef.current?.focus()
  }, [id])

  if (!config) return null

  function toLawyer() {
    clearAll()
    navigate(externalPaths.prepareForLawyer)
  }

  return (
    <div className="page">
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
      <p className="page__text">
        <button type="button" className="govbb-btn--link" onClick={toLawyer}>
          Prepare to speak to a lawyer
        </button>
      </p>
      <p className="page__text">
        <button type="button" className="govbb-btn--link" onClick={() => navigate(-1)}>
          Back
        </button>
      </p>
    </div>
  )
}

// T2 safeguarding exit: both links clear state and replace the history entry.
function SafeguardingTerminal() {
  const { clearAll } = useWillState()
  const navigate = useNavigate()
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  function exitToGov() {
    clearAll()
    window.location.replace(externalPaths.govBarbados)
  }

  function toLawyer() {
    clearAll()
    navigate(externalPaths.prepareForLawyer, { replace: true })
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title" tabIndex={-1} ref={headingRef}>
          Stop using this service
        </h1>
      </div>
      <p className="page__text">Your will must reflect your own decisions.</p>
      <p className="page__text">If it is safe to do so, speak to a lawyer on your own before making a will.</p>
      <p className="page__text">Use the exit link if you need to leave this service quickly. Your answers will be cleared.</p>
      <p className="page__text">
        <button type="button" className="govbb-btn--link" onClick={exitToGov}>
          Exit and clear my answers
        </button>
      </p>
      <p className="page__text">
        <button type="button" className="govbb-btn--link" onClick={toLawyer}>
          Prepare to speak to a lawyer
        </button>
      </p>
    </div>
  )
}

export function TerminalPage({ id }: { id: string }) {
  if (id === 't2') return <SafeguardingTerminal />
  return <StandardTerminal id={id} />
}

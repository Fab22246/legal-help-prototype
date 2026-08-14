import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { radioSteps } from '../../state/will/radioSteps'
import { willPaths } from '../../state/will/willPaths'
import { RadioStepPage } from './RadioStepPage'
import { TerminalPage } from './TerminalPage'
import { ContentStepPage } from './ContentStepPage'
import { A1Page, A2Page, A4Page, A8Page, A12Page } from './aboutPages'
import { F2Page, F4Page, F6Page } from './familyPages'
import { E2Page, E4Page, G2Page, G4Page } from './personRolePages'
import { P2Page } from './P2Page'
import { GiftPage } from './GiftPage'
import { RemainderPage } from './RemainderPage'
import { C2Page, C3Page, C4Page, C5Page } from './routeCPages'

const TERMINALS = new Set(['t1', 't2', 't3', 't4'])
const CONTENT = new Set(['e1', 'r1', 'c1'])

// Maps a journey step id to its page component. Every id produced by the
// journey engine resolves to a component here.
export function WillStepPage() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const mode = params.get('mode') === 'change' ? 'change' : 'forward'
  const recordId = params.get('record') ?? undefined

  if (radioSteps[id]) return <RadioStepPage id={id} mode={mode} />
  if (TERMINALS.has(id)) return <TerminalPage id={id} />
  if (CONTENT.has(id)) return <ContentStepPage id={id} />

  switch (id) {
    case 'a1':
      return <A1Page mode={mode} />
    case 'a2':
      return <A2Page mode={mode} />
    case 'a4':
      return <A4Page mode={mode} />
    case 'a8':
      return <A8Page mode={mode} />
    case 'a12':
      return <A12Page mode={mode} />
    case 'f2':
      return <F2Page mode={mode} recordId={recordId} />
    case 'f4':
      return <F4Page mode={mode} recordId={recordId} />
    case 'f6':
      return <F6Page mode={mode} recordId={recordId} />
    case 'e2':
      return <E2Page mode={mode} recordId={recordId} />
    case 'e4':
      return <E4Page mode={mode} recordId={recordId} />
    case 'g2':
      return <G2Page mode={mode} recordId={recordId} />
    case 'g4':
      return <G4Page mode={mode} recordId={recordId} />
    case 'p2':
      return <P2Page mode={mode} recordId={recordId} />
    case 'sg2':
      return <GiftPage mode={mode} recordId={recordId} />
    case 'r2':
      return <RemainderPage mode={mode} recordId={recordId} />
    case 'c2':
      return <C2Page mode={mode} />
    case 'c3':
      return <C3Page mode={mode} recordId={recordId} />
    case 'c4':
      return <C4Page mode={mode} recordId={recordId} />
    case 'c5':
      return <C5Page mode={mode} />
    default:
      return <Navigate to={willPaths.start} replace />
  }
}

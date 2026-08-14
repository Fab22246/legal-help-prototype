import type { WillAnswers, YesNo, YesNoNotSure } from './types'

export interface RadioStepDef {
  id: string
  h1: string
  hint?: (answers: WillAnswers) => string | undefined
  options: { value: string; label: string }[]
  get?: (answers: WillAnswers) => string | undefined
  set?: (draft: WillAnswers, value: string) => void
  // S2 is a safeguarding gate: its answer is not stored.
  safeguarding?: boolean
}

const YN = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]
const YNN = [...YN, { value: 'not-sure', label: 'Not sure' }]

function yn(id: string, h1: string, key: keyof WillAnswers, hint?: (a: WillAnswers) => string | undefined): RadioStepDef {
  return {
    id,
    h1,
    hint,
    options: YN,
    get: (a) => a[key] as string | undefined,
    set: (d, v) => {
      ;(d[key] as YesNo | undefined) = v as YesNo
    },
  }
}

function ynn(id: string, h1: string, key: keyof WillAnswers, hint?: (a: WillAnswers) => string | undefined): RadioStepDef {
  return {
    id,
    h1,
    hint,
    options: YNN,
    get: (a) => a[key] as string | undefined,
    set: (d, v) => {
      ;(d[key] as YesNoNotSure | undefined) = v as YesNoNotSure
    },
  }
}

export const radioSteps: Record<string, RadioStepDef> = {
  s1: yn('s1', 'Are you making your own will?', 's1'),
  s2: { id: 's2', h1: 'Is anyone pressuring or forcing you to make decisions about this will?', options: YN, safeguarding: true },
  s3: ynn('s3', 'Can you understand the decisions involved in making your will and make those decisions yourself?', 's3'),
  s4: yn('s4', 'Are you 18 or older?', 's4'),
  s5: yn('s5', 'Have you ever been married?', 's5'),
  s6: ynn('s6', 'Do you own money or property outside Barbados?', 's6', () => 'For example, land, a home, a bank account or investments.'),
  s7: yn('s7', 'Do you want to make one will together with another person?', 's7', () => 'For example, one will for you and your spouse or partner.'),

  a3: ynn('a3', 'Is Barbados your main home?', 'a3', () => 'Your main home is the country where you usually live.'),
  a5: ynn('a5', 'Do you already have a will?', 'a5'),
  a6: ynn('a6', 'Do you want this will to replace all wills you made before it?', 'a6'),
  a7: yn('a7', 'Are you currently married?', 'a7'),
  a9: yn('a9', 'Are you separated from the person you are married to?', 'a9'),
  a10: ynn('a10', 'Have you lived apart continuously for 5 years or more?', 'a10'),
  a11: yn('a11', 'Do you live with a partner as a couple?', 'a11', (a) =>
    a.a7 === 'yes' ? 'Do not include the person you are married to.' : undefined,
  ),
  a13: ynn('a13', 'Are you planning to get married?', 'a13'),

  f1: yn('f1', 'Do you have any children under 18?', 'f1'),
  f3: yn('f3', 'Do you have a child aged 18 or older who depends on you because of a disability?', 'f3', () =>
    'For example, they rely on you for housing, food, medicine or daily care.',
  ),
  f5: yn('f5', 'Does anyone else depend on you for money or care?', 'f5', () =>
    'Do not include children you have already told us about.',
  ),

  e3: yn('e3', 'Do you want to name someone to act if none of your executors can act?', 'e3'),

  g1: yn('g1', 'Do you want to name a guardian for your children?', 'g1', () =>
    'A guardian is someone you want to care for your children if no parent can care for them.',
  ),
  g3: yn('g3', 'Do you want to name someone to act if none of your guardians can act?', 'g3'),

  p1: ynn('p1', 'Do you own money or property with someone else?', 'p1', () => 'For example, a joint bank account, land or a home.'),
  p3: yn('p3', 'Do you own a business or part of a business?', 'p3'),
  p4: ynn('p4', 'Do you want your will to decide who will own or run the business after you die?', 'p4'),
  p5: yn('p5', 'Is there a disagreement about any money or property you own?', 'p5'),
  p6: ynn('p6', 'Do you want someone to use money or property during their lifetime and then have it pass to someone else?', 'p6'),
  p7: ynn('p7', 'Do you want to set a condition, other than age, before someone receives a gift?', 'p7', () =>
    'This means the person only receives the gift if something else happens first.',
  ),
  p8: ynn('p8', 'Do you think you may owe more money than everything you own is worth?', 'p8'),

  sg1: yn('sg1', 'Do you want to leave a particular item, amount of money or property to a person or organisation?', 'sg1'),
}

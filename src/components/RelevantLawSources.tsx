import { DetailsAccordion } from './DetailsAccordion'

export interface LawSource {
  label: string
  href: string
}

interface RelevantLawSourcesProps {
  /** Short plain-language explanation of the relevant law. */
  explanation?: string
  /** Official source links. */
  sources?: LawSource[]
}

// Reusable "relevant law and official sources" pattern. No real legal sources
// are added yet — this only provides the structure for later population, always
// with the note that the prototype does not decide how the law applies.
export function RelevantLawSources({ explanation, sources = [] }: RelevantLawSourcesProps) {
  return (
    <section className="stack--tight" aria-label="Relevant law and official sources">
      <h2 className="card-group__title">Relevant law and official sources</h2>
      <DetailsAccordion title="Law that may be relevant">
        {explanation ? <p className="page__text">{explanation}</p> : null}
        {sources.length === 1 ? (
          <p className="page__text">
            <a className="govbb-link-default" href={sources[0].href}>
              {sources[0].label}
            </a>
          </p>
        ) : sources.length >= 2 ? (
          <ul className="govbb-list govbb-list--bullet">
            {sources.map((s) => (
              <li key={s.href}>
                <a className="govbb-link-default" href={s.href}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="page__text">
          This prototype does not explain every rule or decide how the law applies to you.
        </p>
      </DetailsAccordion>
    </section>
  )
}

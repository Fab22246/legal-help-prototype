import '../../styles/willPrint.css'
import type { WillDocument } from '../../state/will/generateWill'
import type { ReviewSummaryDocument } from '../../state/will/generateReviewSummary'
import type { InfoSummaryDocument } from '../../state/will/generateInfoSummary'

const WITNESS_FIELDS = ['Signature', 'Full name', 'Address', 'Occupation', 'Date']

function SignatureBlock({ heading, fields }: { heading: string; fields: string[] }) {
  return (
    <div className="will-doc__signature-block">
      <p className="will-doc__row-label">{heading}</p>
      {fields.map((field) => (
        <div key={field}>
          <p className="will-doc__row">{field}</p>
          <div className="will-doc__signature-field" aria-hidden="true" />
        </div>
      ))}
    </div>
  )
}

export function WillDocumentView({
  id,
  document,
  offscreen = false,
}: {
  id: string
  document: WillDocument
  offscreen?: boolean
}) {
  return (
    <div id={id} className={offscreen ? 'will-doc will-offscreen' : 'will-doc'}>
      {document.reviewNotice ? (
        <>
          <p className="will-doc__notice">{document.reviewNotice}</p>
          <p className="will-doc__running-notice" aria-hidden="true">
            {document.reviewNotice}
          </p>
        </>
      ) : null}
      <h2 className="will-doc__title">{document.title}</h2>
      {document.clauses.map((clause) => (
        <section className="will-doc__clause" key={clause.number}>
          <h3 className="will-doc__clause-heading">{clause.heading}</h3>
          {clause.lines.map((line, index) => (
            <p className="will-doc__line" key={index}>
              {line}
            </p>
          ))}
        </section>
      ))}
      {document.showSignatures ? (
        <section className="will-doc__clause">
          <h3 className="will-doc__clause-heading">9. Signature and witnesses</h3>
          {document.signatureStatement ? <p className="will-doc__line">{document.signatureStatement}</p> : null}
          <SignatureBlock heading="Person making the will" fields={['Signature', 'Date']} />
          <SignatureBlock heading="Witness 1" fields={WITNESS_FIELDS} />
          <SignatureBlock heading="Witness 2" fields={WITNESS_FIELDS} />
        </section>
      ) : null}
    </div>
  )
}

export function ReviewSummaryView({
  id,
  document,
  offscreen = false,
}: {
  id: string
  document: ReviewSummaryDocument
  offscreen?: boolean
}) {
  return (
    <div id={id} className={offscreen ? 'will-doc will-offscreen' : 'will-doc'}>
      <h2 className="will-doc__title">{document.title}</h2>
      <div className="will-doc__meta">
        <p className="will-doc__row">
          <span className="will-doc__row-label">Full legal name: </span>
          {document.name}
        </p>
        <p className="will-doc__row">
          <span className="will-doc__row-label">Date created: </span>
          {document.dateCreated}
        </p>
      </div>
      <p className="will-doc__line">{document.opening}</p>
      {document.sections.map((section, index) => (
        <section className="will-doc__clause" key={index}>
          <h3 className="will-doc__clause-heading">{section.heading}</h3>
          <p className="will-doc__line">{section.text}</p>
          {section.details.map((detail, detailIndex) => (
            <p className="will-doc__row" key={detailIndex}>
              <span className="will-doc__row-label">{detail.label}: </span>
              {detail.value}
            </p>
          ))}
        </section>
      ))}
      <p className="will-doc__line">{document.closing}</p>
    </div>
  )
}

export function InfoSummaryView({
  id,
  document,
  offscreen = false,
}: {
  id: string
  document: InfoSummaryDocument
  offscreen?: boolean
}) {
  return (
    <div id={id} className={offscreen ? 'will-doc will-offscreen' : 'will-doc'}>
      <h2 className="will-doc__title">{document.title}</h2>
      <div className="will-doc__meta">
        <p className="will-doc__row">
          <span className="will-doc__row-label">Full legal name: </span>
          {document.name}
        </p>
        {document.homeAddress.map((detail, index) => (
          <p className="will-doc__row" key={index}>
            <span className="will-doc__row-label">{detail.label}: </span>
            {detail.value}
          </p>
        ))}
        <p className="will-doc__row">
          <span className="will-doc__row-label">Date created: </span>
          {document.dateCreated}
        </p>
      </div>
      <p className="will-doc__line">{document.opening}</p>
      {document.sections.map((section, index) => (
        <section className="will-doc__clause" key={index}>
          <h3 className="will-doc__clause-heading">{section.heading}</h3>
          {section.rows.map((detail, rowIndex) => (
            <p className="will-doc__row" key={rowIndex}>
              <span className="will-doc__row-label">{detail.label}: </span>
              {detail.value}
            </p>
          ))}
          {section.records.map((record, recordIndex) => (
            <div className="will-doc__record" key={recordIndex}>
              {record.rows.map((detail, rowIndex) => (
                <p className="will-doc__row" key={rowIndex}>
                  <span className="will-doc__row-label">{detail.label}: </span>
                  {detail.value}
                </p>
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}

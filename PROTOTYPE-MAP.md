# Legal help for common life events — Prototype map

_Updated after the simplification pass. 33 screens._

## 1. Architecture
- **Two parallel outputs from one set of sources:**
  - **Multi-file site** — one real `.html` page per screen (realistic URLs). View via the local server: http://localhost:4173/index.html
  - **Single-file prototype** — `prototype.html`: every page combined into one self-contained file where each page is a "screen" shown/hidden by JavaScript. Works in the in-app preview pane and by double-clicking. View: http://localhost:4173/prototype.html
- **Source files:** each page is authored as `<name>.relative.html` (readable, uses normal `dist/…` references).
- **Build:** `build_standalone.py` inlines CSS, fonts, logo and crest into self-contained `<name>.html`. `gen_prototype.py` stitches all pages into `prototype.html`.
- **Generators** (produce the `.relative.html` sources):
  - `gen_placeholders.py` — placeholder page(s) (currently just signing-witnessing)
  - `gen_route.py` — single-choice radio question pages with value-based routing (help-me-choose + the death questions)
  - `gen_lawyer.py` — the linear lawyer-prep form pages (radio/textarea/checkbox)
  - `gen_death_outcomes.py` — "after someone dies" outcome pages (+ official links)
  - `gen_will_outcomes.py` — the three "simple will" outcome pages
  - Hand-written pages: index, choose-help, prepare-simple-will, will-check, the lawyer/will/death intros, plan-money-property
- **Design system:** GovBB (alpha.gov.bb) — official banner, yellow header, Alpha status banner, footer, Figtree font, `govbb-` classes only.
- **Navigation in the prototype:** all link clicks are handled in-document. Internal links switch screens; the header logo returns to the start; `#` placeholder links are inert; external `https://` government links open in a new browser tab.
- **Outcome content order (all routes):** plain-language explanation -> what it may mean / what you may need -> official forms and links -> prototype note (only where it explains a real limitation).

## 2. Entry and hub
- **index.html — "Legal help for common life events"** (start page)
  - "Start now" -> choose-help.html
- **choose-help.html — "What do you need help with?"** (main hub; radio + Continue; Back -> index)
  - Plan what happens to my money and property -> plan-money-property.html
  - Prepare a simple will -> prepare-simple-will.html
  - Find out what to do after someone dies -> after-someone-dies.html
  - Understand signing, witnessing or certified copies -> signing-witnessing.html
  - Prepare information before speaking to a lawyer -> prepare-for-lawyer.html
  - I am not sure -> help-me-choose.html
- **signing-witnessing.html** — placeholder (title, short text, Back -> choose-help). Content not built out yet.

## 3. "Help me choose" (single-page triage)
Shown when the user selects "I am not sure".
- **help-me-choose.html — "Help me choose"** (radio + Continue; Back -> choose-help)
  - I want to plan ahead -> plan-money-property.html
  - Someone has died -> after-someone-dies.html
  - I need to sign, witness or certify a document -> signing-witnessing.html
  - I need to prepare before speaking to a lawyer -> prepare-for-lawyer.html
  - I am still not sure -> prepare-for-lawyer.html

## 4. Route: "Prepare a simple will" (suitability check only — no will builder)
Entry: prepare-simple-will.html (from choose-help, or help-me-choose)
- **prepare-simple-will.html** — intro + Start (Back -> choose-help) -> will-check.html
- **will-check.html — "Check if a simple will may be right for you"** (one page, grouped questions; Back -> prepare-simple-will)
  - Safety check (checkboxes; "None of these" exclusive)
  - Age (radio: 18+ or been married?)
  - What you own (checkboxes; "I am not sure" exclusive)
  - Dependants (radio: Yes / No / I am not sure)
  - What you want to do (radio)
  - **Continue routing:**
    - -> speak-to-a-lawyer.html if any safety flag, OR not 18/married, OR owns shared land / business / overseas property / "not sure what I own", OR "not sure" about dependants, OR wants to leave to a child under 18, OR "not sure" what they want
    - -> will-needs-detail.html if otherwise safe AND wants to leave specific items or amounts
    - -> will-may-be-suitable.html otherwise (leave to one person, or share equally)
- **will-may-be-suitable.html — "This simple will route may be suitable"** (outcome)
  - Sections: what the full version will ask; signing & witnesses; official links; prototype note
  - Official links (new tab): Succession Act (PDF), Safekeeping of wills
  - Button -> choose-help.html
- **will-needs-detail.html — "This route may be suitable, but needs more detail"** (outcome)
  - Explains more questions are needed; when to speak to a lawyer; prototype note
  - Button -> choose-help.html
- **speak-to-a-lawyer.html — "You should speak to a lawyer"** (outcome; short)
  - Plain-language explanation; primary -> prepare-for-lawyer.html; link -> choose-help.html

## 5. Route: "Prepare information before speaking to a lawyer" (linear — Continue always advances)
Entry: prepare-for-lawyer.html (from choose-help, help-me-choose, both will outcomes, and the plan page)
- **prepare-for-lawyer.html** — intro + Start (Back -> choose-help) -> lawyer-issue.html
- **lawyer-issue.html — "What do you need help with?"** (6 radios) -> lawyer-what-happened.html (Back -> prepare-for-lawyer)
- **lawyer-what-happened.html — "What has happened?"** (textarea) -> lawyer-who.html (Back -> lawyer-issue)
- **lawyer-who.html — "Who is involved?"** (8 checkboxes) -> lawyer-documents.html (Back -> lawyer-what-happened)
- **lawyer-documents.html — "What documents do you have?"** (11 checkboxes; "None of these" exclusive) -> lawyer-questions.html (Back -> lawyer-who)
- **lawyer-questions.html — "What do you want to ask the lawyer?"** (textarea) -> lawyer-ready.html (Back -> lawyer-documents)
- **lawyer-ready.html — "Your information is ready to review"** (outcome) -> Button -> choose-help.html

## 6. Route: "Find out what to do after someone dies" (branching triage)
Entry: after-someone-dies.html (from choose-help, or help-me-choose)
- **after-someone-dies.html** — intro + bullet list + Start (Back -> choose-help) -> death-disagreement.html
- **death-disagreement.html — "Is there a disagreement?"** (Back -> after-someone-dies)
  - Yes / I am not sure -> death-speak-to-lawyer.html
  - No -> death-help.html
- **death-help.html — "What do you need help with?"** (Back -> death-disagreement)
  - Deal with money or property -> death-will.html
  - Apply to be repaid for funeral expenses -> death-funeral.html
  - Find out if the Public Trustee can help -> death-estate-value.html
  - Get estate clearance -> death-estate-clearance.html
  - I am not sure -> death-will.html
- **death-will.html — "Did the person leave a will?"** (Back -> death-help)
  - Yes -> death-executor.html
  - No -> death-estate-value.html
  - I do not know -> death-check-for-will.html
- **death-estate-value.html — "Is the estate worth BDS $15,000 or less?"** (+ hint; Back -> death-help)
  - Yes -> death-public-trustee.html
  - No -> death-letters.html
  - I do not know -> death-more-info.html
- **death-executor.html — "Are you named as executor?"** (+ hint; Back -> death-will)
  - Yes -> death-probate.html
  - No -> death-speak-to-executor.html
  - I do not know -> death-check-will.html
- **Outcome pages** (each: Button -> choose-help.html; official gov links open in a new tab):
  - death-probate.html — "You may need probate" — Probate Unit guidance
  - death-letters.html — "You may need letters of administration" — Probate Unit guidance
  - death-public-trustee.html — "The Public Trustee may be able to help" — Public Trustee guidance (direct PDF form intentionally not linked yet)
  - death-funeral.html — "You may be able to apply for funeral expenses" — Public Trustee guidance
  - death-estate-clearance.html — "You may need estate clearance" — Estate clearance guidance + Apply for an Estate Clearance Certificate
  - death-check-for-will.html — "You may need to check for a will" — Probate Unit guidance
  - death-check-will.html — "Check the will" — Probate Unit guidance
  - death-speak-to-executor.html — "You may need to speak to the executor" — Probate Unit guidance
  - death-more-info.html — "You may need more information" — (no official links; short)
  - death-speak-to-lawyer.html — "You should speak to a lawyer" — (no official links; short)

## 7. Route: "Plan what happens to my money and property" (one page)
Entry: plan-money-property.html (from choose-help, or help-me-choose)
- **plan-money-property.html** — a single planning page (Back -> choose-help)
  - Intro + "You can" list
  - Section: Make a list of what you own (bullet list)
  - Section: Choose who should manage your estate
  - Section: Store important information safely (bullet list)
  - Actions: Prepare a simple will -> prepare-simple-will.html; Prepare information before speaking to a lawyer -> prepare-for-lawyer.html; Back to what you need help with -> choose-help.html

## 8. Shared conventions
- Every page after a start/intro has a Back link to the previous step.
- Outcome pages return to choose-help.html ("Back to what you need help with").
- Cross-route reuse: the will route and plan route feed into the lawyer route; help-me-choose feeds into the plan, after-death, signing and lawyer routes.
- Official links are official government domains only (barbadoslawcourts.gov.bb, oag.gov.bb, bra.gov.bb, portal.bra.gov.bb), shown as link text, opening in a new tab.
- Prototype notes are used only where they explain a real limitation; the standard limitation line is: "This is a prototype. It does not create documents, file applications, take payments, book appointments or save your information yet."

## 9. Not built yet (intentionally)
- Full will builder, beneficiary/executor/witness detail fields
- Document generation, worksheets, PDFs, document upload
- Live filing/submission, payment, appointments, saved accounts
- The signing-witnessing route content (still a placeholder)
- Direct Public Trustee application-form PDF link (awaiting confirmation)

## 10. Page inventory (33 screens)
index, choose-help, signing-witnessing, help-me-choose,
prepare-simple-will, will-check, will-may-be-suitable, will-needs-detail, speak-to-a-lawyer,
prepare-for-lawyer, lawyer-issue, lawyer-what-happened, lawyer-who, lawyer-documents, lawyer-questions, lawyer-ready,
after-someone-dies, death-disagreement, death-help, death-will, death-estate-value, death-executor,
death-probate, death-letters, death-public-trustee, death-funeral, death-estate-clearance,
death-check-for-will, death-check-will, death-speak-to-executor, death-more-info, death-speak-to-lawyer,
plan-money-property

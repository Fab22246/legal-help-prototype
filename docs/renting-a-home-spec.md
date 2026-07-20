# Add route: "Renting a home"

A single guidance / signpost page — **not** a tenancy-agreement generator.

Do not add: documents, PDFs, uploads, payments, appointments, saved accounts,
filing, or legal advice. Use plain language. Do not say a tenancy agreement is
"valid" or that the user "does not need a lawyer".

## New page: `renting-a-home.relative.html`

Route label: **Renting a home**. Back link goes to `choose-help.html`.

Sections and copy, in order:

### Title
Renting a home

### Intro
- Use this page if you are renting, or thinking about renting, a house, apartment or room.
- It explains what a tenancy agreement usually covers and what to check before you sign.
- This service gives general information. It does not give legal advice.

### What a tenancy agreement usually covers
Lead-in: "A tenancy agreement is between you, the tenant, and the person who owns or manages the property, the landlord." then "An agreement usually sets out:"
- the names of the landlord and tenant
- the address of the property
- how much the rent is and when it is paid
- how long the tenancy lasts
- the deposit and when it may be returned
- who pays for utilities such as electricity, water and internet
- who is responsible for repairs
- how much notice each side must give to end the tenancy
- any rules about the property, such as pets or subletting

Then: "Ask for a written agreement and keep a copy."

### Before you sign
Lead-in: "Before you sign a tenancy agreement:"
- read the whole agreement and make sure you understand it
- check the rent, the deposit and what the deposit covers
- check who pays for utilities and repairs
- check how much notice you must give to leave
- check the condition of the property and note any existing damage
- ask for anything you were promised to be put in writing

Then: "Do not sign an agreement you do not understand. You should get advice if you are not sure."

### Deposits
- A landlord may ask for a deposit before you move in.
- The agreement should say how much the deposit is, what it can be used for, and when it should be returned.
- Keep proof of any money you pay.
- It can help to take photos of the property when you move in and when you leave.

### Rent
- The agreement should say how much the rent is, when it is due, and how to pay it.
- Keep receipts or records of the rent you pay.

### Repairs and the condition of the property
- The agreement should say who is responsible for repairs.
- Tell the landlord in writing if something needs to be repaired, and keep a copy.

### Ending a tenancy
- The agreement and the law set out how much notice you or the landlord must give to end a tenancy.
- Check your agreement for the notice period.
- Get advice if you are asked to leave and you are not sure of your rights.

### If there is a problem
- Problems can include repairs not being done, a deposit not being returned, a rent increase you disagree with, or being asked to leave.
- Try to sort it out with the landlord first, in writing, and keep a copy.
- If you cannot agree, you may be able to get help from a government office or the courts.
- You should speak to a lawyer if the problem is serious or you are not sure what to do.

### When to speak to a lawyer
Lead-in: "You should speak to a lawyer if:"
- you do not understand the agreement
- you are being asked to leave and you do not think it is fair
- your deposit has not been returned
- the property is not safe, or repairs are not being done
- you think you are being treated unfairly
- there is already a court matter

### Official links (open in a new tab)
- Landlord and Tenant Act, Cap. 230 — https://www.barbadoslawcourts.gov.bb/assets/content/pdfs/statutes/LandlordandTenantCAP230.pdf
- Landlord and Tenant (Registration of Tenancies) Act, Cap. 230A — https://www.barbadoslawcourts.gov.bb/assets/content/pdfs/statutes/LandlordandTenant(RegistrationofTenancies)CAP230A.pdf
- Statutes of Barbados — https://www.barbadoslawcourts.gov.bb/laws/consolidated-laws/statutes-of-barbados

### Prototype note (general)
- This prototype gives general information.
- It does not create legal documents, file applications, take payments, book appointments or save your information yet.

### Buttons and links
- Primary button: **Prepare information before speaking to a lawyer** -> `prepare-for-lawyer.html`
- Secondary link: **Back to what you need help with** -> `choose-help.html`

## Wiring

- **Main hub** (`choose-help.relative.html`): add a card after the "Give property while I am alive" card:
  - Heading: **Renting a home**
  - Description: "Understand what a tenancy agreement covers and what to check before you rent a house, apartment or room."
  - Links to `renting-a-home.html`
- **Help me choose** (`help-me-choose.relative.html`): add a card after the give-property card:
  - Heading: **I am renting or thinking about renting**
  - Description: "Use this if you are renting a house, apartment or room, or about to sign a tenancy agreement."
  - Links to `renting-a-home.html`
- Add `renting-a-home` to the `PAGES` list in **both** `build_standalone.py` and `gen_prototype.py`, then run both build scripts.

## Legal basis and caveats

Governing law is the **Landlord and Tenant Act, Cap. 230** (official title, from
barbadoslawcourts.gov.bb). Some websites wrongly call it the "Rent Control Act" —
use the official name.

The page deliberately does **not** state:
- specific notice periods
- deposit amounts or return timeframes
- which body handles disputes (Fair Trading Commission vs a Rent Control Department)

These are unverified and sources conflict. There is also a 2026 housing bill in
the news (tenants to homeowners) that could change things.

All legal specifics need confirmation with the relevant MDA (e.g. Ministry of
Housing, Lands and Maintenance) and a legal adviser before publishing.

**Status:** Ready for content review; legal specifics need factual confirmation.
Not for publishing.

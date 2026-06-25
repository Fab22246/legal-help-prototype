# WIP: Legal help for common life events prototype

This work builds a prototype for a public legal information service.

The service helps users understand common legal steps, prepare information before acting, and know when they may need legal help.

Current focus: **Prepare a simple will** branch.

## What this includes

* Start page for the legal help service
* Main route selection page
* Simple will suitability check
* Simple will information capture
* Executor details
* People receiving things in the will
* Land or house details where the user owns the property by themselves
* Specific gifts logic
* Review before continuing page
* Simple will next steps page
* Signing, witnessing and safekeeping guidance
* Signpost branch for giving property while alive

## Current content approach

The prototype uses plain language and avoids legal advice.

It should not say:

* a will is valid
* the service creates a legal will
* the user does not need a lawyer
* property will legally pass
* documents are filed or submitted

The prototype should say:

* it helps users prepare information
* it gives general information
* users may need legal help in some situations
* signing and witnessing rules still apply
* the Records Branch safekeeping service is for storing an original signed will, not making the will valid

## Still being checked

* Routing for the simple will happy path
* Conditional warnings and stop points
* Hint text across the will branch
* Repeatable fields for multiple beneficiaries, gifts and properties
* Review and next-step summaries
* Barbados-specific legal wording against official sources
* Whether the deed of gift signpost should become a fuller route later

## Not in scope for this prototype

* Generating a final will
* Legal will clauses
* PDFs or downloads
* Document upload
* Payments
* Appointments
* Saved accounts
* Filing or submitting legal documents
* Legal advice

---

## How the files are organised

* **`*.relative.html`** — the editable **source** pages (relative asset paths).
* **`*.html`** — generated **self-contained** pages (CSS, fonts and images inlined). Do not edit by hand.
* **`prototype.html`** — a single self-contained file with every screen in one document.
* **`dist/`** — the GovBB design-system stylesheet, fonts and images.
* **`*.py`** — build scripts.
* **`PROTOTYPE-MAP.md`** — a map of the screens and routes.

## Building

Requires Python 3 (no extra packages). Run both after editing any `*.relative.html` source:

```bash
python build_standalone.py   # rebuild the self-contained per-page *.html files
python gen_prototype.py      # rebuild the single-file prototype.html
```

## Viewing

* **Single file:** open `prototype.html` in a browser.
* **Multi-page site:** open `index.html`, or serve the folder (`python -m http.server`).
* **Live (GitHub Pages):** the published site link is shown in the repository's About panel.

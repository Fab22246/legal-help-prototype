# Legal help for common life events — prototype

A clickable HTML prototype for a Government of Barbados public legal-information
service, built with the **GovBB design system**. It is in **alpha** and is for
research and team feedback only.

> This is a prototype. It does **not** give legal advice, create wills or other
> legal documents, transfer property, file anything with a court, or confirm that
> a will or document is valid.

## What it covers

From the main page, "What do you need help with?", users can:

- **Plan ahead** — organise money, property and belongings
- **Give property while I am alive** — understand giving vs. leaving in a will
- **Prepare a simple will** — a suitability check, then guided information capture
- **Someone has died** — find out what may be needed after a death
- **Sign, witness or certify a document** — plain-language guidance
- **Change a name or update a record**
- **Prepare before speaking to a lawyer**
- **I am not sure** — a short "help me choose" page

The "Prepare a simple will" route is the most developed: a safety/suitability
check that routes complex situations to "You may need legal help before making a
will", then pages to capture details about the person, executor, how they want
to leave things, beneficiaries, specific gifts, and any land or house — finishing
with a review and a next-steps summary.

## How the files are organised

- **`*.relative.html`** — the editable **source** pages (use relative asset
  paths, e.g. `dist/styles.css`).
- **`*.html`** — generated **self-contained** pages: CSS, fonts and images are
  inlined so each page opens correctly on its own. **Do not edit these by hand.**
- **`prototype.html`** — a single self-contained file that stitches every page
  into one document and switches between them with JavaScript. This is the
  easiest file to share or host.
- **`dist/`** — the GovBB design-system stylesheet, fonts and images.
- **`*.py`** — build scripts (see below).
- **`PROTOTYPE-MAP.md`** — a map of the screens and routes.

## Building

The build scripts require **Python 3** (no extra packages).

```bash
# 1. Rebuild the self-contained per-page files (*.html) from the *.relative.html sources
python build_standalone.py

# 2. Rebuild the single-file prototype.html (all screens in one document)
python gen_prototype.py
```

Run both after editing any `*.relative.html` source.

## Viewing the prototype

- **Single file:** open `prototype.html` in a web browser.
- **Multi-page site:** open `index.html`, or serve the folder
  (`python -m http.server`) and visit `http://localhost:8000/`.

## Status

Alpha prototype for internal review. Content and routing are still changing.

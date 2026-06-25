#!/usr/bin/env python3
"""Generate the short placeholder pages reached from the
"What do you need help with?" question page.

Writes one "<stem>.relative.html" per placeholder. Run build_standalone.py
afterwards to produce the self-contained "<stem>.html" files.
Each page is intentionally minimal: title, short text, and a back link.
"""
import html
import pathlib

root = pathlib.Path(__file__).parent

# (stem, title, [body paragraphs], back_href) — the "not built yet" line is
# added last. back_href is where the page's Back link points.
# No generated placeholder pages remain — signing-witnessing is now a
# hand-written content page. Kept for any future simple placeholders.
PLACEHOLDERS = []

NOT_BUILT = "This part is not built yet."

PAGE = """<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title} — The Government of Barbados</title>
    <link rel="icon" href="dist/assets/images/favicon.ico" />
    <link rel="stylesheet" href="dist/styles.css" />
    <style>
      /* Page-specific layout only — built from design-system tokens, no new colours */
      .skip-link {{
        position: absolute;
        left: -9999px;
        top: auto;
        width: 1px;
        height: 1px;
        overflow: hidden;
        z-index: 999;
      }}
      .skip-link:focus {{
        position: static;
        width: auto;
        height: auto;
        overflow: visible;
        padding: var(--spacing-xs) var(--spacing-s);
        background: var(--color-yellow-100);
        color: var(--color-black-00);
        font-weight: var(--font-weight-bold);
        text-decoration: none;
      }}
      .placeholder {{
        padding-block: var(--spacing-l);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-m);
        max-width: 44rem;
      }}
      .back-link {{
        display: inline-block;
        margin-bottom: var(--spacing-s);
      }}
      .back-link::before {{
        content: "\\2039";
        margin-right: var(--spacing-xxs);
      }}
      .placeholder__text {{
        display: flex;
        flex-direction: column;
        gap: var(--spacing-s);
      }}
    </style>
  </head>
  <body class="govbb-page">
    <a class="skip-link" href="#main-content">Skip to main content</a>

    <div>
      <div class="govbb-official-banner">
        <div class="govbb-container govbb-official-banner__inner">
          <div class="govbb-official-banner__crest">
            <img
              class="govbb-official-banner__icon"
              src="dist/assets/images/govbb-creast.svg"
              alt=""
            />
          </div>
          <div class="govbb-official-banner__text">
            <span>Official government website</span>
          </div>
        </div>
      </div>

      <header class="govbb-header">
        <div class="govbb-container govbb-header__inner">
          <a href="/" aria-label="Go to the alpha.gov.bb homepage">
            <img class="govbb-header__logo" src="dist/assets/images/govbb-logo.svg" alt="GOVBB" />
          </a>
        </div>
      </header>
    </div>

    <main class="govbb-page__main" id="main-content">
      <div
        class="govbb-status-banner govbb-status-banner--alpha"
        role="status"
        aria-label="alpha status banner"
        aria-live="polite"
      >
        <div class="govbb-container">
          <p>
            This page is in
            <a class="govbb-link govbb-link--secondary" href="#">Alpha</a>.
          </p>
        </div>
      </div>

      <div class="govbb-container">
        <a class="govbb-link back-link" href="{back}">Back</a>

        <div class="placeholder">
          <h1 class="govbb-text-h1">{title}</h1>
          <div class="placeholder__text">
{body}
            <p class="govbb-text-body"><strong>{not_built}</strong></p>
          </div>
        </div>
      </div>
    </main>

    <footer class="govbb-footer">
      <div class="govbb-container govbb-footer__inner">
        <nav class="govbb-footer__nav" aria-label="Footer">
          <a class="govbb-footer__link" href="#">Home</a>
          <a class="govbb-footer__link" href="#">Cookie Policy</a>
          <a class="govbb-footer__link" href="#">Terms &amp; Conditions</a>
          <a class="govbb-footer__link" href="#">Sitemap</a>
        </nav>
        <hr class="govbb-footer__divider" aria-hidden="true" />
        <div class="govbb-footer__end">
          <img
            class="govbb-footer__coat"
            src="dist/assets/images/govbb-creast.svg"
            alt="Government of Barbados Coat of Arms"
          />
          <p class="govbb-footer__copy">© 2026 Government of Barbados</p>
        </div>
      </div>
    </footer>
  </body>
</html>
"""

for stem, title, paragraphs, back in PLACEHOLDERS:
    body = "\n".join(
        f'            <p class="govbb-text-body">{html.escape(p)}</p>' for p in paragraphs
    )
    out = PAGE.format(title=html.escape(title), body=body, not_built=NOT_BUILT, back=back)
    (root / f"{stem}.relative.html").write_text(out, encoding="utf-8")
    print(f"Wrote {stem}.relative.html")

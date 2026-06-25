#!/usr/bin/env python3
"""Generate the single conditional result page for the
"Find out what to do after someone dies" route.

The check page (death-check) works out a result key and navigates here; this
page shows the one matching result block, including a "Why you are seeing this"
section explaining the answers. The lawyer result has two "Why" variants
(disagreement = Yes / Not sure), chosen with a second stored value.

State is passed via sessionStorage so it works in the multi-file site and the
single-file prototype.

Block types: ("h2", t) | ("p", t) | ("ul", [items]) | ("links", [(text, url)])
           | ("html", raw)  -- raw is pre-indented HTML, injected as-is.
The FIRST ("h2", ...) in each result renders as the result panel.
"""
import html
import pathlib

root = pathlib.Path(__file__).parent

PROBATE_URL = "https://www.barbadoslawcourts.gov.bb/court-administration/supreme-court-registry/probate-unit"
PT_URL = "https://oag.gov.bb/Departments/Solicitor-General-s-Chambers/Public-Trustee"
EC_GUIDE_URL = "https://bra.gov.bb/Popular-Topics/Tax-Clearances/Applying-for-Estate-Clearance"
EC_APPLY_URL = "https://portal.bra.gov.bb/EstateClearance"

LAWYER_WHY = (
    '          <div class="why" data-why="yes" hidden>\n'
    '            <p class="govbb-text-body">You said someone is disagreeing about the will, money, property or who should deal with the estate.</p>\n'
    '            <p class="govbb-text-body">This service cannot help where there is a disagreement.</p>\n'
    '            <p class="govbb-text-body">You should speak to a lawyer before taking the next step.</p>\n'
    '          </div>\n'
    '          <div class="why" data-why="unsure" hidden>\n'
    '            <p class="govbb-text-body">You said you are not sure if there is a disagreement.</p>\n'
    '            <p class="govbb-text-body">This may need legal help before you choose the next step.</p>\n'
    '            <p class="govbb-text-body">You should speak to a lawyer if you are unsure.</p>\n'
    '          </div>'
)

RESULTS = [
    ("lawyer", [
        ("h2", "You should speak to a lawyer"),
        ("h2", "Why you are seeing this"),
        ("html", LAWYER_WHY),
        ("h2", "What this means"),
        ("p", "This is important if:"),
        ("ul", [
            "family members disagree",
            "someone may challenge the will",
            "there may be more than one will",
            "someone is unsure who should apply",
            "land, a business or overseas property is involved",
            "there is already a court matter",
        ]),
    ]),
    ("probate", [
        ("h2", "You may need probate"),
        ("h2", "Why you are seeing this"),
        ("p", "You said the person left a will and you are named as executor."),
        ("p", "Probate may be needed when the executor needs authority to deal with the person’s estate."),
        ("h2", "What this means"),
        ("p", "Probate is an official document from the Supreme Court."),
        ("p", "It gives the executor authority to deal with the person’s estate."),
        ("p", "Banks, credit unions, insurance companies or other organisations may ask for probate before they release money or property."),
        ("h2", "What you may need"),
        ("p", "You may need:"),
        ("ul", [
            "the original will",
            "the death certificate",
            "details of the person’s money, property and debts",
            "names and contact details for banks, credit unions, insurers or other organisations",
            "legal help to prepare and file the application",
        ]),
        ("h2", "What to do next"),
        ("p", "Check the will and gather the documents you have."),
        ("p", "You may need to speak to a lawyer before applying for probate."),
        ("h2", "Official link"),
        ("links", [("Probate Unit guidance", PROBATE_URL)]),
        ("h2", "Prototype note"),
        ("p", "This prototype helps you understand if probate may be needed. It does not prepare or file probate documents yet."),
    ]),
    ("speak-executor", [
        ("h2", "You may need to speak to the executor"),
        ("h2", "Why you are seeing this"),
        ("p", "You said the person left a will, but you are not named as executor."),
        ("p", "The executor is usually the person who applies for probate and manages the estate."),
        ("h2", "What this means"),
        ("p", "You may need to speak to the person named as executor in the will."),
        ("p", "This prototype cannot decide who should manage the estate."),
        ("h2", "Official link"),
        ("links", [("Probate Unit guidance", PROBATE_URL)]),
        ("h2", "Prototype note"),
        ("p", "This prototype does not review wills or decide who should manage the estate."),
    ]),
    ("check-will", [
        ("h2", "Check the will"),
        ("h2", "Why you are seeing this"),
        ("p", "You said the person left a will, but you do not know if you are named as executor."),
        ("p", "The will should say who is named to manage the estate."),
        ("h2", "What this means"),
        ("p", "You may need to check the will before choosing the next step."),
        ("p", "If you are not named as executor, you may need to speak to the person who is named."),
        ("h2", "Official link"),
        ("links", [("Probate Unit guidance", PROBATE_URL)]),
        ("h2", "Prototype note"),
        ("p", "This prototype does not review wills."),
    ]),
    ("letters", [
        ("h2", "You may need letters of administration"),
        ("h2", "Why you are seeing this"),
        ("p", "You said the person did not leave a will and the estate may be worth more than BDS $15,000."),
        ("p", "Letters of administration may be needed when someone needs authority to deal with the estate of a person who died without a will."),
        ("h2", "What this means"),
        ("p", "Letters of administration are official documents from the Supreme Court."),
        ("p", "They give an administrator authority to deal with the estate."),
        ("p", "Banks, credit unions, insurance companies or other organisations may ask for letters of administration before they release money or property."),
        ("h2", "What you may need"),
        ("p", "You may need:"),
        ("ul", [
            "the death certificate",
            "documents that show your relationship to the person who died",
            "details of the person’s money, property and debts",
            "names and contact details for banks, credit unions, insurers or other organisations",
            "legal help to prepare and file the application",
        ]),
        ("h2", "What to do next"),
        ("p", "Gather the documents you have."),
        ("p", "You should speak to a lawyer if you are not sure who should apply."),
        ("h2", "Official link"),
        ("links", [("Probate Unit guidance", PROBATE_URL)]),
        ("h2", "Prototype note"),
        ("p", "This prototype helps you understand if letters of administration may be needed. It does not prepare or file letters of administration documents yet."),
    ]),
    ("trustee", [
        ("h2", "The Public Trustee may be able to help"),
        ("h2", "Why you are seeing this"),
        ("p", "You said the estate may be worth BDS $15,000 or less, or that you want to know if the Public Trustee can help."),
        ("p", "The Public Trustee may be able to help with a small estate."),
        ("h2", "What this means"),
        ("p", "This may apply if the person’s estate is worth BDS $15,000 or less."),
        ("p", "The person applying usually needs to show their relationship to the person who died."),
        ("h2", "What you may need"),
        ("p", "You may need:"),
        ("ul", [
            "the death certificate",
            "the person’s Barbados ID card",
            "the person’s National Insurance number",
            "funeral bill or invoice",
            "funeral payment receipts",
            "documents that show your relationship to the person who died",
            "bank, credit union, insurance, share or vehicle documents, if relevant",
        ]),
        ("h2", "What to do next"),
        ("p", "Gather the documents you have."),
        ("p", "A Public Trustee application must include the required documents before it can be processed."),
        ("p", "The application form must be signed and witnessed by a Justice of the Peace or attorney-at-law."),
        ("p", "Copies of supporting documents may need to be certified."),
        ("h2", "Official link"),
        ("links", [("Public Trustee guidance", PT_URL)]),
        ("h2", "Prototype note"),
        ("p", "This prototype helps you understand if the Public Trustee route may apply. It does not prepare or submit a Public Trustee application yet."),
    ]),
    ("funeral", [
        ("h2", "You may be able to apply for funeral expenses"),
        ("h2", "Why you are seeing this"),
        ("p", "You said you want to apply to be repaid for funeral expenses."),
        ("p", "If you paid funeral expenses, you may be able to apply to be repaid from money held for the person who died."),
        ("h2", "What this means"),
        ("p", "This may be possible even if the estate is worth more than BDS $15,000."),
        ("h2", "What you may need"),
        ("p", "You may need:"),
        ("ul", [
            "the death certificate",
            "the funeral bill or invoice",
            "receipts showing payment",
            "your ID",
            "details of where the person’s money is held",
            "documents that show your relationship to the person who died, if needed",
        ]),
        ("h2", "What to do next"),
        ("p", "Gather the funeral bill, receipts and any documents you have."),
        ("p", "The Public Trustee guidance explains how to apply."),
        ("h2", "Official link"),
        ("links", [("Public Trustee guidance", PT_URL)]),
        ("h2", "Prototype note"),
        ("p", "This prototype helps you understand if a funeral expense application may apply. It does not prepare or submit a funeral expense application yet."),
    ]),
    ("clearance", [
        ("h2", "You may need estate clearance"),
        ("h2", "Why you are seeing this"),
        ("p", "You said you want to get estate clearance."),
        ("p", "Estate clearance may be needed before estate assets are distributed."),
        ("h2", "What this means"),
        ("p", "This usually happens after probate or letters of administration has been granted."),
        ("h2", "What you may need"),
        ("p", "You may need:"),
        ("ul", [
            "a completed and signed estate clearance application",
            "the death certificate",
            "letters testamentary or letters of administration",
            "a certified copy of the will, if there is one",
            "a list of assets",
            "the map reference number for real property, if land or a house is involved",
        ]),
        ("h2", "What to do next"),
        ("p", "Gather the documents you have."),
        ("p", "Estate clearance applications can be sent to the Barbados Revenue Authority."),
        ("h2", "Official links"),
        ("links", [("Estate clearance guidance", EC_GUIDE_URL), ("Apply for an Estate Clearance Certificate", EC_APPLY_URL)]),
        ("h2", "Prototype note"),
        ("p", "This prototype helps you understand if estate clearance may be needed. It does not prepare or submit an estate clearance application yet."),
    ]),
    ("check-for-will", [
        ("h2", "You may need to check for a will"),
        ("h2", "Why you are seeing this"),
        ("p", "You said you do not know if the person left a will."),
        ("p", "A will may name the person who should manage the estate."),
        ("h2", "What you may need to do"),
        ("p", "You may need to:"),
        ("ul", [
            "ask close family members",
            "check the person’s personal papers",
            "check with a lawyer who may have prepared the will",
            "ask banks or other organisations where important documents may have been kept",
        ]),
        ("h2", "Official link"),
        ("links", [("Probate Unit guidance", PROBATE_URL)]),
        ("h2", "Prototype note"),
        ("p", "This prototype does not search for wills."),
    ]),
    ("more-info", [
        ("h2", "You may need more information"),
        ("h2", "Why you are seeing this"),
        ("p", "Your answers do not clearly show which next step may apply."),
        ("p", "You may need to gather more information before choosing the next step."),
        ("h2", "What to check"),
        ("p", "Try to find out:"),
        ("ul", [
            "if there is a will",
            "who is named as executor, if there is a will",
            "what money or property the person had",
            "if there are debts",
            "if anyone has already contacted a lawyer, bank or government office",
        ]),
        ("h2", "Prototype note"),
        ("p", "This prototype does not yet create a full document checklist."),
    ]),
]

PAGE = """<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your possible next step — The Government of Barbados</title>
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
      .outcome {{
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
      .outcome__text {{
        display: flex;
        flex-direction: column;
        gap: var(--spacing-s);
      }}
      .result {{
        display: flex;
        flex-direction: column;
        gap: var(--spacing-m);
      }}
      .result[hidden] {{
        display: none;
      }}
      .result-panel {{
        padding: var(--spacing-s) var(--spacing-m);
        border-left: var(--spacing-xxs) solid var(--color-blue-40);
        background: var(--color-blue-10);
      }}
      .why {{
        display: flex;
        flex-direction: column;
        gap: var(--spacing-s);
      }}
      .why[hidden] {{
        display: none;
      }}
      .outcome__actions {{
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-s);
        margin-top: var(--spacing-s);
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
        <a class="govbb-link back-link" href="death-check.html">Back</a>

        <div class="outcome">
          <h1 class="govbb-text-h1">Your possible next step</h1>
          <div class="outcome__text">
            <p class="govbb-text-body">Based on your answers, this is the next step that may apply.</p>
            <p class="govbb-text-body">This is general information. It is not legal advice.</p>
          </div>

{results}

          <div class="outcome__actions">
            <a class="govbb-btn" href="choose-help.html" role="button" draggable="false">Back to what you need help with</a>
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

    <script>
      // Show the one result block (and lawyer "why" variant) for the answers.
      (function () {{
        function apply(key, lawyerReason) {{
          var root = document.getElementById("screen-death-result") || document;
          var blocks = root.querySelectorAll(".result");
          var found = false;
          for (var i = 0; i < blocks.length; i++) {{
            var match = blocks[i].getAttribute("data-result") === key;
            blocks[i].hidden = !match;
            if (match) found = true;
          }}
          if (!found) {{
            var d = root.querySelector('.result[data-result="more-info"]');
            if (d) d.hidden = false;
          }}
          var lr = root.querySelector('.result[data-result="lawyer"]');
          if (lr) {{
            var whys = lr.querySelectorAll(".why");
            var shown = false;
            for (var j = 0; j < whys.length; j++) {{
              var m = whys[j].getAttribute("data-why") === lawyerReason;
              whys[j].hidden = !m;
              if (m) shown = true;
            }}
            if (!shown) {{
              var y = lr.querySelector('.why[data-why="yes"]');
              if (y) y.hidden = false;
            }}
          }}
        }}
        window.applyDeathResult = apply;
        var key = "more-info", reason = "yes";
        try {{
          key = sessionStorage.getItem("deathResult") || "more-info";
          reason = sessionStorage.getItem("deathLawyerReason") || "yes";
        }} catch (e) {{}}
        apply(key, reason);
      }})();
    </script>
  </body>
</html>
"""


def render_blocks(blocks):
    out = []
    pbuf = []
    state = {"panel_done": False}

    def flush():
        if pbuf:
            inner = "\n".join(f'            <p class="govbb-text-body">{html.escape(t)}</p>' for t in pbuf)
            out.append('          <div class="outcome__text">\n' + inner + "\n          </div>")
            pbuf.clear()

    for kind, content in blocks:
        if kind == "p":
            pbuf.append(content)
            continue
        flush()
        if kind == "h2":
            if not state["panel_done"]:
                out.append('          <div class="result-panel"><h2 class="govbb-text-h2">' + html.escape(content) + "</h2></div>")
                state["panel_done"] = True
            else:
                out.append(f'          <h2 class="govbb-text-h2">{html.escape(content)}</h2>')
        elif kind == "ul":
            items = "\n".join(f"            <li>{html.escape(i)}</li>" for i in content)
            out.append('          <ul class="govbb-list govbb-list--bullet">\n' + items + "\n          </ul>")
        elif kind == "links":
            items = "\n".join(
                f'            <li><a class="govbb-link" href="{url}" target="_blank" rel="noopener noreferrer">{html.escape(text)}</a></li>'
                for text, url in content
            )
            out.append('          <ul class="govbb-list">\n' + items + "\n          </ul>")
        elif kind == "html":
            out.append(content)
    flush()
    return "\n".join(out)


sections = []
for key, blocks in RESULTS:
    sections.append(f'          <section class="result" data-result="{key}" hidden>\n' + render_blocks(blocks) + "\n          </section>")

out = PAGE.format(results="\n\n".join(sections))
(root / "death-result.relative.html").write_text(out, encoding="utf-8")
print("Wrote death-result.relative.html")

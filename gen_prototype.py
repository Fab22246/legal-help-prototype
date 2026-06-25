#!/usr/bin/env python3
"""Assemble every "<name>.relative.html" page into a SINGLE self-contained
"prototype.html" where each page is a screen shown/hidden with JavaScript.

This lets the whole flow be clicked through inside the in-app preview pane,
which renders one file with no base URL and so cannot navigate between
separate files. Run the page generators first (gen_placeholders.py,
gen_route.py); this reads their .relative.html output plus the hand-written
pages and stitches them together.
"""
import base64
import pathlib
import re

root = pathlib.Path(__file__).parent

# Screen order. First entry is shown on load.
PAGES = [
    "index",
    "choose-help",
    "help-me-choose",
    "give-property",
    "signing-witnessing",
    "change-record",
    "prepare-for-lawyer",
    "will-check",
    "will-needs-detail",
    "speak-to-a-lawyer",
    "property-not-covered",
    "will-prepare-intro",
    "will-about-you",
    "will-land",
    "will-executor",
    "will-leave",
    "will-gifts",
    "will-beneficiaries",
    "will-documents",
    "will-review",
    "will-next-steps",
    "death-check",
    "death-result",
    "plan-money-property",
]


def b64(rel):
    return base64.b64encode((root / rel).read_bytes()).decode("ascii")


def grab(pattern, text):
    m = re.search(pattern, text, re.S)
    return m.group(1) if m else ""


# --- shared assets (same approach as build_standalone.py) -------------------
css = (root / "dist" / "styles.css").read_text(encoding="utf-8")
for url, path in {
    "./assets/fonts/figtree-latin-ext.woff2": "dist/assets/fonts/figtree-latin-ext.woff2",
    "./assets/fonts/figtree-latin.woff2": "dist/assets/fonts/figtree-latin.woff2",
}.items():
    css = css.replace(f'url("{url}")', f'url("data:font/woff2;base64,{b64(path)}")')

logo = "data:image/svg+xml;base64," + b64("dist/assets/images/govbb-logo.svg")

crest_svg = (root / "dist" / "assets" / "images" / "govbb-creast.svg").read_text(encoding="utf-8")
ctag = re.match(r"<svg\b[^>]*>", crest_svg, re.S).group(0)
cw = re.search(r'\bwidth="([\d.]+)"', ctag).group(1)
ch = re.search(r'\bheight="([\d.]+)"', ctag).group(1)
crest_inner = crest_svg[len(ctag):].rsplit("</svg>", 1)[0]
crest_symbol = (
    f'<svg width="0" height="0" style="position:absolute" aria-hidden="true">'
    f'<symbol id="govbb-crest" viewBox="0 0 {cw} {ch}">{crest_inner}</symbol></svg>'
)

# --- shell chrome (taken once from index) -----------------------------------
index_src = (root / "index.relative.html").read_text(encoding="utf-8")
# official banner + header live in the <div> before <main>
shell_top = grab(r"(<div>\s*<div class=\"govbb-official-banner\".*?</header>\s*</div>)", index_src)
footer = grab(r"(<footer class=\"govbb-footer\">.*?</footer>)", index_src)

# --- per-page screens + styles + scripts ------------------------------------
style_blocks = []
screens = []
scripts = []

for stem in PAGES:
    src = (root / f"{stem}.relative.html").read_text(encoding="utf-8")

    style = grab(r"<style>(.*?)</style>", src).strip()
    if style and style not in style_blocks:
        style_blocks.append(style)

    main_inner = grab(r"<main\b[^>]*>(.*?)</main>", src)
    # Namespace the shared "q-hint" id so it stays unique across screens.
    main_inner = main_inner.replace('id="q-hint"', f'id="q-hint-{stem}"')
    main_inner = main_inner.replace('aria-describedby="q-hint"', f'aria-describedby="q-hint-{stem}"')
    # First screen is active by default so the start page shows even without JS.
    cls = "screen screen--active" if stem == PAGES[0] else "screen"
    screens.append(f'      <section class="{cls}" id="screen-{stem}">{main_inner}      </section>')

    for sc in re.findall(r"<script\b[^>]*>(.*?)</script>", src, re.S):
        # Scope the form lookup to this screen and route via nav() not the URL bar.
        sc = sc.replace(
            'document.querySelector(".form-page")',
            f'document.querySelector("#screen-{stem} .form-page")',
        )
        sc = re.sub(r"window\.location\.href = ([^;]+);", r"nav(\1);", sc)
        scripts.append(sc)

router = """
      // --- single-file prototype router -------------------------------------
      function nav(href) {
        var stem = String(href).replace(/\\.html$/, "").replace(/^.*\\//, "");
        showScreen(stem);
      }
      function showScreen(stem) {
        var target = document.getElementById("screen-" + stem);
        if (!target) return;
        var screens = document.querySelectorAll(".screen");
        for (var i = 0; i < screens.length; i++) screens[i].classList.remove("screen--active");
        target.classList.add("screen--active");
        window.scrollTo(0, 0);
        var h1 = target.querySelector("h1");
        if (h1) { h1.setAttribute("tabindex", "-1"); h1.focus(); }
      }
      // Intercept link clicks. Same-page anchors (#...) behave normally; every
      // other link is handled in-document so the preview never tries to
      // navigate the top frame (which it blocks as a non-localhost URL).
      document.addEventListener("click", function (e) {
        var a = e.target.closest && e.target.closest("a[href]");
        if (!a) return;
        var href = a.getAttribute("href");
        e.preventDefault(); // never let the preview navigate the top frame
        if (/^https?:\\/\\//i.test(href)) { // external gov links open in a new tab
          window.open(href, "_blank", "noopener");
          return;
        }
        if (href.length > 1 && href.charAt(0) === "#") {
          var t = document.getElementById(href.slice(1));
          if (t) t.scrollIntoView();
          return;
        }
        if (href === "#" || href === "") return; // inert placeholder link
        var stem = href.replace(/\\.html$/, "").replace(/^.*\\//, "");
        if (document.getElementById("screen-" + stem)) showScreen(stem);
        else if (href === "/" || stem === "index") showScreen("index");
      });
      showScreen("index");
"""

spa_css = """
      /* Single-file prototype: one screen visible at a time. */
      .screen { display: none; }
      .screen--active { display: block; }
      .govbb-official-banner__icon, .govbb-footer__coat {
        aspect-ratio: %s / %s;
        width: auto;
      }
""" % (cw, ch)

doc = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Legal help for common life events — prototype</title>
    <style>
{css}
    </style>
    <style>
{chr(10).join(style_blocks)}
{spa_css}
    </style>
  </head>
  <body class="govbb-page">
    {crest_symbol}
    <a class="skip-link" href="#main-content">Skip to main content</a>

    {shell_top}

    <main class="govbb-page__main" id="main-content">
{chr(10).join(screens)}
    </main>

    {footer}

    <script>
{router}
{chr(10).join(scripts)}
    </script>
  </body>
</html>
"""

# Point the header logo at the start screen instead of "/" (which the preview
# pane blocks as a non-localhost URL).
doc = doc.replace('<a href="/" aria-label="Go to the alpha.gov.bb homepage">',
                  '<a href="index.html" aria-label="Go to the alpha.gov.bb homepage">')

# Inline the logo and swap crest <img> tags for <use> references.
doc = doc.replace('src="dist/assets/images/govbb-logo.svg"', f'src="{logo}"')
doc = re.sub(
    r'<img\s+class="govbb-official-banner__icon"[^>]*?/>',
    '<svg class="govbb-official-banner__icon" aria-hidden="true" focusable="false">'
    '<use href="#govbb-crest"></use></svg>',
    doc, flags=re.S,
)
doc = re.sub(
    r'<img\s+class="govbb-footer__coat"[^>]*?/>',
    '<svg class="govbb-footer__coat" role="img" aria-label="Government of Barbados Coat of Arms">'
    '<use href="#govbb-crest"></use></svg>',
    doc, flags=re.S,
)

(root / "prototype.html").write_text(doc, encoding="utf-8")
print(f"Wrote prototype.html ({len((root / 'prototype.html').read_bytes()) / 1024:.0f} KB) — {len(PAGES)} screens")

#!/usr/bin/env python3
"""Inline CSS, fonts and SVG images into each "<name>.relative.html" source,
producing a self-contained "<name>.html" that renders correctly when opened
directly (file://) or in a sandboxed preview panel.

The coat-of-arms crest is a single 564 KB high-precision vector path used in
both the official banner and the footer. To avoid embedding it twice, it is
inlined once as an SVG <symbol> and referenced with <use>.
"""
import base64
import pathlib
import re

root = pathlib.Path(__file__).parent

# Every page that has a "<name>.relative.html" source. Builds "<name>.html".
PAGES = [
    "index",
    "choose-help",              # main hub (hand-written)
    "help-me-choose",           # single-page triage (gen_route.py)
    "give-property",            # guidance: giving property while alive (hand-written)
    "signing-witnessing",       # support page (hand-written)
    "change-record",            # placeholder content page (hand-written)
    "prepare-for-lawyer",       # single preparation page (hand-written)
    # "Prepare a simple will" route — suitability check + stops + prepare flow
    "will-check",               # grouped suitability questions, route entry (hand-written)
    "will-needs-detail",        # fallback only: needs more detail (hand-written)
    "speak-to-a-lawyer",        # stop: needs legal help (hand-written, conditional)
    "property-not-covered",     # caution: owns something not covered (hand-written)
    "will-prepare-intro",       # prepare-information intro (hand-written)
    "will-about-you",           # form (hand-written)
    "will-land",                # form: land/house details, conditional (hand-written)
    "will-executor",            # form (hand-written)
    "will-leave",               # how to leave what is included; branches (hand-written)
    "will-gifts",               # form: specific gifts, conditional + repeatable (hand-written)
    "will-beneficiaries",       # form, conditional + repeatable (hand-written)
    "will-documents",           # form (hand-written)
    "will-review",              # check your answers (hand-written)
    "will-next-steps",          # placeholder result (hand-written)
    # "Find out what to do after someone dies" route (check page + one result page)
    "death-check",              # single grouped check, route entry (hand-written)
    "death-result",             # one conditional result page (gen_death_result.py)
    # "Plan what happens to my money and property" route (single page)
    "plan-money-property",      # hand-written
]


def b64(rel):
    return base64.b64encode((root / rel).read_bytes()).decode("ascii")


# Embed the two web fonts as data URIs inside the CSS (shared across all pages).
css = (root / "dist" / "styles.css").read_text(encoding="utf-8")
for url, path in {
    './assets/fonts/figtree-latin-ext.woff2': 'dist/assets/fonts/figtree-latin-ext.woff2',
    './assets/fonts/figtree-latin.woff2': 'dist/assets/fonts/figtree-latin.woff2',
}.items():
    css = css.replace(f'url("{url}")', f'url("data:font/woff2;base64,{b64(path)}")')

logo = "data:image/svg+xml;base64," + b64("dist/assets/images/govbb-logo.svg")

# Crest: read once, build a reusable <symbol> and an aspect-ratio fix.
crest_svg = (root / "dist" / "assets" / "images" / "govbb-creast.svg").read_text(encoding="utf-8")
open_tag = re.match(r"<svg\b[^>]*>", crest_svg, re.DOTALL).group(0)
w = re.search(r'\bwidth="([\d.]+)"', open_tag).group(1)
h = re.search(r'\bheight="([\d.]+)"', open_tag).group(1)
inner = crest_svg[len(open_tag):].rsplit("</svg>", 1)[0]
symbol = (
    f'<svg width="0" height="0" style="position:absolute" aria-hidden="true">'
    f'<symbol id="govbb-crest" viewBox="0 0 {w} {h}">{inner}</symbol></svg>'
)
# Inline <svg> (unlike <img>) does not derive width from aspect ratio, so the
# crest defaults to 300px wide. Pin the aspect ratio so width:auto works.
# Injected before the page-specific style block's "    </style>" (4-space
# indented) so it wins over the inlined design-system block.
crest_fix = (
    f"      .govbb-official-banner__icon, .govbb-footer__coat {{\n"
    f"        aspect-ratio: {w} / {h};\n"
    f"        width: auto;\n      }}\n    </style>"
)


def build(name):
    out = (root / f"{name}.relative.html").read_text(encoding="utf-8")
    # Replace the external stylesheet link with an inline <style> block.
    out = out.replace(
        '<link rel="stylesheet" href="dist/styles.css" />',
        f"<style>\n{css}\n</style>",
    )
    # Drop the favicon link (avoids a harmless 404 when opened directly).
    out = out.replace('<link rel="icon" href="dist/assets/images/favicon.ico" />\n    ', '')
    # Inline the logo data URI.
    out = out.replace('src="dist/assets/images/govbb-logo.svg"', f'src="{logo}"')
    # Inline the crest symbol once, right after <body>.
    out = out.replace('<body class="govbb-page">', '<body class="govbb-page">\n    ' + symbol)
    # Pin the crest aspect ratio inside the page-specific style block.
    out = out.replace("    </style>", crest_fix, 1)
    # Swap the two crest <img> tags for <use> references to the symbol.
    out = re.sub(
        r'<img\s+class="govbb-official-banner__icon"[^>]*?/>',
        '<svg class="govbb-official-banner__icon" aria-hidden="true" focusable="false">'
        '<use href="#govbb-crest"></use></svg>',
        out, flags=re.DOTALL,
    )
    out = re.sub(
        r'<img\s+class="govbb-footer__coat"[^>]*?/>',
        '<svg class="govbb-footer__coat" role="img" aria-label="Government of Barbados Coat of Arms">'
        '<use href="#govbb-crest"></use></svg>',
        out, flags=re.DOTALL,
    )
    (root / f"{name}.html").write_text(out, encoding="utf-8")
    kb = len((root / f"{name}.html").read_bytes()) / 1024
    print(f"Wrote self-contained {name}.html ({kb:.0f} KB)")


for page in PAGES:
    build(page)

# Brand assets — `petlife/`

Per the Asset Management Policy of 26 July 2026, all official brand trademarks,
insignia, icons and visual assets are stored **in this local folder** and are
fetched by direct local file path from every UI touchpoint.

## Files

| File | Role |
| --- | --- |
| `logo.png` | **The authorised brand asset.** 512×512 PNG. Referenced by every page for the header mark, footer mark, in-app mockup, browser favicon and Apple touch icon. |
| `logo-master.jpg` | Untouched master supplied by the brand owner (1254×1254 JPG). Kept as the source of record; not referenced by any page. |

`logo.png` was produced from `logo-master.jpg` by format conversion and
downscaling only. No part of the artwork was redrawn, traced, regenerated or
otherwise altered.

## Policy

- Brand assets are served from this local path only. No remote host, no CDN,
  no data URI, no external fetch.
- **No dynamic, algorithmic, programmatic or AI generation or recreation** of
  the logo or any brand artwork. Assets are immutable and are reproduced solely
  from the authorised master file supplied by the brand owner.
- If the mark ever needs to change, replace `logo.png` and `logo-master.jpg`
  here. Nothing in the HTML, CSS or JS needs editing.
- This policy is mirrored contractually at Clause 18.3 of `terms.html`.

## Rendering note

The mark is a square tile with its dark-green field baked in. Corners are
rounded in CSS (`border-radius: 24%` on `.nav__logo img`, `.footer__logo img`,
`.app-hero__logo img`) rather than by editing the file, so the asset on disk
stays byte-identical to what the brand owner supplied.

`js/main.js` hides the logo slot if the file is ever missing, so the header
degrades to the "Petlife" wordmark instead of showing a broken-image box.

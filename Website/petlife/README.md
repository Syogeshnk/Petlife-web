# Brand assets — `petlife/`

Per the Asset Management Policy of 26 July 2026, all official brand trademarks,
insignia, icons and visual assets are stored **in this local folder** and are
fetched by direct local file path from every UI touchpoint.

## Files

| File | Role |
| --- | --- |
| `logo.png` | **The authorised brand asset.** 512×512 PNG. Referenced by every page for the header mark, footer mark, in-app mockup, browser favicon and Apple touch icon. |
| `logo-master.png` | Untouched master supplied by the brand owner (1254×1254 PNG). Kept as the source of record; not referenced by any page. |
| `logo-master.jpg` | The *previous* master (1254×1254 JPG), superseded on 26 July 2026. Retained for history; not referenced by any page. |

`logo.png` was produced from `logo-master.png` by downscaling only. No part of
the artwork was redrawn, traced, regenerated or otherwise altered.

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

The mark is a square tile with its dark-green field baked in. The current master
draws that field as a rounded tile whose corner radius measures **20.3%** of the
width, with white outside it. Corners are clipped in CSS (`border-radius: 24%` on
`.nav__logo img`, `.footer__logo img`, `.app-hero__logo img`) rather than by
editing the file, so the asset on disk stays byte-identical to what the brand
owner supplied. Because 24% exceeds the artwork's own 20.3%, the white corners
are fully clipped and never show — including against the dark footer. **If a
future master uses a tighter corner radius than 24%, that CSS value must be
re-measured**, or white corners will appear.

The mark also carries the words "Care · Love · Trust" baked into the artwork.
These are legible at 512px but not at the 42px header size, where they read as
texture rather than text. The wordmark beside the logo carries the name, and the
footer lock-up sets the tagline as live text, so no information is lost.

`js/main.js` hides the logo slot if the file is ever missing, so the header
degrades to the "Petlife" wordmark instead of showing a broken-image box.

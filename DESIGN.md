# Petlife — Design Language

> **Single source of truth for every visual decision.**
> Every component, every screen, every interaction follows these rules.
> Theme: **Garden Walk** — Sage Green · Warm Linen · Amber
> Philosophy: Nature · Trust · Warmth
> Last updated: 2026-07-02 (registration-flow redesign — see §16 Change Log. Originally created 2026-06-19)

---

## 1. Design Philosophy

**Three words that drive every decision: Calm. Clear. Alive.**

- **Calm** — users are looking for someone to trust with their pet. No noise, no clutter, no anxiety-inducing reds or high contrast. The interface should feel like stepping into a well-kept garden.
- **Clear** — every tap target is obvious, every label is readable at a glance, distance from a 60-year-old arm's length. No icon-only navigation without labels.
- **Alive** — soft shadows, gentle gradients, rounded shapes, and micro-interactions that make the app feel like it has warmth, not like a spreadsheet.

**What this theme is NOT:**
- Not flat/Material 2.0 — surfaces have depth
- Not dark or edgy — this is pet care, not fintech
- Not sharp corners — everything is rounded, soft, approachable
- Not pure white — use Warm Linen as the base, not blinding white

---

## 2. Color System

### 2.1 Primary Palette

```
--color-primary:          #3D6B4F   /* Sage Green — main brand, hero, links, active states */
--color-primary-mid:      #4A7C59   /* Mid green — gradient midpoint */
--color-primary-light:    #5C9068   /* Light green — gradient end */
--color-primary-pale:     #7AAB86   /* Pale green — gradient tail */
--color-primary-surface:  #EBF5ED   /* Green tint — vet category bg, available badge bg */
```

### 2.2 Background Palette

```
--color-bg:               #F7F3ED   /* Warm Linen — main app background (not white!) */
--color-surface:          #FFFFFF   /* Pure white — cards, modals, bottom sheets */
--color-surface-tint:     #FEF3E8   /* Amber tint — CTA banners, walker category, warnings */
--color-bg-outer:         #E8E4DF   /* Slightly darker linen — page background behind app */
```

### 2.3 Accent Palette

```
--color-accent:           #E8934A   /* Amber — star ratings, CTA buttons, highlights */
--color-accent-surface:   #FEF3E8   /* Amber tint — accent background areas */
```

### 2.4 Category Colors (icon backgrounds only)

```
--cat-vet:       #EBF5ED   /* Sage tint */
--cat-walker:    #FEF3E8   /* Amber tint */
--cat-trainer:   #EEF2FE   /* Blue tint */
--cat-food:      #FFF3E8   /* Warm tint */
--cat-groomer:   #F5EEFE   /* Lavender tint */
--cat-all:       #F0F0F0   /* Neutral */
```

### 2.5 Text Palette

```
--color-text-primary:     #1C1C1E   /* Main text — names, titles, prices */
--color-text-secondary:   #8E8E93   /* Supporting text — subtitles, placeholders */
--color-text-tertiary:    #6B7280   /* Fine print — timestamps, captions */
--color-text-link:        #3D6B4F   /* Tappable links, section "see all" */
--color-text-on-primary:  #FFFFFF   /* Text on green backgrounds */
--color-text-on-primary-faint: rgba(255,255,255,0.70)  /* Subtext on green */
--color-text-on-primary-dim:   rgba(255,255,255,0.55)  /* Dim text on green */
```

### 2.6 Status Colors

```
--color-available:        #3D6B4F   /* Available badge text */
--color-available-bg:     #EBF5ED   /* Available badge background */
--color-busy:             #E8934A   /* Busy/warning text */
--color-busy-bg:          #FEF3E8   /* Busy badge background */
--color-closed:           #6B7280   /* Closed badge text */
--color-closed-bg:        #F0F0F0   /* Closed badge background */
--color-error:            #DC2626   /* Error text */
--color-error-bg:         #FEF2F2   /* Error background */
--color-verified:         #3D6B4F   /* Verified badge */
```

### 2.7 Border & Divider

```
--color-border:           rgba(0,0,0,0.07)   /* Default border — subtle */
--color-border-strong:    rgba(0,0,0,0.12)   /* Input borders, modal edges */
--color-divider:          rgba(0,0,0,0.05)   /* List dividers, section separators */
```

### 2.8 Hero Gradient

```css
/* Always used on the hero section — never swap this for a flat color */
background: linear-gradient(160deg,
  #3D6B4F 0%,
  #4A7C59 40%,
  #5C9068 70%,
  #7AAB86 100%
);
```

### 2.9 Trust Strip Gradient

```css
background: linear-gradient(135deg, #3D6B4F, #4A7C59);
```

---

## 3. Typography

### 3.1 Font Stack

```css
font-family: -apple-system, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
```

No custom web fonts in v1 — system fonts load instantly, look native on iOS/Android.

### 3.2 Type Scale

| Role | Size | Weight | Color | Use |
|---|---|---|---|---|
| `display` | 26px | 700 | `#FFFFFF` | Hero title |
| `heading-1` | 20px | 700 | `#1C1C1E` | Page titles, modal headers |
| `heading-2` | 16px | 700 | `#1C1C1E` | Section titles |
| `heading-3` | 15px | 600 | `#1C1C1E` | Card names, sub-section heads |
| `body` | 14px | 400 | `#1C1C1E` | Body text, descriptions |
| `body-strong` | 14px | 600 | `#1C1C1E` | Labels, input values |
| `caption` | 13px | 400 | `#6B7280` | Timestamps, helper text |
| `caption-link` | 13px | 500 | `#3D6B4F` | "See all →", tappable captions |
| `small` | 12px | 500 | `#3D6B4F` | Card service label |
| `micro` | 11px | 500 | `#555` | Category labels, badge text |
| `nano` | 10px | 400 | `#999` | Nav labels (inactive) |
| `logo` | 20px | 700 | `#FFFFFF` | App logo in nav |

### 3.3 Letter Spacing Rules

```
Display / Hero:  letter-spacing: -0.5px
Logo:            letter-spacing: -0.3px
Everything else: letter-spacing: default (0)
```

### 3.4 Line Height Rules

```
Single-line labels:  line-height: 1
Short headings:      line-height: 1.25
Body paragraphs:     line-height: 1.5
Long descriptions:   line-height: 1.6
```

---

## 4. Spacing System

Use a base-4 grid. All spacing is a multiple of 4px.

```
4px   — micro gap (icon to label)
8px   — small gap (within a component)
10px  — category gap
12px  — card gap (between stacked cards)
14px  — card internal gap (avatar to text)
16px  — card padding, small section padding
20px  — body horizontal padding (left + right)
24px  — section vertical spacing
28px  — section header top margin
32px  — large section gap
40px  — hero bottom padding
```

**Body container:** `padding: 0 20px 100px` — 100px bottom clears the bottom nav.

---

## 5. Border Radius

Soft and rounded everywhere. No sharp corners.

```
4px   — small chip/tag corner detail
10px  — icon containers (logo icon, GPS icon, avatar)
14px  — input fields
16px  — GPS search button, small modals
18px  — category icon wrap, trust strip, section cards
20px  — Pet Buddy cards, CTA banners, large cards
24px  — bottom sheets, profile sections
44px  — phone frame corners, full-round bottom nav
50px  — pill badges, pill buttons (fully round)
```

**Rule:** Nested elements should have a border-radius 4–6px smaller than their parent to avoid the "equal radius" flatness.

---

## 6. Shadow System

Layered, subtle shadows. Never harsh or dark.

```css
/* Cards — default resting state */
box-shadow: 0 2px 16px rgba(0,0,0,0.06);

/* GPS search button — elevated, action-ready */
box-shadow: 0 8px 24px rgba(0,0,0,0.12);

/* Modals / bottom sheets — floated above content */
box-shadow: 0 -4px 32px rgba(0,0,0,0.10);

/* Floating action button */
box-shadow: 0 6px 20px rgba(61,107,79,0.30);  /* green-tinted */

/* Bottom nav — separation from content */
border-top: 1px solid rgba(0,0,0,0.07);
/* No shadow on bottom nav — border only */

/* Input focused state */
box-shadow: 0 0 0 3px rgba(61,107,79,0.15);
```

---

## 7. Component Library

### 7.1 Buttons

#### Primary Button (Amber CTA)
```
Background:    #E8934A
Text:          #FFFFFF, 14px, weight 600
Border-radius: 50px (pill)
Padding:       11px 24px
Min-height:    44px (tap target)
Active state:  opacity 0.88 + scale(0.97)
```

#### Secondary Button (Green outline)
```
Background:    transparent
Border:        1.5px solid #3D6B4F
Text:          #3D6B4F, 14px, weight 600
Border-radius: 50px
Padding:       11px 24px
Min-height:    44px
Active state:  background #EBF5ED
```

#### Ghost Button (Frosted — used on hero)
```
Background:    rgba(255,255,255,0.18)
Border:        1px solid rgba(255,255,255,0.30)
Text:          #FFFFFF, 14px, weight 500
Border-radius: 50px
Padding:       8px 18px
Backdrop:      blur(8px)
```

#### Destructive Button (Delete/block)
```
Background:    transparent
Text:          #DC2626, 14px, weight 600
Border:        1.5px solid #DC2626
Border-radius: 50px
Padding:       11px 24px
Active state:  background #FEF2F2
```

#### Text Button (Link style)
```
Background:    none
Text:          #3D6B4F, 14px, weight 500
Underline:     none (never underline links in the app)
Padding:       8px 4px
```

#### Full-Width Button
```
Width: 100%
Border-radius: 16px  (NOT pill — full-width buttons use 16px, not 50px)
Padding: 15px 20px
```

---

### 7.2 GPS Search Button

The primary action on the home screen. Has distinct styling.

```
Background:    #FFFFFF
Border-radius: 16px
Padding:       14px 20px
Shadow:        0 8px 24px rgba(0,0,0,0.12)
Width:         100%

Left icon:
  Size:         36×36px
  Background:   linear-gradient(135deg, #3D6B4F, #5C9068)
  Border-radius: 10px

Primary text:  14px, weight 600, #1C1C1E
Sub text:      12px, #8E8E93
Right arrow:   18px, #3D6B4F, margin-left: auto
```

---

### 7.3 Pet Buddy Card

Used everywhere: search results, home screen, saved list.

```
Background:    #FFFFFF
Border-radius: 20px
Padding:       16px
Margin-bottom: 12px
Shadow:        0 2px 16px rgba(0,0,0,0.06)
Layout:        horizontal flex, gap: 14px

Avatar:
  Size:         56×56px
  Border-radius: 16px
  Background:   rotates through category tints

Name:          15px, weight 600, #1C1C1E
Service tag:   12px, weight 500, #3D6B4F  (e.g. "Veterinarian · Home visits")
Meta row:      flex, gap: 10px, margin-top: 8px

Badges (in meta row):
  → Available: bg #EBF5ED, text #3D6B4F, "● Available"
  → Busy:      bg #FEF3E8, text #E8934A, "● Busy"
  → Closed:    bg #F0F0F0, text #6B7280, "Closed"
  → Distance:  bg #F5F5F5, text #666, "~1.2 km"

Rating (right-aligned in meta row):
  Star:  ★ color #E8934A
  Score: 13px, weight 600, #1C1C1E

Heart icon (save button):
  Position: top-right corner of card OR after rating
  Unfilled: ♡ color #C4C4C4
  Filled:   ♥ color #E8934A
  Tap area: minimum 44×44px
```

---

### 7.4 Badges / Pills

```
Font:          11px, weight 500
Border-radius: 50px
Padding:       3px 10px

Available:     bg #EBF5ED, text #3D6B4F
Busy:          bg #FEF3E8, text #E8934A
Closed:        bg #F0F0F0, text #6B7280
Distance:      bg #F5F5F5, text #666
Open now:      bg #EBF5ED, text #3D6B4F, "● Open now"
Complete:      bg #EBF5ED, text #3D6B4F, "✓ Complete"
Verified:      bg #EBF5ED, text #3D6B4F, "✓ Verified"
New:           bg #FEF3E8, text #E8934A, "New"
```

---

### 7.5 Category Pills (horizontal scroll row)

```
Layout:      flex column, align-center, min-width: 72px
Gap:         7px (icon to label)

Icon wrap:
  Size:         56×56px
  Border-radius: 18px
  Background:   category-specific tint
  Icon:         26px emoji

Label:
  Font:         11px, weight 500, #555
  White-space:  nowrap

Active state:  icon wrap scale(0.93)
Selected:      border 2px solid #3D6B4F on icon wrap
```

---

### 7.6 Section Header

```
Layout:        flex, space-between, align-center
Margin:        28px 0 14px

Title:         16px, weight 700, #1C1C1E
"See all →":   13px, weight 500, #3D6B4F
```

---

### 7.7 Trust Strip

```
Background:    linear-gradient(135deg, #3D6B4F, #4A7C59)
Border-radius: 18px
Padding:       16px 20px
Layout:        flex, space-around

Number:        20px, weight 700, #FFFFFF
Label:         11px, rgba(255,255,255,0.70)

Divider:       1px solid rgba(255,255,255,0.20)
```

---

### 7.8 CTA Banner (Pet Buddy Join)

```
Background:    #FEF3E8
Border-radius: 20px
Padding:       20px
Layout:        flex row, align-center, gap: 14px

Icon:          36px emoji
Title:         15px, weight 700, #1C1C1E
Sub:           12px, #777
Button:        Amber CTA pill, "Join for free →", margin-top: 10px
```

---

### 7.9 Input Fields

```
Background:    #FFFFFF
Border:        1.5px solid rgba(0,0,0,0.12)
Border-radius: 14px
Padding:       14px 16px
Font:          14px, weight 400, #1C1C1E
Placeholder:   #8E8E93

Focused:
  Border:      1.5px solid #3D6B4F
  Shadow:      0 0 0 3px rgba(61,107,79,0.15)

Error:
  Border:      1.5px solid #DC2626
  Shadow:      0 0 0 3px rgba(220,38,38,0.10)

Label above input:
  Font:        13px, weight 500, #6B7280
  Margin-bottom: 6px
```

---

### 7.10 Bottom Navigation

> **Redesigned 2026-07-02 — nav is now role-scoped (5 tabs), not a single fixed 4-tab bar.** Reflects
> the booking lifecycle (§9A) and in-app chat (FEATURE_BUILD.md §30), neither of which existed when
> this was originally a 4-tab discovery-only nav. A user with both roles (`is_pet_parent` AND
> `is_provider`) sees whichever set matches their current `active_role` — switching roles (§25) swaps
> the whole tab set, it doesn't merge the two.

> **Re-redesigned in F7 (2026-07-12) — supersedes the style block below.** Built to
> `design/mockups/Home screen refrence1.png`: a floating **dark-green rounded pill** rendered by a custom
> `components/navigation/PetTabBar.tsx` (not the default RN bar), with **Ionicons** (from
> `@expo/vector-icons`) — **filled=active, outline=inactive** (color AND weight). The bar now shows **4
> tabs + a raised center paw FAB**, not 5 tabs: **Chat was moved OFF the bar** (user's explicit Option C —
> `lib/tabs.ts` resolver now returns 4; parent = Home·Explore·Bookings·Profile, buddy =
> Dashboard·Requests·Schedule·Profile). Chat stays a registered, reachable route (Home's Unread-Messages
> card, profile footers, booking/request detail) — but no longer a bar tab, so no always-visible unread
> dot. The **center paw FAB is an action, not a tab**: "Find Pet Buddies near me" (GPS → Explore). Values
> below (linen background, blur, 5-tab framing) are the pre-F7 spec; the pill/FAB and its green surface are
> the current build.

```
Background:    rgba(247,243,237,0.92) — Warm Linen, 92% opacity
Backdrop:      blur(20px)
Border-top:    1px solid rgba(0,0,0,0.07)
Padding:       12px 0 24px (extra bottom for home indicator)
Border-radius: 0 0 44px 44px (for PWA/standalone mode)

Pet Parent mode — 5 tabs: 🏡 Home · 🔍 Explore · 📅 Bookings · 💬 Chat · 👤 Profile
Pet Buddy mode  — 5 tabs: 📊 Dashboard · 📥 Requests · 📅 Schedule · 💬 Chat · 👤 Profile

Each tab:
  Flex column, align-center, gap: 4px
  Icon:    20px (reduced from 22px to fit 5 tabs comfortably — see §11 for icon rules)
  Label:   10px

Active tab:
  Label color:  #3D6B4F, weight 600
  Icon filter:  drop-shadow(0 0 2px rgba(61,107,79,0.40))

Inactive tab:
  Label color:  #999

Badges:
  Chat tab:      red dot (no number) if any unread conversation
  Requests tab:  red circle with count if any pending booking request (Pet Buddy mode)
  Bookings tab:  red circle with count if any booking needs action (pet parent mode — e.g. OTP pending)
```

**Rule:** "Explore" (pet parent mode) replaces the old single "Search" tab — same destination
(`(tabs)/search`), renamed to match the new inventory's terminology. "Home"/"Dashboard" and
"Profile"/"Profile" are the first and last tab in both modes respectively, so the thumb position for
"go home" and "go to my profile" stays consistent when switching roles — only the 3 middle tabs change.

---

### 7.11 Star Rating Display

```
Stars:    ★ color #E8934A
Score:    13px, weight 600, #1C1C1E
Count:    12px, #8E8E93  "(23 reviews)"
```

---

### 7.12 Avatar / Profile Picture

```
Profile pic:  circular, diameter 72px (on profile page), 56px (on cards)
Card avatar:  56×56px, border-radius 16px (square-round)
Placeholder:  emoji on category-tint background
Fallback:     initials on #EBF5ED background, color #3D6B4F
```

---

### 7.13 Working Hours Display

```
Open now badge:    bg #EBF5ED, text #3D6B4F, "● Open now"
Closed badge:      bg #F0F0F0, text #6B7280, "Closed"
Hours text:        13px, #6B7280  "Mon–Fri 9am–6pm · Sat 10am–2pm"
```

---

### 7.14 Bottom Sheet / Modal

```
Background:    #FFFFFF
Border-radius: 24px 24px 0 0 (top corners only)
Shadow:        0 -4px 32px rgba(0,0,0,0.10)
Handle bar:
  Width:  40px, height: 4px
  Background: rgba(0,0,0,0.15)
  Border-radius: 2px
  Centered, margin-top: 12px, margin-bottom: 20px

Overlay backdrop:  rgba(0,0,0,0.40)
Animation:         slide up 240ms ease-out
```

---

### 7.15 Toast Notification

```
Background:    #1C1C1E
Text:          #FFFFFF, 13px, weight 500
Border-radius: 12px
Padding:       12px 18px
Shadow:        0 8px 24px rgba(0,0,0,0.25)
Position:      bottom center, above bottom nav (bottom: 90px)
Animation:     fade in 200ms + fade out 200ms at 2s
Max-width:     280px
```

---

### 7.16 Empty State

```
Layout:        centered column, padding: 40px 24px
Icon:          48px emoji
Title:         16px, weight 700, #1C1C1E, margin-top: 16px
Description:   14px, #6B7280, line-height 1.5, text-align: center
Button:        Primary or secondary button, margin-top: 20px
```

---

### 7.17 Skeleton Loaders

While content loads, show shimmer placeholders in card shape.

```
Background:   linear-gradient(90deg, #F0ECE6 25%, #E8E4DE 50%, #F0ECE6 75%)
Animation:    shimmer left-to-right, 1.4s infinite
Border-radius: match the component it replaces
```

---

### 7.18 Profile Completeness Bar

```
Track:         bg #F0F0F0, height 8px, border-radius 4px
Fill:          bg #3D6B4F, border-radius 4px
Label:         13px, weight 600, #3D6B4F  "75% complete"
Missing items: 12px, #8E8E93, tappable links → deep links to edit sections
```

---

### 7.19 OTP Input (new 2026-07-02)

Used on the WhatsApp OTP verification screen (§9.5b) and nowhere else in v1 — booking-session OTPs
(FEATURE_BUILD.md §27) are entered by the Pet Buddy on a different, simpler single-field pattern since
they're read aloud, not auto-filled from a message.

```
6 boxes, evenly spaced, gap: 8px
Box:
  Size:          44×52px
  Border:        1.5px solid rgba(0,0,0,0.12)
  Border-radius: 12px
  Font:          22px, weight 700, #1C1C1E, centered
  Background:    #FFFFFF

Focused box:
  Border:  1.5px solid #3D6B4F
  Shadow:  0 0 0 3px rgba(61,107,79,0.15)

Filled box (not focused):
  Border:  1.5px solid rgba(0,0,0,0.20)

Error state (all 6 boxes):
  Border:  1.5px solid #DC2626
  Animation: shake, 300ms, then clear back to empty
```

---

## 8. Hero Section Rules

The hero appears on the Home screen only. It sets the entire emotional tone.

```
Background:    linear-gradient(160deg, #3D6B4F → #7AAB86)
Top padding:   20px
Side padding:  24px
Bottom:        40px (extra room for curve overlap)

Curve at bottom:
  Pseudo-element, background: #F7F3ED (same as app bg)
  border-radius: 50% 50% 0 0 / 100% 100% 0 0
  Height: 80px, positioned -30px from bottom
  Creates the "scooped" transition from green hero to linen body

Decorative blob (top-right):
  Circle, 180×180px
  background: rgba(255,255,255,0.06)
  border-radius: 50%
  Positioned: top: -60px, right: -60px

Greeting:      13px, rgba(255,255,255,0.75), "Good morning, Name 🌿"
Title:         26px, weight 700, white, letter-spacing: -0.5px
Subtitle:      14px, rgba(255,255,255,0.70)
```

---

## 9. Screen-by-Screen Design Rules

### 9.1 Home Screen (`/`)

**Layout stack (top to bottom):**
```
Status bar (44px)
Hero section
  └─ Top nav: Logo left · Sign in button right
  └─ Greeting (if logged in) / Tagline (if not)
  └─ Hero title + subtitle
  └─ GPS Search button (white card)
  └─ Dot indicators (if carousel — optional)
  └─ Curve transition
Body (padding: 0 20px)
  └─ Section: "What do you need?" + Category pills (horizontal scroll)
  └─ Trust strip (green gradient)
  └─ Section: "Near you in [neighborhood]" + "See all →"
  └─ Pet Buddy cards (3 visible, see all navigates to /search)
  └─ Pet Buddy CTA banner (amber tint) — for logged-out or pet parents only
Bottom navigation
```

**Rules:**
- Hero is always the green gradient — no exceptions
- GPS button is always white card with green gradient icon
- First visible body section is categories — no ads, no banners between hero and categories
- Maximum 3 Pet Buddy cards on home — "See all" goes to search
- CTA banner only shows to users who are NOT Pet Buddies
- Trust strip numbers update from real DB counts (not hardcoded)

---

### 9.2 Search Screen (`/search`)

**Layout:**
```
Top bar (non-hero)
  Background: #F7F3ED (linen, no gradient)
  Search bar (tappable, not editable here — opens dedicated search)
  Filter row below: service chips (horizontal scroll)
  Sort dropdown: "Nearest · Rating · Reviews"

Results area (scroll)
  Location banner (if GPS not yet granted)
  Radius pills: [5 km] [10 km] [25 km] [50 km]
    Active pill: bg #3D6B4F, text white
    Inactive pill: bg #F0F0F0, text #6B7280
  Pet Buddy cards (same as home screen card)
  Pagination: "Load more" button, NOT infinite scroll

Empty state (if no results)
  Icon: 🔍
  Title: "No Pet Buddies found"
  CTA: "Try 25 km" button
```

**Filter chips:**
```
All (selected by default), Vet, Walker, Trainer, Pet Shop, Groomer
Selected chip:   bg #3D6B4F, text white, border-radius 50px
Unselected chip: bg #F0F0F0, text #555, border-radius 50px
Font:            13px, weight 500
Padding:         8px 16px
```

**Rules:**
- Search bar at top is always visible (sticky or in a top bar)
- Filter chips are horizontally scrollable, never wrap to second row
- Radius pills sit between filter chips and results, not in the filter row
- "Load more" loads next 20 results — no loading spinner inside cards
- Pet Buddy card on search page adds distance badge as most prominent badge

---

### 9.3 Map View (`/search/map`)

> **Fixed 2026-07-02** — this section previously said "Map fills full screen (Leaflet + OpenStreetMap)"
> and referenced CSS animation, both stale from before the 2026-06-19 web→React Native pivot. The app
> uses `react-native-maps` (FEATURE_BUILD.md §9), not Leaflet — this is the same class of drift as the
> screen-login.md/screen-legal.md fixes made during the SCREEN_INVENTORY.md pass, just missed there
> because this file wasn't re-checked at the time.

**Layout:**
```
Map fills full screen (react-native-maps — Google Maps provider on Android, Apple Maps on iOS)
Top overlay bar (absolute position):
  White card, border-radius 16px, shadow, padding 12px 16px
  Contains: "← List view" back toggle + filter chips
User location: pulsing blue dot (native marker with a scale/opacity loop animation, not CSS)
Pet Buddy pins: custom markers, color by service type
  Vet:      #3D6B4F (green)
  Walker:   #E8934A (amber)
  Trainer:  #5B6EE8 (blue)
  Shop:     #E8934A (amber)
  Groomer:  #9B6FE8 (purple)

Popup (on pin tap):
  White card, border-radius 16px, shadow
  Shows: avatar (40px), name, service, distance, "View Profile →" button
  Close: tap outside
```

**Rules:**
- No SSR/dynamic-import concept applies — `react-native-maps` renders natively on-device like any
  other component (this replaces a stale `dynamic(() => import(...), { ssr: false })` Next.js reference
  that was here before 2026-07-02)
- No map-tile attribution needed — Google Maps (Android) / Apple Maps (iOS) tiles, not OpenStreetMap;
  Nominatim/OSM is only used for reverse geocoding (FEATURE_BUILD.md §3), a separate concern from map
  rendering
- Coordinates sent to client are fuzzed ±300m (done in RPC)
- Map/List toggle is a top-left floating button, not in bottom nav

---

### 9.4 Pet Buddy Profile Page (`/profile/[slug]`)

**Layout:**
```
Back button (top-left) + Share button (top-right)
3-dot menu (top-right, for Block/Report)

Hero section (NOT green gradient — different from home):
  Background: #FFFFFF (white card feel)
  Pet Buddy photo: 88×88px circle, centered
  Name: 20px, weight 700, #1C1C1E
  Neighborhood · Distance: 13px, #6B7280
  Star rating + count
  Availability badge (Available / Busy / Closed / Open now)

Body (padding: 0 20px, scroll):
  Bio card (white, border-radius 20px)
  Services section (chips grid)
  Working hours row
  Gallery strip (horizontal scroll, 5 photos max)
  Credentials row (if set)
  Contact section (per visibility rules)
  Reviews section:
    Average + count header
    "Rate this Pet Buddy" button (if logged in + not owner)
    Review cards (newest first)

Floating contact button (bottom of screen, sticky):
  Only shown if at least one contact method is public/registered
  Amber background, "Contact Dr. Priya" text
```

**Rules:**
- Profile picture is circular on profile page, square-rounded on cards
- Distance shows only if user has GPS active; otherwise show neighborhood only
- "Rate this Pet Buddy" button hidden if viewer is the owner
- Reviews are paginated — show first 5, "Load more reviews" below
- **Blind-review window (added 2026-07-02, PROJECT_PLAN.md §8):** a review the current viewer just
  submitted but the other party hasn't reciprocated yet (or 14 days haven't passed) shows as "Your
  review is submitted — it'll appear once [the other party] has also reviewed, or in [N] days" rather
  than the review text itself, on both profiles, until it publishes
- Gallery uses horizontal scroll with page indicators (dots)
- Contact section always shows at bottom — never buried mid-page
- `noindex` meta on pet parent profiles (applied at page level, not design)

---

### 9.5 Auth Screens (`/auth/login`, `/auth/signup`)

> **Redesigned 2026-07-02.** Signup now leads with the form (mobile number needs to be collected for
> WhatsApp OTP verification — see §9.5b below), so Google moved from primary to secondary on **signup**.
> **Login keeps Google as a fast-path option too** (no new fields to collect on login), but the same
> "form first, Google below" layout is used on both screens for visual consistency — see the rule below
> for the one exception on login (returning users may prefer the one-tap path, so login's copy nudges
> toward Google slightly more than signup's does, layout is otherwise identical).

**Layout:**
```
Background: #F7F3ED (linen)
Top:
  🐾 Petlife logo centered (logo icon 44×44, text below)
  "Find trusted care for your pet" tagline (14px, #6B7280)

Card (white, border-radius 24px, padding 28px, shadow: 0 4px 32px rgba(0,0,0,0.08)):
  Form fields (PRIMARY — top of card):
    Full name (signup only)
    Mobile number (signup only — required for WhatsApp OTP, §9.5b)
    Email input (label + field)
    Password input (label + field + show/hide toggle)
    Confirm password (signup only)
    Consent checkboxes (signup only, see below)
    Submit button (full-width, green — border-radius 14px — "Create Account" / "Sign in")

  Divider: thin line with "or" centered in #8E8E93

  Google button (SECONDARY — below the divider, full-width):
    White background, border 1.5px solid rgba(0,0,0,0.12)
    Google G logo + "Continue with Google"
    Border-radius: 14px
    Padding: 14px
    Font: 15px, weight 600, #1C1C1E

  Login only: "Forgot password?" link right-aligned, 13px #3D6B4F
  Below card: "Already have an account? Sign in" / "Don't have an account? Sign up" (centered, 13px)

Footer:
  "By continuing you agree to our Terms & Privacy Policy"
  13px, #8E8E93, centered
  Links in #3D6B4F
```

**Consent checkboxes (signup only, stacked above the submit button):**
```
☐ I agree to the Terms & Conditions       ← required, links to /terms
☐ I agree to the Privacy Policy           ← required, links to /privacy
☐ I consent to receive service-related SMS, email, and push notifications   ← optional

Checkbox: 20×20px, border-radius 5px, border 1.5px solid rgba(0,0,0,0.20)
Checked:  bg #3D6B4F, white checkmark
Label:    13px, #1C1C1E, links within the label in #3D6B4F (no underline)
Submit button disabled until both required checkboxes are checked
```

**Rules:**
- **Google is now SECONDARY on both screens** — this reverses the original "Google primary" rule. The
  reason is signup-specific (mobile number must be collected for WhatsApp OTP verification, so a
  zero-field Google shortcut would skip that step), but the same layout is used on login too so the two
  screens don't visually contradict each other.
- Google button uses actual Google G SVG (not emoji) for recognition
- "Sign up" vs "Sign in" — heading text, field set, and submit label all change; card structure is otherwise identical
- Never show password strength meter — not needed for pet care app
- Form fields use border-radius 14px, not the pill style
- Error messages appear below the field in `#DC2626`, 12px
- No role selector on this screen — role selection is its own screen, shown after mobile verification (§9.6 Step 1)
- Bank details are never collected anywhere in auth or onboarding — no payment gateway exists in v1

---

### 9.5b OTP Verification Screen (`/auth/verify-otp`)

> New 2026-07-02. Full flow spec: design/screen-otp-verification.md.

**Layout:**
```
Background: #F7F3ED (linen)
Back arrow (top-left) → back to signup form

Content (centered, padding 24px):
  💬 icon (48px, WhatsApp-associated but not the literal WhatsApp logo — avoid trademark issues)
  Title: "Verify your number" (22px, weight 700, centered)
  Subtitle: "We sent a code to +91 98765 43210 on WhatsApp" (14px, #6B7280, centered)

  OTP input — 6 separate boxes, not one text field (see §7.19):
  [ 4 ] [ 8 ] [ 2 ] [ 9 ] [ 1 ] [ 3 ]

  "Resend code in 0:28" (13px, #8E8E93, centered) → becomes
  "Didn't get it? Resend" (13px link, #3D6B4F, centered) once the 30s cooldown ends

Bottom:
  Primary button: "Verify" (disabled until all 6 digits entered)
```

**Rules:**
- Auto-advance focus to the next box as each digit is typed; auto-submit when the 6th digit is entered
  (don't make the user also tap Verify)
- Wrong code: shake animation on the 6 boxes + red border, error text below: "Incorrect code. Try again."
- After 5 wrong attempts: boxes disabled, message: "Too many attempts. Request a new code." — only the
  Resend link remains active (matches the 5-attempt lockout enforced server-side in `verify_signup_otp`)
- This screen is skippable only in the sense that nothing in the app currently gates on
  `is_phone_verified` (see PROJECT_PLAN.md §5.1 interim fallback) — but the screen itself has no visible
  "Skip" link; a user who can't complete it should back out to the signup form, not be invited to bypass it

---

### 9.6 Onboarding Wizard (`/onboarding`)

**Layout:**
```
Background: #F7F3ED
Top bar:
  Progress bar (thin, green fill, shows step X of N)
  "X of Y" label right-aligned, 12px, #8E8E93
  Back arrow left (hidden on step 1)

Content area (centered, padding 24px):
  Step icon (emoji, 48px) centered
  Step title: 22px, weight 700, #1C1C1E, centered
  Step description: 14px, #6B7280, centered, margin-bottom 24px
  Step-specific content (varies by step)

Bottom area:
  Primary button: "Continue →" or "Done ✓"
  Skip link (if step is optional): 13px, #8E8E93, centered, "Skip for now"
```

**Progress bar:**
```
Track:   full width, height 4px, bg #F0F0F0, border-radius 2px
Fill:    bg #3D6B4F, border-radius 2px
Animates left-to-right as steps complete
```

**Role selection step (Step 1 — "Choose Role"), redesigned 2026-07-02:**
```
Three tap cards, stacked vertically (not side-by-side — three cards at 50% width each would be
cramped; a 375px-first design reads better as a vertical stack here):
  Card:         100% width, border-radius 20px, padding 18px, flex row (icon left, text right)
  Unselected:   bg white, border 2px solid transparent, shadow: 0 2px 16px rgba(0,0,0,0.06)
  Selected:     bg white, border 2px solid #3D6B4F, shadow: 0 2px 16px rgba(0,0,0,0.06)
  Icon:         36px emoji, left-aligned
  Title:        15px, weight 700, #1C1C1E
  Subtitle:     12px, #8E8E93, margin-top 2px

  🐕  I'm a Pet Parent
      Looking for trusted care near me

  🏆  I'm a Pet Buddy
      I offer vet, walking, grooming, or other pet services

  🔄  Both
      I want to book services AND offer my own — fully supported, not a "coming soon" option
```
Single-select in v1 UI terms — tapping "Both" sets `is_pet_parent = true AND is_provider = true`
directly (not "select two cards"); tapping "Pet Parent" or "Pet Buddy" sets only that one flag.
`active_role` is set to whichever was tapped. A user who picked one can always add the other later from
Settings ("Also become a Pet Buddy" — FEATURE_BUILD.md §25), so this choice is never a dead end.

**Rules:**
- Only one primary action per step — never two prominent buttons
- Skip is always text, never a button
- GPS step: show explanation text BEFORE triggering the OS location permission dialog (this section
  previously said "browser permission API" — stale from before the 2026-06-19 pivot; the actual
  mechanism is `expo-location`'s `requestForegroundPermissionsAsync()`, FEATURE_BUILD.md §3)
- Working hours step: show a simple weekly grid — day name + toggle + time pickers
- Final "Done" step shows profile completeness % with green circle progress indicator

---

### 9.7 Dashboard (`/dashboard`)

**Layout:**
```
Top bar:
  Background: #F7F3ED
  "Good morning, Name" or "Hi, Name 👋" — 18px, weight 700
  Notification bell top-right (with red badge if unread)

Scrollable body (padding: 0 20px 100px):

  Profile completeness bar (if < 100%):
    White card, border-radius 20px, padding 16px
    "Your profile is 65% complete"
    Green progress bar
    "Missing: Working hours · Add credentials" (tappable items)

  Section: "Saved Pet Buddies" (pet parent) OR "Your Profile" (Pet Buddy)
  Section: "Recent Activity" (ratings received, contact requests)

  For Pet Buddies:
    Quick stats row (white card):
      Views this week · Contacts received · Avg rating
      3-column mini stats with green numbers

Bottom navigation
```

**Rules:**
- Dashboard is always white linen background — never hero gradient
- Notification bell shows number badge (red circle, white number) if unread > 0
- Profile completeness card disappears at 100% (no "Complete!" message lingering)
- Saved Pet Buddies section shows a horizontal scroll of 3 cards max, "See all" link

---

### 9.8 Notifications (`/notifications`)

**Layout:**
```
Top bar: "Notifications" title (18px, weight 700) + "Mark all read" right link
Body (scroll):
  Notification rows (not cards — flat list with dividers)
    Left: notification icon (colored circle with emoji inside, 40px)
    Right:
      Title: 14px, weight 600, #1C1C1E (if unread) / weight 400 (if read)
      Body:  13px, #6B7280
      Time:  12px, #8E8E93, right-aligned

Unread row background: rgba(61,107,79,0.05) — very subtle green tint
Read row background:   #F7F3ED (same as page — no distinction)

Divider: 1px solid rgba(0,0,0,0.05), starts after the icon (not full-width)
```

**Notification icon colors:**
```
new_rating:          bg #EBF5ED, icon ⭐
contact_request:     bg #FEF3E8, icon 📞
review_reply:        bg #EEF2FE, icon 💬
```

---

### 9.9 Settings Screens (`/settings/*`)

**Layout:**
```
Top bar: "Settings" title + back arrow
Body:
  Section groups (white cards, border-radius 20px):
    Each section is one white card with grouped rows inside
    Row: 16px padding, min-height 52px
    Row dividers: 1px solid rgba(0,0,0,0.05), indented 16px left

  Row layout:
    Left: label (14px, weight 500, #1C1C1E) + optional sub-label (12px, #8E8E93)
    Right: toggle / chevron / value

Dangerous zone section:
  "Danger Zone" label in #DC2626 (12px, weight 600)
  Rows in this section: text color #DC2626
  "Delete account" has a red border card, not part of the normal group
```

**Toggle switches:**
```
Track (off):  bg #E5E5EA, width 50px, height 28px, border-radius 14px
Track (on):   bg #3D6B4F
Thumb:        white circle, 24px, box-shadow: 0 2px 4px rgba(0,0,0,0.20)
Animation:    thumb slides in 180ms
```

---

### 9.10 Legal Pages (`/terms`, `/privacy`, `/about`, `/contact`)

**Layout:**
```
Top bar: page title + back arrow
Body (padding: 24px, scroll):
  Content is plain text, no cards
  H2: 16px, weight 700, #1C1C1E, margin-top: 24px
  H3: 14px, weight 600, #1C1C1E, margin-top: 16px
  Paragraph: 14px, #6B7280, line-height: 1.6
  Links: #3D6B4F (no underline)
```

**Rules:**
- Legal pages use SSG — no loading state
- No bottom navigation on legal pages — back arrow only
- Footer with "© 2026 Petlife" + links to all legal pages shown at bottom

---

### 9.11 Profile Edit (`/profile/edit`)

**Layout:**
```
Top bar: "Edit Profile" + Save button (green text, right-aligned)
Body (scroll, padding: 0 20px):
  Avatar section (centered, tap to change):
    88px circle + green camera icon overlay (bottom-right)
    "Change photo" text below

  Form sections (white cards, border-radius 20px, padding 20px):
    Each section = one white card
    Sections: Basic Info · Location · Contact · Services/Pets · Visibility

  Within each card:
    Section sub-label: 12px, weight 600, #8E8E93, uppercase, letter-spacing: 0.5px
    Input fields stacked with 12px gap
    "Save" triggers full-page save with loading state on button
```

---

### 9.12 404 Page

```
Background: #F7F3ED
Content centered vertically:
  Emoji: 🐾 (80px)
  Title: "This page doesn't exist" (20px, weight 700)
  Sub:   "The link may be broken or the page may have been removed." (14px, #6B7280)
  Button: "Go home" (Green primary pill)
```

---

## 10. Motion & Animation Rules

**Keep motion subtle and purposeful. Nothing bouncy or flashy.**

```
Default transition:     200ms ease-out
Buttons (tap):          scale(0.97) + opacity 0.88, 120ms
Bottom sheet open:      slide-up 240ms ease-out
Bottom sheet close:     slide-down 200ms ease-in
Toast appear:           fade-in 200ms
Toast disappear:        fade-out 200ms at 2500ms
Nav tab switch:         instant (no animation — feels sluggish on mobile otherwise)
Card hover/focus:       subtle scale(1.01), 200ms
Heart toggle:           scale pop: 1.0 → 1.25 → 1.0, 300ms (only the filled state)
Progress bar fill:      width animates 400ms ease-out on mount
Skeleton shimmer:       1.4s infinite linear
```

**Rule: Never animate layout shifts.** Do not animate height, width, or position changes — only opacity, transform, and color.

---

## 11. Icon Rules

Use emoji icons throughout v1 — they're free, universally readable, and feel friendly.

**Do not use icon libraries (Heroicons, Lucide, etc.) in v1.** Every icon is an emoji.

```
Home:           🏡
Search:         🔍
Profile:        👤
Activity/Bell:  🔔
GPS pin:        📍
Star:           ★ (HTML entity — not emoji, for inline rating stars)
Heart empty:    ♡ (HTML entity)
Heart filled:   ♥ (HTML entity, color #E8934A)
Share:          📤
Verified:       ✓ (text character)
Complete:       ✓ (text character)
Close:          × (text character)
Back:           ← (text character)
Forward/Arrow:  › (text character, not →)
Settings:       ⚙️
Block:          🚫
Report:         🚩
Delete:         🗑️
Camera:         📷
```

---

## 12. Logo

```
Icon:          🐾 (paw print emoji)
Container:     34×34px, border-radius 10px
Background:    rgba(255,255,255,0.18) on hero (frosted)
               #EBF5ED on white backgrounds

Text:          "Petlife" — 20px, weight 700, letter-spacing: -0.3px
Text color:    #FFFFFF on hero / #1C1C1E on light backgrounds

Combined:      icon + 8px gap + text, horizontal
```

---

## 13. Tailwind Config Mapping

Map all design tokens to Tailwind custom values. Reference this when writing components.

```js
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      primary:      '#3D6B4F',
      'primary-mid':     '#4A7C59',
      'primary-light':   '#5C9068',
      'primary-pale':    '#7AAB86',
      'primary-surface': '#EBF5ED',
      accent:       '#E8934A',
      'accent-surface':  '#FEF3E8',
      bg:           '#F7F3ED',
      surface:      '#FFFFFF',
      text: {
        primary:    '#1C1C1E',
        secondary:  '#8E8E93',
        tertiary:   '#6B7280',
        link:       '#3D6B4F',
      },
      cat: {
        vet:        '#EBF5ED',
        walker:     '#FEF3E8',
        trainer:    '#EEF2FE',
        food:       '#FFF3E8',
        groomer:    '#F5EEFE',
        all:        '#F0F0F0',
      },
    },
    borderRadius: {
      'sm':   '10px',
      'md':   '14px',
      'lg':   '16px',
      'xl':   '18px',
      '2xl':  '20px',
      '3xl':  '24px',
      '4xl':  '44px',
      'pill': '50px',
    },
    boxShadow: {
      'card':     '0 2px 16px rgba(0,0,0,0.06)',
      'elevated': '0 8px 24px rgba(0,0,0,0.12)',
      'modal':    '0 -4px 32px rgba(0,0,0,0.10)',
      'fab':      '0 6px 20px rgba(61,107,79,0.30)',
      'input':    '0 0 0 3px rgba(61,107,79,0.15)',
    },
    fontFamily: {
      sans: ['-apple-system', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
    },
  }
}
```

---

## 14. CSS Variables (globals.css)

```css
:root {
  /* Brand */
  --color-primary:           #3D6B4F;
  --color-primary-mid:       #4A7C59;
  --color-primary-light:     #5C9068;
  --color-primary-pale:      #7AAB86;
  --color-primary-surface:   #EBF5ED;
  --color-accent:            #E8934A;
  --color-accent-surface:    #FEF3E8;

  /* Backgrounds */
  --color-bg:                #F7F3ED;
  --color-surface:           #FFFFFF;

  /* Text */
  --color-text-primary:      #1C1C1E;
  --color-text-secondary:    #8E8E93;
  --color-text-tertiary:     #6B7280;
  --color-text-link:         #3D6B4F;

  /* Status */
  --color-available-bg:      #EBF5ED;
  --color-available-text:    #3D6B4F;
  --color-busy-bg:           #FEF3E8;
  --color-busy-text:         #E8934A;
  --color-error:             #DC2626;
  --color-error-bg:          #FEF2F2;

  /* Borders */
  --color-border:            rgba(0,0,0,0.07);
  --color-border-strong:     rgba(0,0,0,0.12);
  --color-divider:           rgba(0,0,0,0.05);
}
```

---

## 15. Don'ts — Never Do These

- ❌ Never use a white background as the main app background — always `#F7F3ED`
- ❌ Never use sharp corners (border-radius < 10px) on any user-facing element
- ❌ Never use pure black text — use `#1C1C1E`
- ❌ Never use blue as a link color — use `#3D6B4F`
- ❌ Never underline links — color is the affordance
- ❌ Never use all-caps text except for settings section labels (12px, 0.5px spacing)
- ❌ Never place two primary amber buttons on the same screen
- ❌ Never use more than 3 font sizes on a single card
- ❌ Never animate layout shifts (height/width changes)
- ❌ Never use a loading spinner inside a card — use skeleton loaders
- ❌ Never use the hero gradient outside of the home screen hero
- ❌ Never use icon-only navigation without text labels
- ❌ Never make a tap target smaller than 44×44px
- ❌ Never import Leaflet without `{ ssr: false }` dynamic import

---

## 16. Change Log

| Date | Change |
|---|---|
| 2026-06-19 | DESIGN.md created — full Garden Walk design language documented |
| 2026-07-02 | Registration-flow redesign: §9.5 Auth Screens rewritten (Google demoted from primary to secondary, consent checkboxes added, mobile number field added); new §9.5b OTP Verification screen; new §7.19 OTP Input component; §7.10 Bottom Navigation redesigned from a single fixed 4-tab bar to role-scoped 5-tab bars (Pet Parent vs Provider mode); §9.6 role-selection step redesigned from 2 side-by-side cards to 3 stacked cards (Pet Parent / Service Provider / Both — "Both" now fully v1-supported, not future-only). All still Garden Walk — no new colors, radii, or type scale introduced. |
| 2026-07-02 | **BRD reconciliation** (same day, third session): renamed "Provider"/"Service Provider" to **Pet Buddy** throughout (§7.3, §7.8, §7.10, §9.1-9.4, §9.6-9.7 — component/section names and all user-facing copy; `is_provider` etc. unchanged, see CONVENTIONS.md §0). Also fixed real drift found in the process: §9.3 Map View still described Leaflet/OpenStreetMap tiles, a Next.js `dynamic(..., {ssr:false})` import, and OSM attribution — all stale from before the 2026-06-19 pivot and missed by every prior audit including the SCREEN_INVENTORY.md pass; §9.6 still said "browser permission API" for the GPS step. Added the blind-review-window note to §9.4's Reviews section (PROJECT_PLAN.md §8). |

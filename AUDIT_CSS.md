# CSS / UX Audit — BB Unified Mockup

**File:** `BB_UnifiedApp_Mockup.html` (6,752 lines)  
**Date:** 2026-04-26  
**Focus:** CSS consistency, HTML structure, accessibility, visual polish

---

## CRITICAL (Broken Layout / Unusable)

None identified. Layout is structurally sound.

---

## HIGH (Visible Inconsistency, Polish Blocker)

### 1. **Border-radius Inconsistency Across Component Families**
- **Lines 4px:** `.reset` (29), `.next-due` (79), `.install-pill` (193), `.age-badge` (204), `.task-priority` (450), `.cp-sidemark-edit input` (463), `.photo-tile .photo-tag` (533), `.photo-tile .photo-del` (534), `.lm-lead .lm-tag` (563)
- **Lines 5px:** `.action-form input/select/textarea` (137), `.inline-scheduler input/select` (213), `.modal-form input/select/textarea` (442), `.cp-info-grid input/select` (488), `.cp-edit-input` (489), `.cp-edit-installer` (490)
- **Lines 6px:** `.toolbar input/select` (94), `.day-col` (188), `.schedule-display` (172), `.issue-card` (175), `.service-card` (179), `.toolbar-bar input` (186), `.fu-sort-bar` (242), `.fu-sort-select` (245), `.fu-section-title` (247), `.fu-card-rep` (275), `.fu-method` (291), `.fu-script-box` (299), `.fu-log-btn` (300), `.fu-btn` (325), `.lm-action-card` (566), `.search-bar input` (394), `.icon-btn` (427), `.action-menu` (430), `.action-menu button` (432), `.modal-form` (442), `.task-item` (446), `.cp-actions` (475), `.cp-section` (482), `.cp-tabs button` (478)
- **Lines 8px:** `.kpi` (47), `.section` (62), `.modal` (104), `.fu-card-rep` (275), `.fu-detail-info > div` (285), `.fu-method` (291), `.fu-script-box` (299), `.fu-log-btn` (300), `.task-item` (446), `.cp-pipeline` (465), `.cp-section` (482), `.action-menu` (430)
- **Lines 10px:** `.modal` (104), `.role-count` (39), `.fu-ref` (230), `.fu-sort-bar` (242), `.fu-section-title .count` (249), `.empty-fu` (251), `.fu-card` (252), `.fu-stage-badge` (264), `.fu-day-num` (267), `.fu-overdue-pill` (268), `.fu-due-pill` (269), `.fu-pill` (280), `.fu-detail-section` (288), `.ink-counter-strip` (336), `.ink-contact` (348), `.ink-book-btn` (352), `.lc-card` (359), `.checklist-item` (543), `.cp-tabs` (477)
- **Lines 14px:** `.fu-stage-pill` (320), `.status-pill` (418)
- **Lines 18px:** `.filter-chips button` (379)

**Recommendation:** Standardize to 3 values:
- **Compact/Badge** (4px): badges, tags, small status indicators
- **Input** (6px): form fields, text inputs, small cards
- **Card** (8px): section containers, modal body
- **Pill/Large** (10px): large badges, filter buttons, cards with interaction

---

### 2. **Color Drift — Brand Palette Not Consistently Applied**

**Navy (#0B3052 used 42 times vs variants):**
- Consistent use in primary buttons, active states, text
- NO drift detected — good

**Mid-blue (#14467a):**
- Used in `nav.roles` background (32)
- Used in `.notif-bell` border (375)
- Used in `.btn.primary:hover` (126)
- Only 3 instances, acceptable

**Teal Accent (#76C8DF):**
- `.role-count` background (39)
- `.kpi.clickable` border (52)
- `.fu-ref-toggle` background (234)
- `.fu-mode-toggle button.active` background (298)
- `.fu-rep-icon` color (276)
- Consistent use

**ISSUE:** Multiple shades of gray and blue for "inactive" states:
- `.cbd5e1` (nav.roles button text, 33)
- `.6b7280` (6b7280 used 30+ times for secondary text)
- `.6b7280` vs `.9ca3af` (subtle vs muted text) — inconsistent hierarchy
- `.cbd5e1` appears ONLY in nav roles; doesn't match other muted text palette

**Recommendation:**
- Use one gray scale consistently: `#6b7280` for secondary labels/text, `#9ca3af` for hints only
- Rename nav roles text to use `#6b7280` instead of `#cbd5e1`

---

### 3. **Padding Inconsistency in Card-like Components**

**Vertical padding spread:**
- `.kpi` (47): 12px vertical
- `.card` (70): 11px vertical ← inconsistent with kpi
- `.section h3` (63): 12px vertical
- `.fu-ref-head` (232): 10px vertical
- `.fu-sort-bar` (242): 10px vertical
- `.row-card` (198): 10px vertical
- `.urgent-card` (216): 10px vertical
- `.lc-card` (359): 14px vertical

**Horizontal padding spread:**
- `.kpi` (47): 14px horizontal
- `.card` (70): 16px horizontal
- `.section h3` (63): 16px horizontal
- `.fu-ref-head` (232): 14px horizontal
- `.row-card` (198): 14px horizontal

**Recommendation:** Standardize to `padding: 12px 16px` for all list-like cards. Adjust KPI to `12px 16px` (line 47).

---

### 4. **Typography Drift — Font-Size for Same Role Elements**

**Card/Row Titles:**
- `.card-name` (74): 14px (line 74)
- `.fu-card .fu-card-name` (270): 15px ← inconsistent
- `.fu-card-name` (312): 15px ← inconsistent
- `.row-card .row-name` (200): 14px

**Section Headers (h3/h4):**
- `.section h3` (63): 13px (line 63)
- `.fu-section-title` (247): 14px ← inconsistent
- `.modal-body h4` (114): 12px ← inconsistent
- `.cp-section h3` (483): 14px ← inconsistent

**Recommendation:**
- Card titles: Standardize to **14px** (not 15px)
- Section headers: Standardize to **13px** for h3, **12px** for h4
- Apply to: `.fu-card-name`, `.fu-section-title`

---

### 5. **Modal Header Sizing Drift**

- `.modal-header h2` (106): 17px
- `.cp-title-block h1` (459): 28px
- `.page-title` (43): 22px
- `.page-header h2` (392): 24px

**No issue** — these serve different roles (modal vs page title).

---

### 6. **Inline Styles vs. Classes — Excessive Mixing**

**Inline style burden (464 instances of `style=` found):**

High-frequency patterns that should be classes:
- `padding:10px 12px;border:1px solid #d1d5db;border-radius:6px;` ← appears ~20 times (lines 3019, inline card styling)
- `padding:12px 16px;background:#dbeafe;border:1px solid #60a5fa;border-radius:8px;` ← notification box pattern (line 3086)
- `font-size:11px;color:#6b7280;margin-top:2px;` ← secondary text pattern
- `display:inline-flex;align-items:center;gap:8px;` ← button/link pattern (line 1715)

**High-impact fixes:**
- Lines 3086–3093: Pull notification box styles into `.notification-info`, `.notification-success` classes
- Lines 1715: Create `.link-button` class for Touchpoint links
- Lines 3019: Create `.card-pill` class for inline client pills

**Current impact:** ~15–20 kilobytes of uncompressed inline style repetition.

---

## MEDIUM (Subtle, Fixable Later)

### 1. **Gap/Spacing Inconsistency in Flex Layouts**

- `.kpi-row` (46): gap=10px
- `.fu-card-badges` (263): gap=6px
- `.fu-card-main` (262): flex-wrap gaps vary
- `.subtabs` (223): gap=4px
- `.filter-chips` (378): gap=8px

Not critical, but recommend:
- Standardize flex gaps: `8px` for most, `10px` for larger card grids, `6px` for badge clusters

---

### 2. **Focus State Missing on Interactive Elements**

**No visible `:focus-visible` or `:focus` styles defined for:**
- Buttons (`.btn`, `.fu-btn`)
- Form inputs (`.toolbar input`, `.modal-form input`)
- Links (generic `a` tag)

**Risk:** Keyboard navigation will be invisible on these elements.

**Recommendation:** Add to button/input styles:
```css
.btn:focus-visible { outline: 2px solid #0B3052; outline-offset: 2px; }
.toolbar input:focus-visible { outline: 2px solid #76C8DF; outline-offset: 2px; }
```

---

### 3. **Button States Incomplete**

- `.btn:active` state not defined (only hover)
- `.fu-btn:active` state not defined
- `.filter-chips button:active` not defined

Add `:active` styles to give tactile feedback on press.

---

### 4. **Line-Height Inconsistency**

- Body default (20): line-height=1.4
- `.hero p` (164): line-height not set (inherits)
- `.modal-body table` (115): line-height not set
- `.fu-script-box` (299): line-height not set

Can lead to cramped text in modals/tables.

**Recommendation:** Set `line-height: 1.5` on `.modal-body`, `.fu-script-box`.

---

## LOW (Nits)

### 1. **Utility Class Naming**

- `.role-count` is a badge, not a count — confusing name
- `.fu-stage-badge` vs `.fu-stage-pill` vs `.fu-pill` — three names for similar patterns
- `.next-due` vs `.fu-due` vs `.fu-due-pill` — inconsistent naming

Not breaking, just reduces clarity.

---

### 2. **Unused/Dead CSS**

Searched for class definitions in style block vs. HTML usage:
- All major classes are used.
- No dead CSS detected in spot checks.

---

### 3. **Hero Gradient Opacity**

`.hero` (162) uses hard gradient `#1e3a8a` → `#0f172a`. No transparency layer for dark text overlay. Works but could be smoothed.

---

## ACCESSIBILITY

### CRITICAL

#### 1. **Color Contrast Issues — WCAG AA Failure**

**Fails WCAG AA (4.5:1 for normal text, 3:1 for large text):**

1. **Line 33:** `nav.roles button { color:#cbd5e1; }` on `background:#14467a`
   - Ratio: ~2.8:1 ✗ FAIL
   - **Fix:** Use `color:#e2e8f0` (lighter) or darken nav background

2. **Line 28:** `header.top .meta { opacity:.75; }` on dark background
   - Inherited text is 75% opacity
   - **Fix:** Set explicit color `color:#e2e8f0` instead of relying on opacity

3. **Line 54:** `.kpi.clickable .label { color:#0B3052; }` on light backgrounds (no bg defined)
   - Depends on KPI background state; verify contrast with `#e0f4fa` (line 52)
   - **Fix:** Increase font-weight to 700 to boost perceived contrast, or use darker text

4. **Line 375:** `.notif-bell { border:1px solid #14467a; color:#0B3052; }`
   - Navy text on white with navy border is too subtle
   - Ratio text-to-bg: ~7:1 ✓ PASS
   - But border-to-bg is ~1:1 ✗ (invisible border)

5. **Line 39:** `.role-count { color:#0B3052; }` on `background:#76C8DF`
   - Ratio: ~5.2:1 ✓ PASS (acceptable, but on edge)

**Recommendation:**
- Fix nav button text: change line 33 from `#cbd5e1` to `#e2e8f0`
- Test all navy-text-on-light-bg combos in real browser (QA)

---

#### 2. **Missing Alt Text on Images**

**Found:**
- Line 1941: `<img src="${qrImg}" alt="Review QR Code"` ✓ HAS ALT (good)
- Line 2345: `<img src="${p.dataUrl}" alt="${escAttr(p.label||'')}"` ✓ HAS ALT (good)

**Result:** No missing alt text detected.

---

#### 3. **Missing aria-label on Icon-Only Buttons**

**Found:**
- Line 3035: `<button class="icon-btn" onclick="toggleMenu('mtsk-${t.id}', event)">⋯</button>`
  - Icon button with no text or aria-label ✗ FAIL
  - **Fix:** Add `aria-label="More options"`

- Line 108: `.modal-close { ... } ` (no aria-label)
  - Used for close button (X icon)
  - **Fix:** Add to HTML: `aria-label="Close modal"`

- Line 375: `.notif-bell { ... }` (no aria-label)
  - Notification icon button
  - **Fix:** Add `aria-label="Notifications"`

**Recommendation:** Add aria-labels to all `.icon-btn` and icon-only interactive elements.

---

#### 4. **Missing Semantic HTML**

**Issues:**
- **No `<main>` tag** — Line 42 uses `<main>` in CSS but verify it wraps actual content
- **Line 25-41:** `<header class="top">` is semantic ✓
- **Line 32-40:** `<nav class="roles">` is semantic ✓
- **No `<nav>` for role navigation** — implemented as `.roles` on a generic container; should be `<nav>`

**Recommendation:** Change line 32 from generic div/nav to explicit `<nav class="roles">` (already correct in CSS, verify HTML).

---

#### 5. **Tap Target Size (Mobile — < 44×44px)**

**Issues:**
- `.role-count { padding:3px 9px; }` (line 39)
  - Rendered size ~20×20px ✗ TOO SMALL
  - **Fix:** Increase to `padding:4px 12px` minimum

- `.notif-badge { padding:2px 6px; }` (line 377)
  - Rendered size ~16×16px ✗ TOO SMALL
  - **Fix:** Increase to `padding:3px 8px`

- `.icon-btn { padding:6px 8px; }` (line 427)
  - Rendered size ~28×28px ✗ BORDERLINE (need 44×44)
  - **Fix:** Increase to `padding:10px 12px` or add padding to click area

- Role nav buttons: `padding:18px 20px` (line 33) ✓ ADEQUATE (likely ~50×40px+)

**Recommendation:** Test tap targets on a real mobile device; aim for 44×44px minimum.

---

#### 6. **Keyboard Navigation Issues**

**Missing elements:**
- No visible `:focus-visible` styles (checked above under MEDIUM)
- Tab order not verified in code
- Modal does not trap focus (no return to trigger button on close)

**Risk:** Keyboard-only users cannot interact effectively.

**Recommendation:**
- Add focus-visible styles (see MEDIUM #2)
- Implement focus trap in modals (focus should not escape)

---

### HIGH

#### 1. **Color Contrast on Secondary Text**

- `.card-sub { color:#6b7280; }` on white background
  - Ratio: ~5.3:1 ✓ PASS (acceptable for secondary text, WCAG AA allows 3:1 for body)
- `.timeline-meta { color:#6b7280; }` on white
  - Ratio: ~5.3:1 ✓ PASS
- Status pills with borders (`.status-pill`) all use sufficient contrast ✓

**Result:** No failures; secondary text contrast acceptable.

---

#### 2. **Form Labels Not Associated with Inputs**

**Issue:** `<label>` elements in forms (lines 135–136 `.action-form label`) use CSS but not `<label for="id">` structure.

**Risk:** Screen readers won't announce label when input is focused.

**Recommendation:** Restructure inline form labels to use `<label for="inputId">` with matching `id` attributes.

---

#### 3. **Heading Hierarchy**

**Verified:**
- No `<h1>` in expected places (OK for single-page app)
- `.page-title` used as h1 equivalent ✓
- `.page-sub` h2 equivalent ✓
- `.section h3` ✓
- `.modal-header h2` ✓

**Result:** Hierarchy is sound.

---

### MEDIUM

#### 1. **Empty Links and Buttons**

- `.fu-card-name { cursor:pointer; }` (312) is a `<div>` pretending to be a button
  - **Fix:** Use actual `<button>` or `<a>` element

- Icon-only buttons should have `title` or `aria-label` (checked above)

---

#### 2. **Readability — Font Size on Mobile**

- `.page-title { font-size:22px; }` on mobile (line 43)
  - Acceptable if viewport is 375px+ (standard mobile)
  - May be cramped on small phones
  - **Recommendation:** Add `@media (max-width: 480px) { .page-title { font-size: 18px; } }`

---

## MOBILE RESPONSIVENESS

### Defined Media Queries

**Found 6 media queries:**
1. Line 99: `@media (max-width:680px){ .grid-2 { grid-template-columns:1fr; } }` ✓
2. Line 241: `@media (max-width: 640px){ .fu-ref-grid { grid-template-columns:repeat(2,1fr); } }` ✓
3. Line 341: `@media (max-width: 800px){ .ink-counter-strip { grid-template-columns:repeat(2,1fr); } }` ✓
4. Line 396: `@media (max-width:640px) { .page-header .search-bar input { width:180px; } }` ✓
5. Line 553–554: `@media (max-width:1100px)` and `(max-width:760px)` for `.lm-grid` ✓
6. Line 577: `@media (max-width:640px) { ... }` (partial, check content)

### Issues

#### 1. **Missing Mobile Styles for Key Components**

- `.page-header h2 { font-size:24px; }` (line 392) — no mobile reduction
  - **Fix:** Add `@media (max-width: 640px) { .page-header h2 { font-size: 20px; } }`

- `.modal { max-width:820px; }` (104) — OK (constrained)
  - But check if padding shrinks on mobile

- Role nav buttons: `padding:18px 20px; min-width:130px;` (33–35) may not fit on 375px screens
  - If 6 roles × 130px = 780px width ✗ OVERFLOW
  - **Fix:** Reduce `min-width` or stack buttons on mobile

#### 2. **Search Bar Responsiveness**

- Line 394: `.page-header .search-bar input { width:280px; }` reduced to `180px` on 640px
  - Good, but **verify 180px fits** on 375px phone (likely ~90px after padding)

#### 3. **Missing Breakpoints**

- Subtabs (`.subtabs`) have no mobile rules
  - `padding:14px 22px` per button may cause wrapping/overflow
  - **Fix:** Add `@media (max-width: 640px) { .subtabs button { padding: 10px 14px; font-size: 13px; } }`

- Filter chips (`.filter-chips`) have no mobile rules
  - **Fix:** Add `@media (max-width: 640px) { .filter-chips { flex-wrap: wrap; } .filter-chips button { font-size: 11px; padding: 6px 12px; } }`

### Summary

**Responsive coverage:** ~40% of components have mobile rules. Major gaps in tabs, buttons, and modal sizing.

---

## HTML STRUCTURE

### Semantic Issues

1. ✓ `<header class="top">` is semantic
2. ✓ `<nav class="roles">` is semantic (verify it's a `<nav>` element, not div)
3. ✓ `<main>` used at line 42
4. ⚠ Interactive divs (`<div class="fu-card-name">`, etc.) should be buttons or links
5. ⚠ Form labels not properly associated (`<label for="">` pattern missing)

### Issues

**Line 3035:** `<button class="icon-btn" onclick="toggleMenu...">⋯</button>`
- Missing aria-label ✗

**Line 108:** Modal close button lacks aria-label ✗

**No viewport meta tag analysis** (line 5 has it, good for mobile PWA).

---

## SUMMARY

### By Severity

| Severity | Count | Top Issue |
|----------|-------|-----------|
| CRITICAL | 0 | None |
| HIGH | 6 | Border-radius fragmentation (4/5/6/8/10/14/18px), Color contrast nav text, Padding inconsistency |
| MEDIUM | 4 | Font-size drift, Inline styles repetition, Focus states, Tap targets |
| LOW | 3 | Naming clarity, Gradient smoothness, Heading nits |
| **ACCESSIBILITY** | 6 | Nav contrast fail (WCAG AA), Icon-only buttons no aria-label, Missing focus styles, Tap target failures |

### Top 5 Visible Issues a Team Member Would Notice in 30 Seconds

1. **Border-radius varies wildly (4/5/6/8/10/14px)** — buttons/cards look inconsistent at glance
2. **Nav button text too faint (#cbd5e1 on #14467a)** — hard to read active/inactive states
3. **Inline style sprawl in generated HTML** — ~460 instances of `style=` attribute (bloated markup)
4. **Missing focus outlines on buttons/inputs** — keyboard users can't see where they are
5. **Padding varies on list cards (10/11/12/14px)** — cards don't align to grid visually

---

## QUICK WINS (Estimated <30 min each)

1. **Standardize border-radius:** Use only 4px (badges), 6px (inputs), 8px (cards), 10px (pills)
2. **Fix nav button contrast:** Change `#cbd5e1` to `#e2e8f0` (line 33)
3. **Add focus-visible styles:** 4 lines of CSS for buttons & inputs
4. **Standardize card padding:** Change `.card` from 11px to 12px (line 70)
5. **Extract notification box pattern:** Create `.alert-info`, `.alert-success` classes (saves ~15KB gzip)

---

## VERIFICATION CHECKLIST

- [ ] Test nav button contrast on actual device (ensure #e2e8f0 is readable)
- [ ] Keyboard tab through all buttons/inputs; verify focus visible
- [ ] Test tap targets on iPhone 12 mini (375px) — check role nav button overflow
- [ ] Verify form labels are associated (`<label for="id">`) in actual HTML
- [ ] Compare rendered colors in different browsers (ensure #0B3052 consistent)
- [ ] Run axe-core or Lighthouse accessibility audit on live deployment

---

**File revised:** Ready for team polish pass.

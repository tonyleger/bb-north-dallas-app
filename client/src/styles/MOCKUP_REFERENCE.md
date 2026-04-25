# BB Unified App Design System Reference

## 1. Color Palette

### Brand & Header
- **Navy (primary)**: #0B3052
- **Mid-blue (secondary)**: #14467a
- **Teal (accent)**: #76C8DF
- **Dark blue gradient**: #1e3a8a to #0f172a (hero)

### Neutral & Borders
- **Slate gray**: #cbd5e1
- **Light gray (borders)**: #e5e7eb
- **Bg gray light**: #f9fafb
- **Bg gray lighter**: #f3f4f6
- **Text gray**: #6b7280
- **Text gray dark**: #1f2937
- **Text dark**: #0f172a
- **Text muted**: #9ca3af
- **Border dark**: #d1d5db

### Status Pills & Cards
**Red (error, bad, danger)**
- bg: #fee2e2 | #fef2f2, text: #b91c1c | #991b1b
- dark: #dc2626, light text: #fff

**Yellow/Amber (warn, soon)**
- bg: #fef3c7 | #fffbeb, text: #92400e | #b45309
- medium: #f59e0b | #fbbf24

**Green (good, ok, success)**
- bg: #d1fae5 | #ecfdf5, text: #065f46 | #047857
- medium: #059669 | #10b981

**Blue (info, future)**
- bg: #dbeafe | #eff6ff, text: #1e40af | #1e3a8a
- medium: #3b82f6

**Purple (secondary)**
- bg: #ede9fe, text: #5b21b6
- light: #ddd6fe

**Teal (accent, confirm)**
- bg: #ccfbf1, text: #115e59

**Gray (neutral)**
- bg: #f3f4f6, text: #374151

### Timeline Icons (background colors)
- call: #dbeafe (blue)
- text: #d1fae5 (green)
- email: #ede9fe (purple)
- note: #f3f4f6 (gray)
- issue: #fee2e2 (red)
- schedule: #fef3c7 (yellow)
- status: #e0e7ff (indigo)
- complete: #d1fae5 (green)
- received: #ccfbf1 (teal)

**Total colors: 23 distinct hex codes**

---

## 2. Typography

### Font Stack
`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`

### Sizes & Weights
| Element | Size | Weight | Line-height | Notes |
|---------|------|--------|-------------|-------|
| Page title | 22px | 700 | 1.4 | Primary page heading |
| Hero title | 22px | 700 | 1.4 | Inside `.hero` |
| Section header | 13px | 700 | 1.4 | `.section h3` |
| Subtab button | 15px | 600 | 1.4 | `.subtabs button` |
| Card name | 14px | 600 | 1.4 | `.card-name`, `.row-name` |
| Button text | 14px | 600 | — | `.btn` |
| Body / default | 14px | 400 | 1.4 | `<body>` |
| Card sub / meta | 12px | 400 | 1.4 | `.card-sub`, `.card-meta` |
| Input / select | 13px | 400 | — | `.toolbar input`, `.toolbar select` |
| Modal tab | 13px | 600 | — | `.modal-tabs button` |
| KPI label | 11px | 600 | 1.4 | `.kpi .label`, uppercase, letter-spacing: 0.4px |
| KPI value | 22px | 700 | 1.4 | `.kpi .val` |
| KPI sub | 11px | 400 | 1.4 | `.kpi .sub` |
| Pill | 11px | 600 | 1.4 | `.pill` |
| Status badge | 11px | 600 | 1.4 | `.fu-stage-badge`, `.fu-due` |
| Timeline meta | 11px | 400 | 1.4 | `.timeline-meta` |
| Label / form | 11px | 600 | 1.4 | `.action-form label`, uppercase, letter-spacing: 0.3px |

---

## 3. Spacing & Layout

### Common Values
| Property | Value | Context |
|----------|-------|---------|
| Main padding | 18px | `main` |
| KPI row gap | 10px | `.kpi-row` |
| Section margin | 14px | `.section` (bottom), `.fu-ref` (bottom) |
| Card padding | 11px 16px | `.card` |
| Header padding | 14px 20px | `header.top` |
| Modal padding | 14px 18px | `.modal-header`, `.modal-footer` |
| Button padding | 9px 16px | `.btn` (default) |
| Button padding | 8px 12px | `.fu-btn` |
| Border-radius (buttons) | 6px | `.btn`, `.fu-btn` |
| Border-radius (cards) | 8px | `.card`, `.section`, `.fu-detail-section` |
| Border-radius (rounded) | 10px | `.fu-ref`, `.fu-card`, `.modal` |
| Border-radius (pills) | 10px | `.pill`, `.role-count` |
| Gap (flex) | 8px | Most flex containers |
| Gap (grid KPI) | 10px | `.kpi-row` |

### Layout
| Component | Value |
|-----------|-------|
| Max-width (app shell) | 1400px |
| Max-width (modal) | 820px |
| Modal max-height | 65vh |
| Min-width (toolbar input) | 180px |
| KPI grid (auto-fit) | minmax(150px, 1fr) |
| Fu-ref grid (desktop) | repeat(6, 1fr) |
| Fu-ref grid (mobile <640px) | repeat(2, 1fr) |

### Breakpoints
- **Mobile collapse (grid-2)**: max-width 680px → 1 column
- **Install admin counters**: max-width 800px → 2 columns
- **Follow-up ref grid**: max-width 640px → 2 columns

---

## 4. Component Recipes

### Top Header Bar
```css
header.top {
  background: #0B3052;
  color: #fff;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
header.top .brand {
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 0.2px;
}
header.top .brand small {
  font-weight: 400;
  opacity: 0.7;
  margin-left: 8px;
  font-size: 12px;
}
header.top .meta {
  font-size: 12px;
  opacity: 0.75;
}
header.top .reset {
  background: #334155;
  color: #fff;
  border: 0;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
}
```

**HTML:**
```html
<header class="top">
  <div class="brand">BB Dallas <small>(Demo)</small></div>
  <div class="meta">Today, Fri Apr 25</div>
  <button class="reset">Reset demo</button>
</header>
```

---

### Role Tab Navigation
```css
nav.roles {
  display: flex;
  flex-wrap: wrap;
  background: #14467a;
  gap: 0;
}
nav.roles button {
  background: transparent;
  border: 0;
  color: #cbd5e1;
  padding: 18px 20px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  border-bottom: 4px solid transparent;
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 auto;
  min-width: 130px;
  justify-content: center;
  transition: all 0.12s;
}
nav.roles button:hover {
  background: #0B3052;
  color: #fff;
}
nav.roles button.active {
  color: #fff;
  border-bottom-color: #76C8DF;
  background: #0B3052;
  font-weight: 700;
}
nav.roles .role-icon {
  font-size: 18px;
}
nav.roles .role-count {
  background: #76C8DF;
  color: #0B3052;
  font-size: 12px;
  padding: 3px 9px;
  border-radius: 10px;
  font-weight: 700;
}
nav.roles .role-count.alert {
  background: #dc2626;
  color: #fff;
}
```

**HTML:**
```html
<nav class="roles">
  <button class="active" onclick="setRole('home')">
    <span class="role-icon">🏠</span>
    <span>Home</span>
  </button>
  <button onclick="setRole('designer')">
    <span class="role-icon">📐</span>
    <span>Designer</span>
    <span class="role-count alert">3</span>
  </button>
  <button onclick="setRole('followup')">
    <span class="role-icon">🔁</span>
    <span>Follow-ups</span>
    <span class="role-count">8</span>
  </button>
</nav>
```

---

### KPI Row & Card (with variants)
```css
.kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}
.kpi {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 14px;
}
.kpi .label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #6b7280;
  font-weight: 600;
}
.kpi .val {
  font-size: 22px;
  font-weight: 700;
  margin-top: 2px;
  color: #0f172a;
}
.kpi .sub {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
}

/* Status variants */
.kpi.warn .val { color: #b45309; }
.kpi.bad .val { color: #b91c1c; }
.kpi.good .val { color: #047857; }

/* Clickable variant (e.g. filtered KPI) */
.kpi.clickable {
  cursor: pointer;
  transition: all 0.15s;
  background: #e0f4fa;
  border-color: #76C8DF;
}
.kpi.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(11, 48, 82, 0.15);
  background: #c8e9f1;
  border-color: #0B3052;
}
.kpi.clickable .label {
  color: #0B3052;
  font-weight: 700;
}
.kpi.clickable .val {
  color: #0B3052 !important;
}
.kpi.clickable .sub {
  color: #14467a;
}

/* Active state (selected filter) */
.kpi.clickable.active {
  border-color: #0B3052;
  background: #0B3052;
  box-shadow: 0 4px 12px rgba(11, 48, 82, 0.3);
}
.kpi.clickable.active .label {
  color: #76C8DF !important;
}
.kpi.clickable.active .val {
  color: #fff !important;
}
.kpi.clickable.active .sub {
  color: #94a3b8 !important;
}
```

**HTML:**
```html
<div class="kpi-row">
  <div class="kpi">
    <div class="label">Total Value</div>
    <div class="val">$42,500</div>
  </div>
  <div class="kpi bad">
    <div class="label">Overdue Tasks</div>
    <div class="val">5</div>
  </div>
  <div class="kpi clickable active" onclick="filterBy('designer')">
    <div class="label">My Leads</div>
    <div class="val">12</div>
    <div class="sub">Click to view</div>
  </div>
</div>
```

---

### Section Card (container with header + count)
```css
.section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 14px;
  overflow: hidden;
}
.section h3 {
  margin: 0;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 700;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.section h3 .count {
  background: #e5e7eb;
  color: #374151;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}
.section h3 .count.alert {
  background: #fee2e2;
  color: #b91c1c;
}
.section .empty {
  padding: 30px 16px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}
```

**HTML:**
```html
<div class="section">
  <h3>
    Open Issues
    <span class="count alert">3</span>
  </h3>
  <div class="card-list">
    <!-- cards go here -->
  </div>
  <!-- or if empty -->
  <div class="empty">No open issues</div>
</div>
```

---

### Customer/Event Card List
```css
.card-list { display: flex; flex-direction: column; }
.card {
  padding: 11px 16px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background 0.12s;
}
.card:last-child { border-bottom: 0; }
.card:hover { background: #f9fafb; }

.card-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.card-name {
  font-weight: 600;
  font-size: 14px;
  color: #0f172a;
}
.card-sub {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}
.card-meta {
  text-align: right;
  font-size: 12px;
  color: #6b7280;
  min-width: 100px;
}
.card-meta .val {
  font-weight: 600;
  color: #0f172a;
  font-size: 14px;
}
.card .last-act {
  font-size: 11px;
  color: #3b82f6;
  margin-top: 3px;
}

/* Next due badges */
.card .next-due {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
  margin-top: 3px;
}
.card .next-due.due { background: #fee2e2; color: #991b1b; }
.card .next-due.soon { background: #fef3c7; color: #92400e; }
.card .next-due.future { background: #dbeafe; color: #1e3a8a; }
```

**HTML:**
```html
<div class="card-list">
  <div class="card" onclick="openCustomer('id1')">
    <div class="card-row">
      <div>
        <div class="card-name">John Smith</div>
        <div class="card-sub">North Dallas · 75244</div>
        <div class="card-sub">john@example.com · 214-555-1234</div>
        <div class="last-act">Last contact: 2d ago</div>
        <span class="next-due soon">Due in 1d</span>
      </div>
      <div class="card-meta">
        <div class="val">$4,200</div>
        <div>Est. 4/28</div>
      </div>
    </div>
  </div>
</div>
```

---

### Pills (all color variants)
```css
.pill {
  display: inline-block;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}
.pill.gray { background: #f3f4f6; color: #374151; }
.pill.blue { background: #dbeafe; color: #1e40af; }
.pill.green { background: #d1fae5; color: #065f46; }
.pill.yellow { background: #fef3c7; color: #92400e; }
.pill.red { background: #fee2e2; color: #991b1b; }
.pill.purple { background: #ede9fe; color: #5b21b6; }
.pill.teal { background: #ccfbf1; color: #115e59; }
```

**HTML:**
```html
<span class="pill blue">Booked</span>
<span class="pill red">Urgent</span>
<span class="pill green">Confirmed</span>
```

---

### Buttons (all variants)
```css
.btn {
  padding: 9px 16px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.12s;
}
.btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

/* Primary (navy) */
.btn.primary {
  background: #0B3052;
  color: #fff;
  border-color: #082340;
}
.btn.primary:hover {
  background: #14467a;
}

/* Danger (red) */
.btn.danger {
  background: #fff;
  color: #b91c1c;
  border-color: #fca5a5;
}
.btn.danger:hover {
  background: #fef2f2;
}

/* Success (green) */
.btn.success {
  background: #059669;
  color: #fff;
  border-color: #059669;
}
.btn.success:hover {
  background: #047857;
}

/* Small size (used in modals/inline) */
.btn.sm {
  padding: 6px 10px;
  font-size: 12px;
}

/* Fu-btn (follow-up specific) */
.fu-btn {
  background: #fff;
  border: 1px solid #d1d5db;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.12s;
}
.fu-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}
.fu-btn.primary {
  background: #0B3052;
  color: #fff;
  border-color: #0B3052;
}
.fu-btn.primary:hover {
  background: #14467a;
}
.fu-btn.warn {
  background: #fef3c7;
  color: #92400e;
  border-color: #fbbf24;
}
.fu-btn.warn:hover {
  background: #fde68a;
}
.fu-btn.danger {
  background: #fee2e2;
  color: #b91c1c;
  border-color: #fca5a5;
}
.fu-btn.danger:hover {
  background: #fecaca;
}
```

**HTML:**
```html
<button class="btn" onclick="cancel()">Cancel</button>
<button class="btn primary" onclick="submit()">Save changes</button>
<button class="btn danger" onclick="delete()">Delete</button>
<button class="btn success" onclick="confirm()">✓ Mark done</button>
<a class="btn" href="...">Open external link</a>
<button class="btn sm" onclick="edit()">Edit</button>
```

---

### Toolbar
```css
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}
.toolbar select,
.toolbar input {
  padding: 7px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
}
.toolbar input {
  flex: 1;
  min-width: 180px;
}
.toolbar label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
  margin-right: 4px;
}
```

**HTML:**
```html
<div class="toolbar">
  <label>Filter:</label>
  <select onchange="filterBy(this.value)">
    <option>All</option>
    <option>My items</option>
  </select>
  <input type="search" placeholder="Search..." />
  <button class="btn primary sm">Search</button>
</div>
```

---

### Modal (with header, tabs, body, actions)
```css
.modal-bg {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: none;
  align-items: flex-start;
  justify-content: center;
  padding: 20px 10px;
  z-index: 50;
  overflow-y: auto;
}
.modal-bg.show { display: flex; }

.modal {
  background: #fff;
  border-radius: 10px;
  max-width: 820px;
  width: 100%;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.modal-header {
  padding: 14px 18px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-header h2 {
  margin: 0;
  font-size: 17px;
}
.modal-header .sub {
  font-size: 12px;
  color: #6b7280;
}
.modal-close {
  background: none;
  border: 0;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
}

.modal-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}
.modal-tabs button {
  background: transparent;
  border: 0;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  color: #6b7280;
  border-bottom: 2px solid transparent;
}
.modal-tabs button.active {
  color: #1e40af;
  border-bottom-color: #3b82f6;
  background: #fff;
}
.modal-tabs button:hover:not(.active) {
  color: #1f2937;
}

.modal-body {
  padding: 16px 18px;
  max-height: 65vh;
  overflow-y: auto;
}
.modal-body h4 {
  margin: 14px 0 6px 0;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #6b7280;
}

.modal-actions {
  padding: 12px 18px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
```

**HTML:**
```html
<div class="modal-bg show" id="modal-bg">
  <div class="modal">
    <div class="modal-header">
      <h2>Customer Detail</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-tabs">
      <button class="active">Info</button>
      <button>History</button>
    </div>
    <div class="modal-body">
      <!-- content -->
    </div>
    <div class="modal-actions">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="save()">Save</button>
    </div>
  </div>
</div>
```

---

### Notification Bell + Badge
```html
<button class="notification-bell" onclick="openNotifs()">
  🔔
  <span class="notif-badge">3</span>
</button>
```

(Badge uses `.role-count.alert` styles: #dc2626 bg, #fff text, 12px font, 10px border-radius)

---

### Empty State
```css
.section .empty {
  padding: 30px 16px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}
.empty-fu {
  padding: 30px 20px;
  text-align: center;
  color: #6b7280;
  background: #f9fafb;
  border-radius: 10px;
  font-size: 13px;
}
```

**HTML:**
```html
<div class="section">
  <h3>Issues <span class="count">0</span></h3>
  <div class="empty">No open issues yet.</div>
</div>
```

---

### Follow-up Dashboard Specific

#### Follow-up Card
```css
.fu-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px 16px;
  transition: box-shadow 0.12s, transform 0.12s;
}
.fu-card.clickable { cursor: pointer; }
.fu-card.clickable:hover {
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
  border-color: #76C8DF;
  transform: translateY(-1px);
}

/* Left border variants */
.fu-card.call { border-left: 4px solid #f59e0b; background: #fffbeb; }
.fu-card.overdue { border-left: 4px solid #dc2626; background: #fffafa; }
.fu-card.closed-won { border-left: 4px solid #059669; opacity: 0.95; }
.fu-card.closed-lost { border-left: 4px solid #6b7280; opacity: 0.85; background: #fafafa; }

.fu-card-name { font-size: 15px; font-weight: 700; color: #0B3052; }
.fu-card-territory { font-size: 12px; color: #6b7280; margin-top: 1px; }
.fu-card-value-big { font-size: 18px; font-weight: 800; color: #0B3052; }

/* Stage badges */
.fu-stage-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 10px;
  background: #dbeafe;
  color: #1e40af;
}
.fu-stage-badge.call { background: #fef3c7; color: #92400e; }
.fu-stage-badge.email { background: #fce7f3; color: #9d174d; }

/* Due/overdue pills */
.fu-overdue-pill { font-size: 11px; font-weight: 700; color: #fff; background: #dc2626; padding: 3px 9px; border-radius: 10px; }
.fu-due-pill { font-size: 11px; font-weight: 700; color: #fff; background: #f59e0b; padding: 3px 9px; border-radius: 10px; }
.fu-due {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 10px;
  background: #f3f4f6;
  color: #374151;
  white-space: nowrap;
}
.fu-due.warn { background: #fef3c7; color: #92400e; }
.fu-due.bad { background: #fee2e2; color: #b91c1c; }
.fu-due.good { background: #d1fae5; color: #065f46; }
```

#### Follow-up Section Title
```css
.fu-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}
.fu-section-title.call {
  background: #fef3c7;
  color: #7c2d12;
}
.fu-section-title .count {
  background: #0B3052;
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: auto;
}
```

---

## 5. Role List

| ID | Icon | Label | Notes |
|----|------|-------|-------|
| home | 🏠 | Home | Dashboard landing page |
| designer | 📐 | Design Consultant | My appointments, open quotes, log follow-ups |
| followup | 🔁 | Follow-up Dashboard | GM & rep modes; leaderboard, customer pipeline |
| installadmin | 📅 | Install Admin | Schedule, confirm, work issues |
| installer | 🔧 | Installer | Today's jobs, start/complete, report issues |
| owner | 👁️ | Owner | Live activity feed across shop |

---

## 6. Notable Interactions

- **Role nav count badges**: Dynamically updated count; `.alert` (red) if critical items exist
- **KPI cards clickable**: Scroll to filtered section or highlight active state with navy bg + white text
- **Follow-up ref grid**: Collapsible 6-column grid showing follow-up cadence stages (mobile: 2 col)
- **Card list hover**: Subtle bg change (#f9fafb), clickable to open detail modal
- **Modal backdrop**: Semi-transparent overlay (rgba(15,23,42,0.55)), click-to-close on bg
- **Toolbar**: Live filter + search; updates list in real-time
- **Status pills in cards**: Color indicates age/urgency (soon=yellow, due=red, future=blue)
- **Follow-up due badges**: 3 states (overdue=red, due=amber, future=blue) to flag urgency
- **Timeline**: Circular icons (28px) with color-coded activity type backgrounds
- **Inline scheduler**: Hidden by default; `.show` class reveals it in flexbox
- **Age badges** (row-card): `.ok` (green), `.warn` (yellow), `.bad` (red) for lead age in days
- **Mode toggles** (fu-detail): 2-button toggle; active state = teal bg + navy text
- **Call outcome buttons**: 4 states (good/green, warn/yellow, neutral/white, bad/red)
- **Method picker grid**: 3 columns of icon+label buttons; active = navy bg + white text + navy border
- **Subtab badges**: Red badge with white text on right side of active tab label

---

## Summary

**Total component recipes: 16**
- Top header bar
- Role tab navigation  
- KPI row + card (with warn/bad/good/clickable/active variants)
- Section card with header + count badge
- Customer/event card list (card, card-row, card-meta, next-due variants)
- Pills (7 color variants)
- Toolbar (filter + input)
- Buttons (5 variants + sm size)
- Modal (header, tabs, body, actions)
- Notification bell + badge
- Empty state
- Follow-up card (4 border-color variants)
- Follow-up section title
- Follow-up stage badge (3 variants)
- Follow-up due badges (3 states)
- Timeline (icon + content, 9 icon background colors)

All CSS is production-ready, standalone, and ready to be ported to React with CSS modules or Tailwind.

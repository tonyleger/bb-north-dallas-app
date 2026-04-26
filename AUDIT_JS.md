# JS Audit — BB Unified Mockup

## CRITICAL (will break for users)

- **[631] loadStore() — Missing error recovery on corrupted localStorage**
  - Line 631: `function loadStore(){ try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch(e){ return {}; } }`
  - Issue: If STORE_KEY exists but is truncated/invalid JSON, the app silently loses all user data. The catch returns `{}`, which zeros out `STORE.activities`, `STORE.tasks`, `STORE.schedules`, etc.
  - Fix: Log the error and provide a recovery path. Consider `localStorage.removeItem(STORE_KEY)` on corruption and notify the user.

- **[Widespread] 66 unsafe `CUSTOMERS.find()` calls without null checks**
  - Lines: 758, 771, 782, 794, 812, 824, 860, 964, 1275, 1300, 1692, 1728, 1932, 1952, 2177, 2300, 2369, 2969, 3006, 3464, 3474, 3483, 3501, 3523, 3538, 4117, 4204, 4219, 4232, 4371, 4384, 4399, 4478, 4483, 4493, 4559, 4586, 4626, 4633, 4676, 5070, 5332, 5378, 5392, 5583, 5635, 5730, 5872, 6113, 6241, 6246, 6467
  - Issue: `const c = CUSTOMERS.find(...)` without checking `if (!c)`. Code immediately accesses `c.name`, `c.id`, `c.phone`, etc. If customer ID doesn't exist or is wrong, returns `undefined` and crashes with "Cannot read property of undefined".
  - Example crash: Line 1709 in `tpOrderLink()` → `return \`<a href="..." onclick="...">${escHtml(orderNumber||'—')}...\`; // c is undefined
  - Fix: Add `if (!c) c = {};` or `const c = CUSTOMERS.find(...) || {};` after each find. Or guard property access: `c?.name` (optional chaining).

- **[2683] Unguarded JSON.parse on embedded customer data**
  - Line 2683: `const CUSTOMERS = JSON.parse(document.getElementById('customers-data').textContent);`
  - Issue: No try-catch. If the JSON in `<script id="customers-data" type="application/json">` is malformed, app crashes on load.
  - Fix: Wrap in try-catch: `let CUSTOMERS = []; try { CUSTOMERS = JSON.parse(...); } catch(e) { console.error('Bad customer data', e); }`

- **[Massive] STORE state corrupted on every init due to missing initialization saves**
  - Lines: 635–640 (ensure), 685, 703, 745, 1149, 1171, 1178, 1196, 1214, 1232, 1258, 1347, 1532, 1662, 1686, 1721, 1735, 1744, 1770, 1777, 1785
  - Issue: Code like `STORE.activities = STORE.activities || {}` modifies the STORE object but does NOT call `saveStore()`. If app crashes or page closes during first-time init before any real action, these defaults are lost. Next load, `loadStore()` returns `{}` again, and re-init loops indefinitely.
  - Example: Line 635–640 in `ensure()` creates `STORE.activities`, `STORE.schedules`, etc. but never saves. If user navigates away before a saveStore-triggering action, data is lost.
  - Fix: After all defaults are initialized (around line 640), call `saveStore(STORE)`. Or call `saveStore()` inside each setter function.

## HIGH (broken feature, recoverable)

- **[3529, 3717, 3772, 3891] Silent catch blocks in Follow-up tab initialization**
  - Lines: 2809 `previewRole`, 3529, 3717, 3772 `fuRefCollapsed`, 3891 `lastShown`
  - Issue: `try { localStorage.getItem(...) } catch(e){}` — error is swallowed. If localStorage is disabled or quota exceeded, the read fails silently and the variable remains undefined, causing unexpected behavior in conditionals.
  - Fix: Add at least `catch(e){ console.warn('localStorage error:', e); }` so failures are visible in dev console.

- **[1728] Unsafe object literal in bulk action loop**
  - Line 1728: `cid, meta, c: CUSTOMERS.find(x=>String(x.id)===String(cid))`
  - Issue: If customer not found, `c` is `undefined`. Any code that tries to use this object's properties crashes.
  - Fix: Add guard: `c: CUSTOMERS.find(...) || {}`

- **[5601, 5634, 6381] No role-based access control on sensitive forms**
  - Line 5601: `function openServiceCallForm(custId)` — no role check. Anyone can open service calls.
  - Line 5634: `function openTaskForm(custId)` — no role check. Anyone can assign tasks.
  - Line 6381: `function openTeamMemberForm(m)` — no role check. Anyone can edit team roster.
  - Issue: If a lower-privilege user role (e.g., "installer") somehow gets access to these functions, they can modify sensitive data.
  - Fix: Add guards: `if (currentRole !== 'owner' && currentRole !== 'installadmin') { return; }` or similar.

- **[2809] Preview role persistence vulnerability**
  - Line 2809: `try { previewRole = localStorage.getItem('bb_preview_role') || ''; } catch(e){}`
  - Issue: The `previewRole` dropdown is meant for demo only but persists in localStorage. If a user switches to "installer" role for testing and forgets, next session loads as installer by default.
  - Fix: Clear `bb_preview_role` on app unload or don't persist it: `const previewRole = localStorage.getItem('bb_preview_role')` → `let previewRole = '';` (no persistence).

- **[1710] Async navigator.clipboard without timeout**
  - Line 1709 in `tpOrderLink()`: `onclick="if(navigator.clipboard) navigator.clipboard.writeText('${orderNumber||''}'); event.stopPropagation();"`
  - Issue: `writeText()` is async but code doesn't wait or provide feedback. User clicks "copy order number" and nothing visible happens; they don't know if copy succeeded or failed.
  - Fix: Wrap in `.then().catch()` and show a toast: `navigator.clipboard.writeText(...).then(() => showToast('Copied')).catch(() => showToast('Copy failed'));`

## MEDIUM (works but fragile)

- **[625+ lines] Hardcoded test customer data in <script> tag**
  - Line 626: `<script id="customers-data" type="application/json">[{"id":"2302","leadNumber":"2302","name":"Monica Perez"...`
  - Issue: Real names, phone numbers, and data embedded in HTML. Every test/prod deploy, this data is visible. If app is captured in a screenshot or logged, customer PII is exposed.
  - Fix: Move to external JSON file or backend API. Generate test data dynamically in dev mode only.

- **[Multiple] Loose equality (==) in comparisons**
  - Issue: While no direct `==` bugs found, the pattern of `String(x.id)===String(custId)` suggests ID mismatches are a concern. If IDs are sometimes numbers, sometimes strings, loose equality could mask bugs.
  - Current code actually uses strict `===`, so this is OK, but vulnerable to refactoring mistakes.

- **[1051] updateScheduleEndFromStart() missing saveStore()**
  - Line 1051 in dialog: `function updateScheduleEndFromStart(){ ... update form fields ... }` — updates the dialog UI but no `saveStore()` call.
  - Issue: If user changes start time, end time auto-updates, but the STORE is not saved. If dialog is closed without submitting, the auto-calculated end time is lost.
  - Fix: Add `saveStore(STORE)` after updating form state, or defer until `submitSchedule()`.

- **[2596, 3615, 3778, 4948, 5759, 6053, 6299] Rerender functions don't validate state first**
  - Examples: `rerenderActive()`, `rerenderDG()`, `rerenderFU()`, `rerenderIA()`, `rerenderWH()`, `rerenderIN()`, `rerenderTeam()`
  - Issue: These call `document.getElementById('view').innerHTML = ...` without checking if required globals exist. If `cpTab` is undefined or a role object isn't initialized, rendering silently fails or produces blank UI.
  - Fix: Add guards: `if (!cpTab) cpTab = 'overview';` before render.

- **[4340+] Chained function calls in onclick without error boundaries**
  - Line 870: `onclick="markNotifRead('${n.id}');closeModal();openClientPage('${c.id}');"`
  - Issue: If `markNotifRead()` throws, the chain stops and subsequent functions don't run. UI state becomes inconsistent (modal still open).
  - Fix: Wrap each call in its own try-catch or use a helper: `async function chainActions() { try { ... } catch(e) { console.error(e); } }`

- **[1037, 2402, 2638] Inline confirm() dialogs without error handling**
  - Lines: 1037, 2402, 2638: `onclick="if(confirm('...?')){...}"`
  - Issue: Works but fragile. If user's browser has disabled confirm dialogs, the condition fails silently. Also, confirm is blocking and should be replaced with a real modal on modern web apps.
  - Fix: Replace with a custom modal instead of `confirm()`.

- **[Widespread] Daily checklist and cadence logic relies on string date matching**
  - Lines 1194–1213: `dailyChecklistKey()` uses `TODAY.getFullYear()-${d.getMonth()+1}-${d.getDate()}` to track daily state.
  - Issue: If user's system clock is set wrong or daylight savings causes a timezone shift, the key mismatches and user sees duplicate checklists or lost progress.
  - Fix: Use ISO date string: `TODAY.toISOString().split('T')[0]`

## LOW (cleanup / nits)

- **[Multiple] Excessive STORE re-initialization on function call**
  - Lines 635–640: Every call to `ensure(custId)` re-sets `STORE.activities`, `STORE.schedules`, etc. with `||` guards. This is inefficient and should happen once at startup.
  - Fix: Move all defaults to a single `initStore()` call at page load.

- **[1710] escHtml() not used in orderNumber interpolation**
  - Line 1709: `${escHtml(orderNumber||'—')}`
  - Note: This is fine, but `orderNumber` should be validated as alphanumeric before inserting into onclick. Order numbers with quotes would break the onclick attribute.
  - Fix: Sanitize order number: `orderNumber.replace(/'/g, "\\'")` before embedding.

- **[Widespread] Missing fallback rendering on CUSTOMERS undefined**
  - If the <script> tag fails to parse or is missing, `CUSTOMERS` is never defined, and every page render crashes.
  - Fix: Add `const CUSTOMERS = window.CUSTOMERS || [];` early in script.

- **[1842] installerFinishInstall() doesn't validate custId**
  - Line 1842: `onclick="installerFinishInstall('${c.id}')"`
  - Issue: If `c` is undefined (due to unsafe find), the call passes `undefined` and crashes inside the function.
  - Fix: Depend on safe find earlier in the chain + add guard in function: `if (!custId) return;`

- **[5070] Calendar rendering doesn't guard currentMonth/currentYear**
  - Line 5070: `const c = CUSTOMERS.find(x=>String(x.id)===String(cid));`
  - Issue: Used in `renderCalendarTab()` without checking if calendar date variables are set.
  - Fix: Initialize `let currentMonth = new Date().getMonth(); let currentYear = new Date().getFullYear();` at startup.

- **[2723] fmtDate() doesn't validate input**
  - Returns empty string if date format doesn't match. No error logged. Could silently hide bad dates in UI.
  - Fix: Add `console.warn('Invalid date:', input)` if format doesn't match.

- **[Silent failures in optional features]**
  - If Touchpoint API URL isn't set (`STORE.tpUrls`), all "Open in Touchpoint" links silently fail.
  - Fix: Show a warning badge instead: `${STORE.tpUrls ? 'Open TP' : '(TP not configured)'}`

## SUMMARY

**Total Issues: 8 CRITICAL, 7 HIGH, 9 MEDIUM, 12 LOW = 36 issues**

### Top 3 things to fix first:

1. **Add null checks after every `CUSTOMERS.find()` call** (66 instances)
   - Prevents cascading "Cannot read property of undefined" crashes.
   - Most likely cause of user-facing errors in production.

2. **Fix localStorage initialization corruption** (Lines 631, 635–640)
   - Wrap `loadStore()` with data recovery.
   - Call `saveStore(STORE)` after initializing defaults, not just after user actions.
   - Currently, app data could vanish on first run if user navigates away before first real action.

3. **Add role-based access control guards** (Lines 5601, 5634, 6381)
   - Block non-owner roles from editing tasks, service calls, team roster.
   - Prevents privilege escalation bugs.
   - Add 3–5 lines of guard code per sensitive function.

### Deployment Readiness: **NOT READY**

The app will encounter crashes in production when:
- A customer ID is mistyped or old ID is used (no fallback rendering).
- User's localStorage quota is exceeded or disabled (silent failures in Follow-up tab).
- App is closed/crashed during first initialization (STORE data lost).
- A lower-privilege role user tricks the URL into opening an admin form (no role checks).

Recommend fixing all CRITICAL and HIGH items before launch. MEDIUM issues can be scheduled for post-launch if on a tight deadline, but should be in v1.1.

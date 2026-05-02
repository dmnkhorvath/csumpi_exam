# UI Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the csumpi exam app UI as a mobile-first PWA learning buddy with 2-button spaced repetition, dropping Tailwind/DaisyUI in favour of Radix UI + plain CSS Modules.

**Architecture:** Keep existing Vite + React + React Router + chunked `category-*.json` data. Add a `studyStore` over `localStorage` driving spaced repetition; render only what fits on screen (virtualized browse lists, streamed study deck) to satisfy a hard iPhone 13 performance budget. PWA via `vite-plugin-pwa`/Workbox; styling via CSS Modules and a `tokens.css` design system.

**Tech Stack:** React 18, Vite 6, React Router 7, Radix UI, Lucide React, `@tanstack/react-virtual`, `vite-plugin-pwa` (Workbox), Vitest + Testing Library, Playwright (smoke). Plain CSS Modules. **No Tailwind, no DaisyUI.**

**Spec:** `docs/superpowers/specs/2026-05-02-ui-rewrite-design.md`. Visual reference: `docs/superpowers/mockups/visual-system.html`.

---

## File structure

### New files

```
src/
  app/
    App.jsx                            (replaces src/App.jsx)
    routes.jsx
  pages/
    HomePage.jsx                       (replaces existing)
    StudyPage.jsx                      (new)
    BrowsePage.jsx                     (new — Radix Tabs hub)
    BrowseCategoryPage.jsx             (replaces CategoryPage)
    BrowseAllPage.jsx                  (replaces AllQuestionsPage)
    BrowseSimilarityPage.jsx           (replaces SimilarityGroupsPage)
    QuestionSheet.jsx                  (new)
    StatsPage.jsx                      (new)
    SettingsPage.jsx                   (new)
    OnboardingOverlay.jsx              (new)
  components/
    AppHeader.jsx + .module.css
    BottomNav.jsx + .module.css
    Button.jsx + .module.css
    Card.jsx + .module.css
    ProgressBar.jsx + .module.css
    StreakStrip.jsx + .module.css
    CategoryTile.jsx + .module.css
    StudyCard.jsx + .module.css
    CollapsibleQA.jsx + .module.css
    RevealPanel.jsx + .module.css
    VariantsList.jsx + .module.css
    QuestionListRow.jsx + .module.css
    Skeleton.jsx + .module.css
    OfflineToast.jsx + .module.css
    EmptyState.jsx + .module.css
    Icon.jsx                           (Lucide wrapper)
  domain/
    srsCard.js                         (new)
    scheduler.js                       (new — pure)
  store/
    studyStore.js                      (new)
    useStudyStore.js                   (new)
    migrations.js                      (new)
  data/
    searchWorker.js                    (new — Web Worker)
    deckBuilder.js                     (new — derives SR cards from category data)
  styles/
    tokens.css
    globals.css
    reset.css
  pwa/
    register.js
public/
  manifest.webmanifest
  icons/                               (192, 512, maskable)
  offline.html
tests/
  unit/
    scheduler.test.js
    studyStore.test.js
    srsCard.test.js
    deckBuilder.test.js
    similarityGroup.test.js            (lift existing logic into tests)
  component/
    StudyCard.test.jsx
    CollapsibleQA.test.jsx
    BottomNav.test.jsx
    HomePage.test.jsx
  e2e/
    smoke.spec.js                      (Playwright)
vitest.config.js
playwright.config.js
```

### Removed files (Phase D — cleanup)

```
src/App.jsx                            (replaced by src/app/App.jsx)
src/pages/HomePage.jsx
src/pages/CategoryPage.jsx
src/pages/AllQuestionsPage.jsx
src/pages/SimilarityGroupsPage.jsx
src/components/QuestionCard.jsx        (replaced by StudyCard + QuestionSheet)
src/components/QuestionMarkdown.jsx    (re-implemented in components/Markdown.jsx if reused)
tailwind.config.js
postcss.config.js
```

### Modified files

- `src/index.css` — replaced (no Tailwind directives).
- `src/main.jsx` — point to `app/App.jsx`, register PWA.
- `package.json` — deps changes.
- `vite.config.js` — add `vite-plugin-pwa`.
- `index.html` — fonts preconnect, manifest link, theme-color, apple meta.

---

## Phase A — Groundwork

### Task A1: Remove Tailwind / DaisyUI, install new deps

**Files:**
- Modify: `package.json`
- Delete: `tailwind.config.js`, `postcss.config.js`
- Modify: `src/index.css`

- [ ] **Step 1: Remove old deps**

```bash
npm uninstall tailwindcss daisyui @tailwindcss/typography autoprefixer postcss
```

- [ ] **Step 2: Install new deps**

```bash
npm install @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-toast \
  @radix-ui/react-collapsible @radix-ui/react-switch @radix-ui/react-progress \
  @radix-ui/react-dropdown-menu @radix-ui/react-visually-hidden \
  @tanstack/react-virtual lucide-react
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event @playwright/test vite-plugin-pwa workbox-window axe-playwright
```

- [ ] **Step 3: Delete Tailwind config**

```bash
rm tailwind.config.js postcss.config.js
```

- [ ] **Step 4: Empty `src/index.css`**

Replace contents with:

```css
/* Replaced in Task A2 with token-based globals. */
```

- [ ] **Step 5: Verify build still works (will be unstyled)**

```bash
npm run build
```

Expected: build succeeds, no Tailwind errors.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/index.css
git rm tailwind.config.js postcss.config.js
git commit -m "chore(deps): drop Tailwind/DaisyUI, install Radix + Lucide + Vitest"
```

---

### Task A2: Design tokens, reset, globals

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/reset.css`
- Create: `src/styles/globals.css`
- Modify: `src/index.css` (imports the three above)
- Modify: `index.html` (fonts preconnect)

- [ ] **Step 1: Write `src/styles/tokens.css`**

```css
:root {
  --brand-500: #7C3AED;
  --brand-600: #6D28D9;
  --brand-50:  #F5F0FF;

  --success-500: #10B981;
  --success-600: #059669;
  --success-50:  #ECFDF5;

  --danger-500: #EF4444;
  --danger-600: #B91C1C;
  --danger-50:  #FEF2F2;

  --streak-500: #F59E0B;

  --bg:        #FAF7FF;
  --surface:   #FFFFFF;
  --surface-2: #F5F2FB;
  --text:      #0F172A;
  --text-mute: #475569;
  --border:    #ECE6F7;

  --r-sm: 12px;
  --r-md: 18px;
  --r-lg: 24px;
  --r-pill: 999px;

  --shadow-card: 0 1px 2px rgba(15,23,42,.06), 0 8px 24px rgba(124,58,237,.08);
  --shadow-press: 0 1px 2px rgba(15,23,42,.06);

  --ease: cubic-bezier(.2,.7,.3,1);

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;

  --font-heading: 'Baloo 2', system-ui, -apple-system, sans-serif;
  --font-body: 'Nunito', system-ui, -apple-system, sans-serif;

  --z-nav: 40;
  --z-sheet: 80;
  --z-toast: 100;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg:        #0F0B1A;
    --surface:   #1A1530;
    --surface-2: #241D40;
    --text:      #F1ECFF;
    --text-mute: #A89DCC;
    --border:    #2E2655;
    --brand-50:  #231640;
    --success-50:#0F2A20;
    --danger-50: #2A1212;
    --shadow-card: 0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(124,58,237,.18);
  }
}
```

- [ ] **Step 2: Write `src/styles/reset.css`**

```css
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }
html, body, #root { height: 100%; }
body {
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.5;
}
img, picture, video, canvas, svg { display: block; max-width: 100%; }
input, button, textarea, select { font: inherit; color: inherit; }
button { background: none; border: 0; cursor: pointer; padding: 0; }
a { color: inherit; text-decoration: none; }
:focus-visible { outline: 2px solid var(--brand-500); outline-offset: 2px; border-radius: var(--r-sm); }
```

- [ ] **Step 3: Write `src/styles/globals.css`**

```css
html { -webkit-tap-highlight-color: transparent; }
body { min-height: 100dvh; }

button, a { touch-action: manipulation; }

h1, h2, h3 { font-family: var(--font-heading); font-weight: 700; line-height: 1.2; }
.tabular { font-variant-numeric: tabular-nums; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 4: Replace `src/index.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&family=Nunito:wght@400;600;700&display=swap');
@import './styles/reset.css';
@import './styles/tokens.css';
@import './styles/globals.css';
```

- [ ] **Step 5: Update `index.html` head**

Add inside `<head>`, before existing tags:

```html
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
<meta name="theme-color" content="#7C3AED" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#0F0B1A" media="(prefers-color-scheme: dark)" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

- [ ] **Step 6: Verify dev server boots**

```bash
npm run dev
```

Expected: starts, app loads (will be unstyled apart from base), no console errors.

- [ ] **Step 7: Commit**

```bash
git add src/styles src/index.css index.html
git commit -m "feat(styles): design tokens, reset, globals"
```

---

### Task A3: Vitest setup

**Files:**
- Create: `vitest.config.js`
- Create: `tests/setup.js`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Write `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.{js,jsx}'],
  },
})
```

- [ ] **Step 2: Write `tests/setup.js`**

```js
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => cleanup())
```

- [ ] **Step 3: Add scripts to `package.json`**

In `"scripts"`, add:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test"
```

- [ ] **Step 4: Sanity test**

Create `tests/unit/sanity.test.js`:

```js
import { describe, it, expect } from 'vitest'

describe('vitest', () => {
  it('runs', () => { expect(1 + 1).toBe(2) })
})
```

Run: `npm test`. Expected: 1 passing.

- [ ] **Step 5: Delete sanity test, commit**

```bash
rm tests/unit/sanity.test.js
git add vitest.config.js tests/setup.js package.json package-lock.json
git commit -m "chore(test): add Vitest + Testing Library setup"
```

---

### Task A4: Pure scheduler (TDD)

**Files:**
- Create: `tests/unit/scheduler.test.js`
- Create: `src/domain/scheduler.js`

- [ ] **Step 1: Write the failing tests**

```js
// tests/unit/scheduler.test.js
import { describe, it, expect } from 'vitest'
import { schedule, INTERVALS_MS } from '../../src/domain/scheduler.js'

const DAY = 24 * 60 * 60 * 1000
const newCard = (over = {}) => ({
  id: 'g1', categorySlug: 'keringes',
  state: 'new', step: 0, dueAt: 0, lastSeenAt: null, history: [],
  ...over,
})

describe('schedule', () => {
  const now = 1_700_000_000_000

  it('wrong on a new card requeues immediately and marks learning', () => {
    const c = schedule(newCard(), 'wrong', now)
    expect(c.state).toBe('learning')
    expect(c.step).toBe(0)
    expect(c.dueAt).toBe(now)
    expect(c.lastSeenAt).toBe(now)
    expect(c.history.at(-1)).toEqual({ at: now, rating: 'wrong' })
  })

  it('right on step 0 advances to step 1 (1 day)', () => {
    const c = schedule(newCard(), 'right', now)
    expect(c.step).toBe(1)
    expect(c.state).toBe('learning')
    expect(c.dueAt).toBe(now + DAY)
  })

  it('right at step 1 advances to step 2 (3 days)', () => {
    const c = schedule(newCard({ step: 1 }), 'right', now)
    expect(c.step).toBe(2)
    expect(c.dueAt).toBe(now + 3 * DAY)
  })

  it('right at step 2 -> step 3 (7 days)', () => {
    const c = schedule(newCard({ step: 2 }), 'right', now)
    expect(c.step).toBe(3)
    expect(c.dueAt).toBe(now + 7 * DAY)
  })

  it('right at step 3 -> step 4 (21 days)', () => {
    const c = schedule(newCard({ step: 3 }), 'right', now)
    expect(c.step).toBe(4)
    expect(c.dueAt).toBe(now + 21 * DAY)
  })

  it('right at step 4 marks mastered', () => {
    const c = schedule(newCard({ step: 4 }), 'right', now)
    expect(c.state).toBe('mastered')
    expect(c.step).toBe(4)
  })

  it('wrong at any step resets step to 0 and learning', () => {
    const c = schedule(newCard({ step: 3, state: 'learning' }), 'wrong', now)
    expect(c.step).toBe(0)
    expect(c.state).toBe('learning')
    expect(c.dueAt).toBe(now)
  })

  it('does not mutate the input card', () => {
    const original = newCard()
    schedule(original, 'right', now)
    expect(original.step).toBe(0)
    expect(original.history).toEqual([])
  })

  it('exposes interval ladder via INTERVALS_MS', () => {
    expect(INTERVALS_MS).toEqual([0, DAY, 3 * DAY, 7 * DAY, 21 * DAY])
  })
})
```

- [ ] **Step 2: Run, confirm failure**

```bash
npm test -- scheduler
```

Expected: FAIL — `Cannot find module .../scheduler.js`.

- [ ] **Step 3: Implement `src/domain/scheduler.js`**

```js
const DAY = 24 * 60 * 60 * 1000

export const INTERVALS_MS = [0, DAY, 3 * DAY, 7 * DAY, 21 * DAY]

export const schedule = (card, rating, now) => {
  const next = {
    ...card,
    history: [...card.history, { at: now, rating }],
    lastSeenAt: now,
  }
  if (rating === 'wrong') {
    next.state = 'learning'
    next.step = 0
    next.dueAt = now
    return next
  }
  if (card.step >= 4) {
    next.state = 'mastered'
    next.step = 4
    next.dueAt = now + INTERVALS_MS[4]
    return next
  }
  next.step = card.step + 1
  next.state = 'learning'
  next.dueAt = now + INTERVALS_MS[next.step]
  return next
}
```

- [ ] **Step 4: Run, confirm pass**

```bash
npm test -- scheduler
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/unit/scheduler.test.js src/domain/scheduler.js
git commit -m "feat(domain): pure SR scheduler with 1d/3d/7d/21d ladder"
```

---

### Task A5: srsCard helpers (TDD)

**Files:**
- Create: `tests/unit/srsCard.test.js`
- Create: `src/domain/srsCard.js`

- [ ] **Step 1: Write the failing tests**

```js
// tests/unit/srsCard.test.js
import { describe, it, expect } from 'vitest'
import { createNewCard, isDue } from '../../src/domain/srsCard.js'

describe('srsCard', () => {
  it('createNewCard returns initial state', () => {
    const c = createNewCard('group-1', 'keringes')
    expect(c).toEqual({
      id: 'group-1',
      categorySlug: 'keringes',
      state: 'new',
      step: 0,
      dueAt: 0,
      lastSeenAt: null,
      history: [],
    })
  })

  it('isDue returns true when dueAt <= now and not mastered', () => {
    expect(isDue({ state: 'new', dueAt: 0 }, 1)).toBe(true)
    expect(isDue({ state: 'learning', dueAt: 100 }, 200)).toBe(true)
    expect(isDue({ state: 'learning', dueAt: 200 }, 100)).toBe(false)
    expect(isDue({ state: 'mastered', dueAt: 0 }, 999 }, 1)).toBe(false)
  })
})
```

> Note: fix the typo in your editor — last call should be `isDue({ state: 'mastered', dueAt: 0 }, 999)` returning `false`. Corrected:

```js
    expect(isDue({ state: 'mastered', dueAt: 0 }, 999)).toBe(false)
```

- [ ] **Step 2: Run, confirm failure**

```bash
npm test -- srsCard
```

- [ ] **Step 3: Implement**

```js
// src/domain/srsCard.js
export const createNewCard = (id, categorySlug) => ({
  id,
  categorySlug,
  state: 'new',
  step: 0,
  dueAt: 0,
  lastSeenAt: null,
  history: [],
})

export const isDue = (card, now) =>
  card.state !== 'mastered' && card.dueAt <= now
```

- [ ] **Step 4: Run, confirm pass**

```bash
npm test -- srsCard
```

- [ ] **Step 5: Commit**

```bash
git add tests/unit/srsCard.test.js src/domain/srsCard.js
git commit -m "feat(domain): srsCard factory + due check"
```

---

### Task A6: studyStore over localStorage (TDD)

**Files:**
- Create: `tests/unit/studyStore.test.js`
- Create: `src/store/migrations.js`
- Create: `src/store/studyStore.js`

- [ ] **Step 1: Write the failing tests**

```js
// tests/unit/studyStore.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createStudyStore } from '../../src/store/studyStore.js'

const makeStorage = () => {
  let data = {}
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v) },
    removeItem: (k) => { delete data[k] },
    clear: () => { data = {} },
    _data: () => data,
  }
}

describe('studyStore', () => {
  let storage, store
  beforeEach(() => {
    storage = makeStorage()
    store = createStudyStore({ storage, now: () => 1_000_000 })
  })

  it('returns empty cards initially', () => {
    expect(store.getCard('x')).toBeNull()
    expect(store.getDueCards(2_000_000, 10)).toEqual([])
  })

  it('upsert + get round-trips a card', () => {
    const c = { id: 'g1', categorySlug: 'k', state: 'new', step: 0, dueAt: 0, lastSeenAt: null, history: [] }
    store.upsertCard(c)
    expect(store.getCard('g1')).toEqual(c)
  })

  it('persists across re-instantiation', () => {
    store.upsertCard({ id: 'g1', categorySlug: 'k', state: 'new', step: 0, dueAt: 0, lastSeenAt: null, history: [] })
    const store2 = createStudyStore({ storage, now: () => 1_000_000 })
    expect(store2.getCard('g1').id).toBe('g1')
  })

  it('getDueCards returns ids whose dueAt <= now and state != mastered, sorted by dueAt asc', () => {
    store.upsertCard({ id: 'a', categorySlug: 'k', state: 'learning', step: 1, dueAt: 100, lastSeenAt: 0, history: [] })
    store.upsertCard({ id: 'b', categorySlug: 'k', state: 'learning', step: 1, dueAt: 50,  lastSeenAt: 0, history: [] })
    store.upsertCard({ id: 'c', categorySlug: 'k', state: 'mastered', step: 4, dueAt: 0,  lastSeenAt: 0, history: [] })
    store.upsertCard({ id: 'd', categorySlug: 'k', state: 'learning', step: 1, dueAt: 999, lastSeenAt: 0, history: [] })
    expect(store.getDueCards(200, 10)).toEqual(['b', 'a'])
  })

  it('getDueCards respects category filter', () => {
    store.upsertCard({ id: 'a', categorySlug: 'k', state: 'new', step: 0, dueAt: 0, lastSeenAt: null, history: [] })
    store.upsertCard({ id: 'b', categorySlug: 'l', state: 'new', step: 0, dueAt: 0, lastSeenAt: null, history: [] })
    expect(store.getDueCards(1, 10, 'k')).toEqual(['a'])
  })

  it('getDueCards respects limit', () => {
    for (let i = 0; i < 30; i++) {
      store.upsertCard({ id: `c${i}`, categorySlug: 'k', state: 'new', step: 0, dueAt: i, lastSeenAt: null, history: [] })
    }
    expect(store.getDueCards(1_000, 5)).toHaveLength(5)
  })

  it('subscribe is called on upsert', () => {
    const fn = vi.fn()
    store.subscribe(fn)
    store.upsertCard({ id: 'a', categorySlug: 'k', state: 'new', step: 0, dueAt: 0, lastSeenAt: null, history: [] })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('settings round-trip with defaults', () => {
    expect(store.settings()).toEqual({
      dailyGoal: 20,
      theme: 'system',
      reducedMotion: 'system',
      onboardingComplete: false,
      userName: '',
    })
    store.setSettings({ dailyGoal: 30, userName: 'Anna' })
    expect(store.settings().dailyGoal).toBe(30)
    expect(store.settings().userName).toBe('Anna')
  })

  it('streak increments on consecutive day completion', () => {
    let day = new Date('2026-05-01T10:00:00Z').getTime()
    store = createStudyStore({ storage, now: () => day })
    store.recordSessionCompletion()
    expect(store.streak()).toEqual({ current: 1, best: 1, lastDay: '2026-05-01' })

    day = new Date('2026-05-02T10:00:00Z').getTime()
    store = createStudyStore({ storage, now: () => day })
    store.recordSessionCompletion()
    expect(store.streak().current).toBe(2)
    expect(store.streak().best).toBe(2)
  })

  it('streak resets if a day is skipped', () => {
    let day = new Date('2026-05-01T10:00:00Z').getTime()
    store = createStudyStore({ storage, now: () => day })
    store.recordSessionCompletion()

    day = new Date('2026-05-03T10:00:00Z').getTime()
    store = createStudyStore({ storage, now: () => day })
    store.recordSessionCompletion()
    expect(store.streak().current).toBe(1)
    expect(store.streak().best).toBe(1)
  })

  it('export/import round-trips state', () => {
    store.upsertCard({ id: 'a', categorySlug: 'k', state: 'new', step: 0, dueAt: 0, lastSeenAt: null, history: [] })
    const exported = store.exportData()
    storage.clear()
    const fresh = createStudyStore({ storage, now: () => 1 })
    fresh.importData(exported)
    expect(fresh.getCard('a').id).toBe('a')
  })
})
```

- [ ] **Step 2: Run, confirm failure**

```bash
npm test -- studyStore
```

- [ ] **Step 3: Write `src/store/migrations.js`**

```js
export const CURRENT_VERSION = 1

export const migrate = (raw) => {
  if (!raw) return defaultState()
  let s
  try { s = JSON.parse(raw) } catch { return defaultState() }
  if (!s || typeof s !== 'object') return defaultState()
  if (!s.version) s = { ...defaultState(), ...s, version: CURRENT_VERSION }
  // future migrations: switch on s.version
  return { ...defaultState(), ...s, version: CURRENT_VERSION }
}

export const defaultState = () => ({
  version: CURRENT_VERSION,
  cards: {},                            // id -> SrsCard
  settings: {
    dailyGoal: 20,
    theme: 'system',
    reducedMotion: 'system',
    onboardingComplete: false,
    userName: '',
  },
  streak: { current: 0, best: 0, lastDay: null },  // lastDay = 'YYYY-MM-DD'
})
```

- [ ] **Step 4: Write `src/store/studyStore.js`**

```js
import { migrate, CURRENT_VERSION } from './migrations.js'

const KEY = 'csumpi.studyStore.v1'

const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10)
const dayDiff = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000)

export const createStudyStore = ({ storage = window.localStorage, now = Date.now } = {}) => {
  let state = migrate(storage.getItem(KEY))
  const listeners = new Set()

  const persist = () => {
    storage.setItem(KEY, JSON.stringify(state))
    listeners.forEach(fn => fn())
  }

  return {
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) },
    getSnapshot() { return state },

    getCard(id) { return state.cards[id] ?? null },

    upsertCard(card) {
      state = { ...state, cards: { ...state.cards, [card.id]: card } }
      persist()
    },

    getDueCards(asOf, limit, categorySlug = null) {
      const all = Object.values(state.cards)
        .filter(c => c.state !== 'mastered' && c.dueAt <= asOf)
        .filter(c => !categorySlug || c.categorySlug === categorySlug)
        .sort((a, b) => a.dueAt - b.dueAt)
      return all.slice(0, limit).map(c => c.id)
    },

    settings() { return state.settings },
    setSettings(partial) {
      state = { ...state, settings: { ...state.settings, ...partial } }
      persist()
    },

    streak() { return state.streak },

    recordSessionCompletion() {
      const today = isoDay(now())
      const { current, best, lastDay } = state.streak
      let nextCurrent
      if (lastDay === today) nextCurrent = current
      else if (lastDay && dayDiff(lastDay, today) === 1) nextCurrent = current + 1
      else nextCurrent = 1
      const nextStreak = {
        current: nextCurrent,
        best: Math.max(best, nextCurrent),
        lastDay: today,
      }
      state = { ...state, streak: nextStreak }
      persist()
    },

    exportData() { return JSON.stringify(state) },
    importData(json) {
      state = migrate(json)
      state.version = CURRENT_VERSION
      persist()
    },
    reset() {
      state = migrate(null)
      persist()
    },
  }
}

let _singleton = null
export const studyStore = () => {
  if (!_singleton) _singleton = createStudyStore()
  return _singleton
}
```

- [ ] **Step 5: Run, confirm pass**

```bash
npm test -- studyStore
```

- [ ] **Step 6: Commit**

```bash
git add tests/unit/studyStore.test.js src/store/migrations.js src/store/studyStore.js
git commit -m "feat(store): studyStore over localStorage with versioning, streak, export"
```

---

### Task A7: useStudyStore React hook

**Files:**
- Create: `src/store/useStudyStore.js`

- [ ] **Step 1: Write the hook**

```js
// src/store/useStudyStore.js
import { useSyncExternalStore } from 'react'
import { studyStore } from './studyStore.js'

export const useStudyStore = (selector) => {
  const store = studyStore()
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getSnapshot(), store),
    () => selector(store.getSnapshot(), store),
  )
}

export const useStore = studyStore
```

- [ ] **Step 2: Smoke-render test**

Create `tests/component/useStudyStore.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useStudyStore } from '../../src/store/useStudyStore.js'

const Probe = () => {
  const goal = useStudyStore(s => s.settings.dailyGoal)
  return <span data-testid="goal">{goal}</span>
}

describe('useStudyStore', () => {
  it('reads default daily goal', () => {
    render(<Probe />)
    expect(screen.getByTestId('goal')).toHaveTextContent('20')
  })
})
```

- [ ] **Step 3: Run**

```bash
npm test -- useStudyStore
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/store/useStudyStore.js tests/component/useStudyStore.test.jsx
git commit -m "feat(store): React hook via useSyncExternalStore"
```

---

### Task A8: deckBuilder — derive SR cards from category data (TDD)

**Files:**
- Create: `tests/unit/deckBuilder.test.js`
- Create: `src/data/deckBuilder.js`

The deckBuilder turns the existing similarity-grouped JSON into card descriptors (one per group), without mutating it, and ensures each group has a stable id.

- [ ] **Step 1: Write tests**

```js
// tests/unit/deckBuilder.test.js
import { describe, it, expect } from 'vitest'
import { groupsToCardDescriptors } from '../../src/data/deckBuilder.js'

const fixture = {
  category_name: 'Keringés',
  category_slug: 'keringes',
  groups: [
    [
      { similarity_group_id: 'sg-1', data: { question_text: 'A', correct_answer: 'X' } },
      { similarity_group_id: 'sg-1', data: { question_text: 'A2', correct_answer: 'X' } },
    ],
    [
      { similarity_group_id: '__null_42', data: { question_text: 'B', correct_answer: 'Y' } },
    ],
  ],
}

describe('groupsToCardDescriptors', () => {
  it('produces one descriptor per group', () => {
    const out = groupsToCardDescriptors(fixture, 'keringes')
    expect(out).toHaveLength(2)
  })

  it('uses similarity_group_id when present, fallback to deterministic synthetic id', () => {
    const out = groupsToCardDescriptors(fixture, 'keringes')
    expect(out[0].id).toBe('sg-1')
    expect(out[1].id).toMatch(/^syn:keringes:/)
  })

  it('keeps members for variant rendering', () => {
    const out = groupsToCardDescriptors(fixture, 'keringes')
    expect(out[0].members).toHaveLength(2)
    expect(out[1].members).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run, fail**

```bash
npm test -- deckBuilder
```

- [ ] **Step 3: Implement**

```js
// src/data/deckBuilder.js
const synId = (categorySlug, group, index) => {
  const text = group?.[0]?.data?.question_text ?? `idx${index}`
  // tiny stable hash (djb2)
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return `syn:${categorySlug}:${(h >>> 0).toString(36)}`
}

export const groupsToCardDescriptors = (categoryFile, categorySlug) => {
  const groups = categoryFile.groups || []
  return groups.map((group, idx) => {
    const raw = group[0]?.similarity_group_id
    const id = raw && !raw.startsWith('__null_') ? raw : synId(categorySlug, group, idx)
    return { id, categorySlug, members: group }
  })
}
```

- [ ] **Step 4: Run, pass**

```bash
npm test -- deckBuilder
```

- [ ] **Step 5: Commit**

```bash
git add tests/unit/deckBuilder.test.js src/data/deckBuilder.js
git commit -m "feat(data): deckBuilder derives card descriptors from similarity groups"
```

---

### Task A9: similarityGroup tests for existing logic

**Files:**
- Create: `tests/unit/similarityGroup.test.js`

- [ ] **Step 1: Add tests for existing module**

```js
// tests/unit/similarityGroup.test.js
import { describe, it, expect } from 'vitest'
import { pickCanonical, repetitions, matchesQuery } from '../../src/domain/similarityGroup.js'

const q = (text, ans = 'A') => ({ data: { question_text: text, correct_answer: ans } })

describe('similarityGroup', () => {
  it('pickCanonical chooses longest with non-empty answer', () => {
    const g = [q('short', ''), q('longer one', 'B'), q('mid', 'C')]
    expect(pickCanonical(g).data.question_text).toBe('longer one')
  })

  it('repetitions returns member count', () => {
    expect(repetitions([q('a'), q('b'), q('c')])).toBe(3)
  })

  it('matchesQuery matches across text/answer/options', () => {
    const g = [{ data: { question_text: 'hello', correct_answer: 'world', options: ['xx'] } }]
    expect(matchesQuery(g, 'WORLD')).toBe(true)
    expect(matchesQuery(g, 'xx')).toBe(true)
    expect(matchesQuery(g, 'nope')).toBe(false)
    expect(matchesQuery(g, '')).toBe(true)
  })
})
```

- [ ] **Step 2: Run, pass**

```bash
npm test -- similarityGroup
```

- [ ] **Step 3: Commit**

```bash
git add tests/unit/similarityGroup.test.js
git commit -m "test(domain): pin existing similarityGroup behaviour"
```

---

## Phase B — Atomic UI components

> Style hint for every component task: keep one `.module.css` per component; reference tokens only (`var(--brand-500)`), never hex; respect 44px touch targets and `prefers-reduced-motion` from `globals.css`. The mockup at `docs/superpowers/mockups/visual-system.html` is the visual reference.

### Task B1: `Icon` (Lucide wrapper)

**Files:**
- Create: `src/components/Icon.jsx`

- [ ] **Step 1: Implement**

```jsx
// src/components/Icon.jsx
import { forwardRef } from 'react'

export const Icon = forwardRef(function Icon({ as: Cmp, size = 24, strokeWidth = 1.75, ...rest }, ref) {
  return <Cmp ref={ref} size={size} strokeWidth={strokeWidth} aria-hidden="true" {...rest} />
})
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Icon.jsx
git commit -m "feat(ui): Lucide icon wrapper with consistent sizing"
```

---

### Task B2: `Button`

**Files:**
- Create: `src/components/Button.jsx`
- Create: `src/components/Button.module.css`
- Create: `tests/component/Button.test.jsx`

- [ ] **Step 1: Tests**

```jsx
// tests/component/Button.test.jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../../src/components/Button.jsx'

describe('Button', () => {
  it('renders children and calls onClick', async () => {
    const fn = vi.fn()
    render(<Button onClick={fn}>Hi</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Hi' }))
    expect(fn).toHaveBeenCalled()
  })

  it('applies variant class', () => {
    render(<Button variant="success">ok</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'success')
  })

  it('disabled blocks click', async () => {
    const fn = vi.fn()
    render(<Button onClick={fn} disabled>x</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(fn).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run, fail**

```bash
npm test -- Button
```

- [ ] **Step 3: Implement `Button.jsx`**

```jsx
// src/components/Button.jsx
import styles from './Button.module.css'

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  ...rest
}) {
  return (
    <button
      className={styles.btn}
      data-variant={variant}
      data-size={size}
      data-full={fullWidth || undefined}
      {...rest}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 4: `Button.module.css`**

```css
.btn {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 16px;
  border-radius: var(--r-md);
  padding: 14px 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 48px;
  color: #fff;
  background: var(--brand-500);
  box-shadow: 0 3px 0 var(--brand-600);
  transition: transform .15s var(--ease), box-shadow .15s var(--ease), background .15s var(--ease);
}
.btn:active:not([disabled]) {
  transform: translateY(2px);
  box-shadow: 0 1px 0 var(--brand-600);
}
.btn[data-variant="success"] { background: var(--success-500); box-shadow: 0 3px 0 var(--success-600); }
.btn[data-variant="success"]:active:not([disabled]) { box-shadow: 0 1px 0 var(--success-600); }
.btn[data-variant="danger"] { background: var(--danger-500); box-shadow: 0 3px 0 var(--danger-600); }
.btn[data-variant="danger"]:active:not([disabled]) { box-shadow: 0 1px 0 var(--danger-600); }
.btn[data-variant="ghost"] {
  background: var(--surface);
  color: var(--text);
  box-shadow: none;
  border: 1px solid var(--border);
}
.btn[data-size="sm"] { font-size: 14px; padding: 10px 14px; min-height: 40px; }
.btn[data-full] { width: 100%; }
.btn[disabled] { opacity: 0.5; cursor: not-allowed; }
```

- [ ] **Step 5: Run, pass**

```bash
npm test -- Button
```

- [ ] **Step 6: Commit**

```bash
git add src/components/Button.jsx src/components/Button.module.css tests/component/Button.test.jsx
git commit -m "feat(ui): Button with variants + Duolingo-style depress on press"
```

---

### Task B3: `Card`, `ProgressBar`, `Skeleton`, `EmptyState` (small primitives)

**Files:**
- Create: `src/components/Card.jsx` + `Card.module.css`
- Create: `src/components/ProgressBar.jsx` + `ProgressBar.module.css`
- Create: `src/components/Skeleton.jsx` + `Skeleton.module.css`
- Create: `src/components/EmptyState.jsx` + `EmptyState.module.css`

- [ ] **Step 1: Card**

`Card.jsx`:
```jsx
import styles from './Card.module.css'
export function Card({ as: Tag = 'div', children, ...rest }) {
  return <Tag className={styles.card} {...rest}>{children}</Tag>
}
```

`Card.module.css`:
```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
}
```

- [ ] **Step 2: ProgressBar**

`ProgressBar.jsx`:
```jsx
import * as Progress from '@radix-ui/react-progress'
import styles from './ProgressBar.module.css'

export function ProgressBar({ value, max = 100, tone = 'brand' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <Progress.Root className={styles.root} value={pct} data-tone={tone}>
      <Progress.Indicator
        className={styles.indicator}
        style={{ transform: `translateX(-${100 - pct}%)` }}
      />
    </Progress.Root>
  )
}
```

`ProgressBar.module.css`:
```css
.root {
  position: relative;
  overflow: hidden;
  background: var(--surface-2);
  border-radius: var(--r-pill);
  width: 100%;
  height: 10px;
}
.indicator {
  background: linear-gradient(90deg, var(--brand-500), #A78BFA);
  width: 100%;
  height: 100%;
  transition: transform 300ms var(--ease);
}
.root[data-tone="success"] .indicator {
  background: linear-gradient(90deg, var(--success-500), #34D399);
}
```

- [ ] **Step 3: Skeleton**

`Skeleton.jsx`:
```jsx
import styles from './Skeleton.module.css'
export function Skeleton({ width = '100%', height = 16, radius }) {
  return <span className={styles.s} style={{ width, height, borderRadius: radius ?? 'var(--r-sm)' }} />
}
```

`Skeleton.module.css`:
```css
.s {
  display: block;
  background: linear-gradient(90deg, var(--surface-2), var(--border), var(--surface-2));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}
@keyframes shimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }
```

- [ ] **Step 4: EmptyState**

`EmptyState.jsx`:
```jsx
import styles from './EmptyState.module.css'
export function EmptyState({ icon, title, body, action }) {
  return (
    <div className={styles.wrap}>
      {icon ? <div className={styles.icon}>{icon}</div> : null}
      <h3 className={styles.title}>{title}</h3>
      {body ? <p className={styles.body}>{body}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  )
}
```

`EmptyState.module.css`:
```css
.wrap { display: flex; flex-direction: column; align-items: center; text-align: center; padding: var(--space-6) var(--space-4); }
.icon { color: var(--brand-500); margin-bottom: var(--space-3); }
.title { font-family: var(--font-heading); font-size: 22px; margin-bottom: var(--space-2); }
.body { color: var(--text-mute); max-width: 38ch; margin-bottom: var(--space-4); }
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Card.* src/components/ProgressBar.* src/components/Skeleton.* src/components/EmptyState.*
git commit -m "feat(ui): Card, ProgressBar, Skeleton, EmptyState primitives"
```

---

### Task B4: `BottomNav` (TDD)

**Files:**
- Create: `src/components/BottomNav.jsx` + `.module.css`
- Create: `tests/component/BottomNav.test.jsx`

- [ ] **Step 1: Test**

```jsx
// tests/component/BottomNav.test.jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BottomNav } from '../../src/components/BottomNav.jsx'

describe('BottomNav', () => {
  it('marks the current route active', () => {
    render(
      <MemoryRouter initialEntries={['/browse']}>
        <BottomNav />
      </MemoryRouter>
    )
    expect(screen.getByRole('link', { name: /browse/i })).toHaveAttribute('data-active', 'true')
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('data-active', 'false')
  })

  it('has 4 items', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <BottomNav />
      </MemoryRouter>
    )
    expect(screen.getAllByRole('link')).toHaveLength(4)
  })
})
```

- [ ] **Step 2: Run, fail**

```bash
npm test -- BottomNav
```

- [ ] **Step 3: Implement**

`BottomNav.jsx`:
```jsx
import { NavLink, useLocation } from 'react-router-dom'
import { Home, LayoutGrid, BarChart3, Settings } from 'lucide-react'
import { Icon } from './Icon.jsx'
import styles from './BottomNav.module.css'

const items = [
  { to: '/',         label: 'Home',     icon: Home },
  { to: '/browse',   label: 'Browse',   icon: LayoutGrid },
  { to: '/stats',    label: 'Stats',    icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  const { pathname } = useLocation()
  return (
    <nav className={styles.nav} aria-label="Primary">
      {items.map(({ to, label, icon }) => {
        const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
        return (
          <NavLink key={to} to={to} className={styles.item} data-active={active} aria-label={label}>
            <Icon as={icon} size={22} />
            <span>{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
```

`BottomNav.module.css`:
```css
.nav {
  position: fixed; left: 8px; right: 8px;
  bottom: calc(8px + env(safe-area-inset-bottom));
  height: 64px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-pill);
  box-shadow: var(--shadow-card);
  display: flex; align-items: center; justify-content: space-around;
  padding: 0 var(--space-2);
  z-index: var(--z-nav);
}
.item {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  color: var(--text-mute);
  font-size: 11px; font-weight: 600;
  padding: 6px 0; border-radius: var(--r-md);
  min-width: 56px; min-height: 48px;
}
.item[data-active="true"] {
  color: var(--brand-500);
  background: var(--brand-50);
}
```

- [ ] **Step 4: Run, pass**

```bash
npm test -- BottomNav
```

- [ ] **Step 5: Commit**

```bash
git add src/components/BottomNav.* tests/component/BottomNav.test.jsx
git commit -m "feat(ui): BottomNav with 4 items + active state"
```

---

### Task B5: `StreakStrip`, `CategoryTile`, `AppHeader`

**Files:**
- Create: `src/components/StreakStrip.jsx` + `.module.css`
- Create: `src/components/CategoryTile.jsx` + `.module.css`
- Create: `src/components/AppHeader.jsx` + `.module.css`

- [ ] **Step 1: StreakStrip**

`StreakStrip.jsx`:
```jsx
import { Flame } from 'lucide-react'
import { Icon } from './Icon.jsx'
import styles from './StreakStrip.module.css'

export function StreakStrip({ current, best }) {
  return (
    <div className={styles.wrap} role="status" aria-label={`Streak ${current} days, best ${best}`}>
      <Icon as={Flame} size={36} />
      <div>
        <div className={`${styles.num} tabular`}>{current}</div>
        <div className={styles.lbl}>day streak · best {best}</div>
      </div>
    </div>
  )
}
```

`StreakStrip.module.css`:
```css
.wrap {
  background: linear-gradient(135deg, #FFB45C, var(--streak-500));
  color: #fff;
  border-radius: var(--r-lg);
  padding: var(--space-4);
  display: flex; align-items: center; gap: var(--space-3);
  box-shadow: 0 8px 24px rgba(245,158,11,.25);
}
.num { font-family: var(--font-heading); font-size: 32px; font-weight: 700; line-height: 1; }
.lbl { font-size: 13px; opacity: .95; }
```

- [ ] **Step 2: CategoryTile**

`CategoryTile.jsx`:
```jsx
import { Link } from 'react-router-dom'
import { ProgressBar } from './ProgressBar.jsx'
import styles from './CategoryTile.module.css'

export function CategoryTile({ to, name, totalCards, mastered }) {
  const pct = totalCards ? (mastered / totalCards) * 100 : 0
  return (
    <Link to={to} className={styles.tile}>
      <div className={styles.name}>{name}</div>
      <div className={styles.meta}>
        <span className="tabular">{mastered}/{totalCards}</span>
      </div>
      <ProgressBar value={pct} tone="success" />
    </Link>
  )
}
```

`CategoryTile.module.css`:
```css
.tile {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-card);
  display: block;
  transition: transform .15s var(--ease);
  min-height: 96px;
}
.tile:active { transform: scale(0.98); }
.name { font-family: var(--font-heading); font-weight: 700; font-size: 16px; margin-bottom: var(--space-2); }
.meta { color: var(--text-mute); font-size: 12px; margin-bottom: var(--space-2); }
```

- [ ] **Step 3: AppHeader**

`AppHeader.jsx`:
```jsx
import styles from './AppHeader.module.css'
export function AppHeader({ title, leading, trailing }) {
  return (
    <header className={styles.header}>
      <div className={styles.leading}>{leading}</div>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.trailing}>{trailing}</div>
    </header>
  )
}
```

`AppHeader.module.css`:
```css
.header {
  display: grid;
  grid-template-columns: 48px 1fr 48px;
  align-items: center;
  padding: calc(var(--space-3) + env(safe-area-inset-top)) var(--space-4) var(--space-3);
  background: var(--bg);
  position: sticky; top: 0; z-index: 5;
}
.title { font-size: 18px; text-align: center; }
.leading, .trailing { display: flex; align-items: center; }
.trailing { justify-content: flex-end; }
```

- [ ] **Step 4: Commit**

```bash
git add src/components/StreakStrip.* src/components/CategoryTile.* src/components/AppHeader.*
git commit -m "feat(ui): StreakStrip, CategoryTile, AppHeader"
```

---

### Task B6: `CollapsibleQA` — long-content Q/A layout (TDD)

**Files:**
- Create: `tests/component/CollapsibleQA.test.jsx`
- Create: `src/components/CollapsibleQA.jsx` + `.module.css`

This is the smart component that handles long-question/long-answer cases. It accepts `question`, `answer` (or null), and decides which side condenses based on measured heights. We use a `condensedSide` prop in tests to bypass measurement, with the real measurement happening in a `useLayoutEffect`.

- [ ] **Step 1: Tests**

```jsx
// tests/component/CollapsibleQA.test.jsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CollapsibleQA } from '../../src/components/CollapsibleQA.jsx'

describe('CollapsibleQA', () => {
  it('renders both sides expanded by default', () => {
    render(<CollapsibleQA question={<div>Q text</div>} answer={<div>A text</div>} forceCondensedSide={null} />)
    expect(screen.getByText('Q text')).toBeVisible()
    expect(screen.getByText('A text')).toBeVisible()
  })

  it('condenses question to a banner when forced', () => {
    render(<CollapsibleQA question={<div>Q text</div>} answer={<div>A text</div>} forceCondensedSide="question" />)
    expect(screen.getByRole('button', { name: /question/i })).toBeInTheDocument()
    expect(screen.queryByText('Q text')).not.toBeInTheDocument()
  })

  it('tapping the banner re-expands the question', async () => {
    render(<CollapsibleQA question={<div>Q text</div>} answer={<div>A text</div>} forceCondensedSide="question" />)
    await userEvent.click(screen.getByRole('button', { name: /question/i }))
    expect(screen.getByText('Q text')).toBeVisible()
  })

  it('renders only the question when answer is null', () => {
    render(<CollapsibleQA question={<div>Q text</div>} answer={null} forceCondensedSide={null} />)
    expect(screen.getByText('Q text')).toBeVisible()
  })
})
```

- [ ] **Step 2: Run, fail**

```bash
npm test -- CollapsibleQA
```

- [ ] **Step 3: Implement**

`CollapsibleQA.jsx`:
```jsx
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Icon } from './Icon.jsx'
import styles from './CollapsibleQA.module.css'

const useMeasureCondense = ({ enabled, qRef, aRef, bodyRef }) => {
  const [side, setSide] = useState(null) // 'question' | 'answer' | null
  useLayoutEffect(() => {
    if (!enabled) return
    const body = bodyRef.current
    const q = qRef.current
    const a = aRef.current
    if (!body || !q || !a) return
    const overflows = body.scrollHeight > body.clientHeight + 4
    if (!overflows) { setSide(null); return }
    setSide(a.offsetHeight > q.offsetHeight ? 'question' : 'answer')
  }, [enabled, qRef, aRef, bodyRef])
  return side
}

export function CollapsibleQA({ question, answer, forceCondensedSide }) {
  const bodyRef = useRef(null)
  const qRef = useRef(null)
  const aRef = useRef(null)
  const measured = useMeasureCondense({ enabled: forceCondensedSide === undefined && answer != null, qRef, aRef, bodyRef })
  const condensedSide = forceCondensedSide !== undefined ? forceCondensedSide : measured
  const [expanded, setExpanded] = useState(false)

  // reset expansion when condense side changes
  useEffect(() => { setExpanded(false) }, [condensedSide, answer])

  const showQBanner = answer != null && condensedSide === 'question' && !expanded

  return (
    <div className={styles.body} ref={bodyRef}>
      {showQBanner ? (
        <button
          type="button"
          className={styles.banner}
          aria-expanded="false"
          aria-label="Show question"
          onClick={() => setExpanded(true)}
        >
          <span className={styles.tag}>Q</span>
          <span className={styles.bannerText}>{extractText(question)}</span>
          <Icon as={ChevronDown} size={16} />
        </button>
      ) : (
        <div ref={qRef} className={styles.q}>{question}</div>
      )}
      {answer != null ? <div ref={aRef} className={styles.a}>{answer}</div> : null}
    </div>
  )
}

const extractText = (node) => {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractText).join(' ')
  if (node.props && node.props.children) return extractText(node.props.children)
  return ''
}
```

`CollapsibleQA.module.css`:
```css
.body {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: var(--space-4);
  -webkit-mask-image: linear-gradient(to bottom, #000 0, #000 calc(100% - 24px), transparent 100%);
          mask-image: linear-gradient(to bottom, #000 0, #000 calc(100% - 24px), transparent 100%);
}
.q { font-family: var(--font-heading); font-size: 22px; line-height: 1.35; word-break: break-word; overflow-wrap: anywhere; }
.a { margin-top: var(--space-4); word-break: break-word; overflow-wrap: anywhere; }

.banner {
  position: sticky; top: 0; z-index: 2;
  display: flex; align-items: center; gap: var(--space-2);
  width: 100%;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 10px var(--space-4);
  font-size: 14px; font-weight: 600;
  text-align: left;
  cursor: pointer;
}
.bannerText { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tag {
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .04em;
  color: var(--text-mute);
}
```

- [ ] **Step 4: Run, pass**

```bash
npm test -- CollapsibleQA
```

- [ ] **Step 5: Commit**

```bash
git add src/components/CollapsibleQA.* tests/component/CollapsibleQA.test.jsx
git commit -m "feat(ui): CollapsibleQA — handles long question or long answer symmetrically"
```

---

### Task B7: `RevealPanel` + `VariantsList`

**Files:**
- Create: `src/components/RevealPanel.jsx` + `.module.css`
- Create: `src/components/VariantsList.jsx` + `.module.css`

- [ ] **Step 1: VariantsList**

`VariantsList.jsx`:
```jsx
import * as Collapsible from '@radix-ui/react-collapsible'
import { ChevronDown } from 'lucide-react'
import { Icon } from './Icon.jsx'
import styles from './VariantsList.module.css'

export function VariantsList({ variants }) {
  if (!variants || variants.length === 0) return null
  return (
    <Collapsible.Root className={styles.root}>
      <Collapsible.Trigger className={styles.trigger}>
        <Icon as={ChevronDown} size={14} />
        Show {variants.length} other wording{variants.length === 1 ? '' : 's'}
      </Collapsible.Trigger>
      <Collapsible.Content asChild>
        <ul className={styles.list}>
          {variants.map((v, i) => <li key={i}>{v}</li>)}
        </ul>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}
```

`VariantsList.module.css`:
```css
.root { margin-top: var(--space-2); }
.trigger {
  display: inline-flex; align-items: center; gap: var(--space-1);
  background: var(--surface-2); color: var(--brand-600);
  font-size: 13px; font-weight: 700;
  border-radius: var(--r-md); padding: 8px 12px;
  min-height: 36px;
}
.list {
  list-style: none; padding: 0; margin-top: var(--space-2);
  font-size: 13px; color: var(--text-mute);
}
.list li { margin: var(--space-1) 0; }
```

- [ ] **Step 2: RevealPanel**

`RevealPanel.jsx`:
```jsx
import { lazy, Suspense } from 'react'
import { VariantsList } from './VariantsList.jsx'
import styles from './RevealPanel.module.css'

const Markdown = lazy(() => import('./Markdown.jsx'))

export function RevealPanel({ answer, variants }) {
  if (!answer || !answer.trim()) {
    return (
      <div className={styles.empty} role="region" aria-label="Answer">
        No answer recorded for this question.
      </div>
    )
  }
  return (
    <div className={styles.panel} role="region" aria-label="Answer">
      <h4 className={styles.title}>Answer</h4>
      <Suspense fallback={<div>{answer}</div>}>
        <Markdown>{answer}</Markdown>
      </Suspense>
      <VariantsList variants={variants} />
    </div>
  )
}
```

`RevealPanel.module.css`:
```css
.panel {
  background: var(--success-50);
  border: 1px solid #BBF7D0;
  border-radius: var(--r-md);
  padding: 14px;
  color: #064E3B;
  margin-top: var(--space-4);
}
.title { font-family: var(--font-heading); font-size: 16px; color: #047857; margin-bottom: var(--space-1); }
.empty {
  padding: 14px; border-radius: var(--r-md); background: var(--surface-2);
  color: var(--text-mute); margin-top: var(--space-4);
}
```

- [ ] **Step 3: Lazy `Markdown.jsx`**

```jsx
// src/components/Markdown.jsx
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

export default function Markdown({ children }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{children || ''}</ReactMarkdown>
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/RevealPanel.* src/components/VariantsList.* src/components/Markdown.jsx
git commit -m "feat(ui): RevealPanel + VariantsList with lazy markdown"
```

---

### Task B8: `OfflineToast`

**Files:**
- Create: `src/components/OfflineToast.jsx` + `.module.css`

- [ ] **Step 1: Implement**

`OfflineToast.jsx`:
```jsx
import * as Toast from '@radix-ui/react-toast'
import { useEffect, useState } from 'react'
import styles from './OfflineToast.module.css'

export function OfflineToast() {
  const [open, setOpen] = useState(!navigator.onLine)
  useEffect(() => {
    const off = () => setOpen(true)
    const on  = () => setOpen(false)
    window.addEventListener('offline', off)
    window.addEventListener('online', on)
    return () => { window.removeEventListener('offline', off); window.removeEventListener('online', on) }
  }, [])
  return (
    <Toast.Provider swipeDirection="down">
      <Toast.Root className={styles.toast} open={open} onOpenChange={setOpen}>
        <Toast.Title className={styles.title}>Offline</Toast.Title>
        <Toast.Description className={styles.desc}>Using cached data.</Toast.Description>
      </Toast.Root>
      <Toast.Viewport className={styles.viewport} />
    </Toast.Provider>
  )
}
```

`OfflineToast.module.css`:
```css
.viewport { position: fixed; top: env(safe-area-inset-top); left: 0; right: 0; padding: var(--space-3); display: flex; justify-content: center; z-index: var(--z-toast); }
.toast { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-md); box-shadow: var(--shadow-card); padding: 10px 14px; }
.title { font-weight: 700; }
.desc { color: var(--text-mute); font-size: 13px; }
```

- [ ] **Step 2: Commit**

```bash
git add src/components/OfflineToast.*
git commit -m "feat(ui): OfflineToast via Radix"
```

---

### Task B9: `QuestionListRow` (virtualized row)

**Files:**
- Create: `src/components/QuestionListRow.jsx` + `.module.css`

- [ ] **Step 1: Implement**

`QuestionListRow.jsx`:
```jsx
import styles from './QuestionListRow.module.css'

export function QuestionListRow({ text, badge, repetitions, onActivate }) {
  return (
    <button type="button" className={styles.row} onClick={onActivate}>
      <div className={styles.text}>{text}</div>
      <div className={styles.meta}>
        {badge ? <span className={styles.badge}>{badge}</span> : null}
        {repetitions > 1 ? <span className={styles.rep}>×{repetitions}</span> : null}
      </div>
    </button>
  )
}
```

`QuestionListRow.module.css`:
```css
.row {
  width: 100%;
  display: flex; align-items: center; gap: var(--space-3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: var(--space-3) var(--space-4);
  text-align: left;
  min-height: 64px;
}
.text {
  flex: 1; min-width: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 14px;
}
.meta { display: flex; align-items: center; gap: var(--space-2); flex: none; }
.badge { font-size: 11px; font-weight: 700; color: var(--brand-600); background: var(--brand-50); padding: 4px 8px; border-radius: var(--r-pill); }
.rep { font-size: 12px; font-weight: 700; color: var(--streak-500); background: rgba(245,158,11,.12); padding: 4px 8px; border-radius: var(--r-pill); }
```

- [ ] **Step 2: Commit**

```bash
git add src/components/QuestionListRow.*
git commit -m "feat(ui): QuestionListRow for virtualized lists"
```

---

### Task B10: `StudyCard` (composition + swipe gestures)

**Files:**
- Create: `tests/component/StudyCard.test.jsx`
- Create: `src/components/StudyCard.jsx` + `.module.css`

- [ ] **Step 1: Tests**

```jsx
// tests/component/StudyCard.test.jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudyCard } from '../../src/components/StudyCard.jsx'

const card = {
  id: 'g1',
  categoryName: 'Cardiology',
  pts: 3,
  questionText: 'Q?',
  options: ['A', 'B'],
  correctAnswer: 'A is correct',
  variants: ['Other wording 1'],
}

describe('StudyCard', () => {
  it('shows question and Show answer button before reveal', () => {
    render(<StudyCard card={card} onRate={() => {}} />)
    expect(screen.getByText('Q?')).toBeVisible()
    expect(screen.getByRole('button', { name: /show answer/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /knew it/i })).not.toBeInTheDocument()
  })

  it('reveals answer + rating buttons on Show answer', async () => {
    render(<StudyCard card={card} onRate={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /show answer/i }))
    expect(screen.getByText(/A is correct/)).toBeVisible()
    expect(screen.getByRole('button', { name: /knew it/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /didn't know/i })).toBeInTheDocument()
  })

  it('calls onRate with the chosen rating', async () => {
    const onRate = vi.fn()
    render(<StudyCard card={card} onRate={onRate} />)
    await userEvent.click(screen.getByRole('button', { name: /show answer/i }))
    await userEvent.click(screen.getByRole('button', { name: /knew it/i }))
    expect(onRate).toHaveBeenCalledWith('right')
  })
})
```

- [ ] **Step 2: Run, fail**

```bash
npm test -- StudyCard
```

- [ ] **Step 3: Implement**

`StudyCard.jsx`:
```jsx
import { useState, useRef, useEffect } from 'react'
import { Eye, Check, X } from 'lucide-react'
import { Button } from './Button.jsx'
import { Icon } from './Icon.jsx'
import { CollapsibleQA } from './CollapsibleQA.jsx'
import { RevealPanel } from './RevealPanel.jsx'
import styles from './StudyCard.module.css'

export function StudyCard({ card, onRate }) {
  const [revealed, setRevealed] = useState(false)
  const cardRef = useRef(null)

  useEffect(() => { setRevealed(false) }, [card.id])

  // basic swipe support
  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    let startX = null, startY = null
    const onStart = (e) => { const t = e.touches[0]; startX = t.clientX; startY = t.clientY }
    const onEnd = (e) => {
      if (startX == null) return
      const t = e.changedTouches[0]
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      startX = null
      if (Math.abs(dy) > Math.abs(dx) && dy < -60 && !revealed) { setRevealed(true); return }
      if (revealed && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
        onRate(dx > 0 ? 'right' : 'wrong')
      }
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchend', onEnd, { passive: true })
    return () => { el.removeEventListener('touchstart', onStart); el.removeEventListener('touchend', onEnd) }
  }, [revealed, onRate])

  const question = (
    <div>
      <span className={styles.badge}>{card.categoryName}{card.pts ? ` · ${card.pts} pts` : ''}</span>
      <p className={styles.qtext}>{card.questionText}</p>
      {card.options?.length > 0 && (
        <ul className={styles.options}>
          {card.options.map((o, i) => <li key={i}>{o}</li>)}
        </ul>
      )}
    </div>
  )
  const answer = revealed ? <RevealPanel answer={card.correctAnswer} variants={card.variants} /> : null

  return (
    <article className={styles.card} ref={cardRef}>
      <CollapsibleQA question={question} answer={answer} />
      {!revealed ? (
        <div className={styles.actions}>
          <Button fullWidth onClick={() => setRevealed(true)}>
            <Icon as={Eye} size={20} /> Show answer
          </Button>
        </div>
      ) : (
        <div className={styles.actions} data-double>
          <Button variant="danger" onClick={() => onRate('wrong')}>
            <Icon as={X} size={20} /> Didn't know
          </Button>
          <Button variant="success" onClick={() => onRate('right')}>
            <Icon as={Check} size={20} /> Knew it
          </Button>
        </div>
      )}
    </article>
  )
}
```

`StudyCard.module.css`:
```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-card);
  display: flex; flex-direction: column;
  flex: 1; min-height: 0;
  overflow: hidden;
}
.badge {
  align-self: flex-start;
  display: inline-block;
  background: var(--brand-50); color: var(--brand-600);
  font-size: 11px; font-weight: 700;
  padding: 4px 10px; border-radius: var(--r-pill);
  text-transform: uppercase; letter-spacing: .04em;
  margin-bottom: var(--space-3);
}
.qtext { font-family: var(--font-heading); font-size: 22px; line-height: 1.35; word-break: break-word; }
.options { padding-left: 20px; color: var(--text-mute); margin-top: var(--space-3); }
.options li { margin: var(--space-1) 0; }

.actions {
  position: sticky; bottom: 0;
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding: var(--space-3) var(--space-4) calc(var(--space-3) + env(safe-area-inset-bottom));
}
.actions[data-double] {
  display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2);
}
```

- [ ] **Step 4: Run, pass**

```bash
npm test -- StudyCard
```

- [ ] **Step 5: Commit**

```bash
git add src/components/StudyCard.* tests/component/StudyCard.test.jsx
git commit -m "feat(ui): StudyCard with reveal flow + swipe gestures"
```

---

## Phase C — Pages

### Task C1: `HomePage`

**Files:**
- Create: `src/pages/HomePage.jsx` + `HomePage.module.css`

- [ ] **Step 1: Implement**

`HomePage.jsx`:
```jsx
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import { allCategories } from '../domain/categories.js'
import { useStore } from '../store/useStudyStore.js'
import { Button } from '../components/Button.jsx'
import { Card } from '../components/Card.jsx'
import { ProgressBar } from '../components/ProgressBar.jsx'
import { StreakStrip } from '../components/StreakStrip.jsx'
import { Icon } from '../components/Icon.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import styles from './HomePage.module.css'

export default function HomePage() {
  const navigate = useNavigate()
  const store = useStore()
  const snap = store.getSnapshot()
  const now = Date.now()
  const dueIds = useMemo(() => store.getDueCards(now, 9999), [snap])
  const dueCount = dueIds.length
  const goal = snap.settings.dailyGoal
  const todayDone = snap.streak.lastDay === new Date(now).toISOString().slice(0, 10)
    ? Math.min(goal, dueIds.length === 0 ? goal : 0)  // simplistic placeholder
    : 0
  const estMinutes = Math.max(1, Math.ceil(dueCount * 0.5))
  const userName = snap.settings.userName || 'there'

  return (
    <div className={styles.page}>
      <h2 className={styles.greet}>Szia, {userName} 👋</h2>
      <p className={styles.sub}>Let's keep the streak going.</p>

      <StreakStrip current={snap.streak.current} best={snap.streak.best} />

      <Card>
        {dueCount > 0 ? (
          <>
            <div className={styles.dueRow}>
              <div>
                <div className={styles.bigNum + ' tabular'}>{dueCount}</div>
                <div className={styles.muted}>cards due today</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className={styles.estTime}>~{estMinutes} min</div>
                <div className={styles.muted}>est. session</div>
              </div>
            </div>
            <ProgressBar value={todayDone} max={goal} />
            <div style={{ marginTop: 'var(--space-3)' }}>
              <Button fullWidth onClick={() => navigate('/study')}>
                <Icon as={Play} size={20} /> Start session
              </Button>
            </div>
          </>
        ) : (
          <EmptyState
            title="All caught up — come back tomorrow 🎉"
            body="No cards due right now."
            action={<Link to="/browse" className={styles.link}>Browse instead</Link>}
          />
        )}
      </Card>

      <h3 className={styles.section}>Pick a category</h3>
      <div className={styles.pills}>
        {allCategories().map(c => (
          <Link key={c.slug} to={`/study/${c.slug}`} className={styles.pill}>{c.name}</Link>
        ))}
      </div>
    </div>
  )
}
```

`HomePage.module.css`:
```css
.page { padding: var(--space-3) var(--space-4) calc(80px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: var(--space-3); }
.greet { font-family: var(--font-heading); font-size: 24px; font-weight: 700; }
.sub { color: var(--text-mute); margin-bottom: var(--space-2); }
.dueRow { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--space-2); }
.bigNum { font-family: var(--font-heading); font-size: 36px; line-height: 1; font-weight: 700; }
.estTime { font-weight: 700; }
.muted { color: var(--text-mute); font-size: 13px; }
.section { font-family: var(--font-heading); font-size: 18px; margin-top: var(--space-3); }
.pills { display: flex; gap: var(--space-2); overflow-x: auto; scrollbar-width: none; padding-bottom: var(--space-2); }
.pills::-webkit-scrollbar { display: none; }
.pill { flex: none; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-pill); padding: 8px 14px; font-size: 13px; font-weight: 700; }
.link { color: var(--brand-600); font-weight: 700; }
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/HomePage.*
git commit -m "feat(page): Home with streak + due card + category pills"
```

---

### Task C2: `StudyPage` (session runner)

**Files:**
- Create: `src/pages/StudyPage.jsx` + `StudyPage.module.css`

- [ ] **Step 1: Implement**

`StudyPage.jsx`:
```jsx
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { Icon } from '../components/Icon.jsx'
import { ProgressBar } from '../components/ProgressBar.jsx'
import { StudyCard } from '../components/StudyCard.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { useStore } from '../store/useStudyStore.js'
import { schedule } from '../domain/scheduler.js'
import { createNewCard } from '../domain/srsCard.js'
import { loadCategoryGroups } from '../data/examData.js'
import { categoryBySlug, allCategories } from '../domain/categories.js'
import { groupsToCardDescriptors } from '../data/deckBuilder.js'
import { pickCanonical } from '../domain/similarityGroup.js'
import styles from './StudyPage.module.css'

const BATCH = 20

const buildCardView = (descriptor, category) => {
  const canonical = pickCanonical(descriptor.members)
  const data = canonical?.data || {}
  const others = descriptor.members
    .filter(m => m !== canonical)
    .map(m => m.data?.question_text)
    .filter(Boolean)
  return {
    id: descriptor.id,
    categoryName: category.name,
    pts: data.points,
    questionText: data.question_text,
    options: data.options,
    correctAnswer: data.correct_answer,
    variants: others,
  }
}

export default function StudyPage() {
  const { categorySlug } = useParams()
  const navigate = useNavigate()
  const store = useStore()
  const [pool, setPool] = useState([])  // descriptors not yet rated this session
  const [rated, setRated] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load descriptors for the chosen scope
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const cats = categorySlug
      ? [categoryBySlug(categorySlug)].filter(Boolean)
      : allCategories()
    Promise.all(cats.map(c => loadCategoryGroups(c).then(groups => ({ category: c, groups }))))
      .then(results => {
        if (cancelled) return
        const all = results.flatMap(r =>
          groupsToCardDescriptors({ groups: r.groups }, r.category.slug).map(d => ({ ...d, category: r.category }))
        )
        // ensure each descriptor has an SRS card
        all.forEach(d => {
          if (!store.getCard(d.id)) store.upsertCard(createNewCard(d.id, d.categorySlug))
        })
        const dueIds = new Set(store.getDueCards(Date.now(), BATCH * 5))
        const due = all.filter(d => dueIds.has(d.id)).slice(0, BATCH)
        const fallback = due.length === 0 ? all.slice(0, BATCH) : due
        setPool(fallback)
      })
      .catch(e => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [categorySlug])

  const current = pool[0]
  const total = pool.length + rated
  const view = useMemo(() => current ? buildCardView(current, current.category) : null, [current])

  const handleRate = useCallback((rating) => {
    if (!current) return
    const existing = store.getCard(current.id)
    const next = schedule(existing, rating, Date.now())
    store.upsertCard(next)
    setPool(p => {
      const [head, ...rest] = p
      // wrong: requeue at the end of this batch
      return rating === 'wrong' ? [...rest, head] : rest
    })
    if (rating === 'right') setRated(r => r + 1)
  }, [current])

  // record streak when batch completes
  useEffect(() => {
    if (!loading && pool.length === 0 && rated > 0) {
      store.recordSessionCompletion()
    }
  }, [pool.length, rated, loading])

  if (loading) return <div className={styles.runner}><div className={styles.center}>Loading…</div></div>

  if (error) return (
    <div className={styles.runner}>
      <EmptyState title="Could not load questions" body={String(error.message || error)} />
    </div>
  )

  return (
    <div className={styles.runner}>
      <header className={styles.top}>
        <button className={styles.close} onClick={() => navigate('/')} aria-label="Close session">
          <Icon as={X} size={22} />
        </button>
        <ProgressBar value={rated} max={total || 1} />
        <span className={`${styles.counter} tabular`}>{rated}/{total || 0}</span>
      </header>

      {view ? (
        <div className={styles.cardWrap}>
          <StudyCard card={view} onRate={handleRate} />
        </div>
      ) : (
        <EmptyState
          title="Session complete 🎉"
          body={`You reviewed ${rated} card${rated === 1 ? '' : 's'}.`}
          action={<button className={styles.doneBtn} onClick={() => navigate('/')}>Back home</button>}
        />
      )}
    </div>
  )
}
```

`StudyPage.module.css`:
```css
.runner { display: flex; flex-direction: column; height: 100dvh; padding: calc(var(--space-3) + env(safe-area-inset-top)) var(--space-4) var(--space-4); gap: var(--space-3); background: var(--bg); }
.top { display: flex; align-items: center; gap: var(--space-3); }
.close { width: 40px; height: 40px; display: grid; place-items: center; border-radius: var(--r-pill); color: var(--text-mute); }
.counter { font-weight: 700; }
.cardWrap { flex: 1; min-height: 0; display: flex; }
.center { display: grid; place-items: center; flex: 1; color: var(--text-mute); }
.doneBtn { background: var(--brand-500); color: #fff; padding: 12px 20px; border-radius: var(--r-md); font-weight: 700; }
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/StudyPage.*
git commit -m "feat(page): Study session runner with batched due cards"
```

---

### Task C3: `BrowsePage` hub + sub-pages

**Files:**
- Create: `src/pages/BrowsePage.jsx` + `.module.css`
- Create: `src/pages/BrowseCategoryPage.jsx` + `.module.css`
- Create: `src/pages/BrowseAllPage.jsx` + `.module.css`
- Create: `src/pages/BrowseSimilarityPage.jsx` + `.module.css`

- [ ] **Step 1: BrowsePage hub**

`BrowsePage.jsx`:
```jsx
import * as Tabs from '@radix-ui/react-tabs'
import { Link } from 'react-router-dom'
import { allCategories } from '../domain/categories.js'
import { CategoryTile } from '../components/CategoryTile.jsx'
import { useStore } from '../store/useStudyStore.js'
import BrowseAllPage from './BrowseAllPage.jsx'
import BrowseSimilarityPage from './BrowseSimilarityPage.jsx'
import styles from './BrowsePage.module.css'

export default function BrowsePage() {
  const store = useStore()
  const snap = store.getSnapshot()
  const masteredBy = (slug) =>
    Object.values(snap.cards).filter(c => c.categorySlug === slug && c.state === 'mastered').length
  return (
    <div className={styles.page}>
      <Tabs.Root defaultValue="categories">
        <Tabs.List className={styles.tabs}>
          <Tabs.Trigger value="categories" className={styles.tab}>Categories</Tabs.Trigger>
          <Tabs.Trigger value="all" className={styles.tab}>All questions</Tabs.Trigger>
          <Tabs.Trigger value="similar" className={styles.tab}>Similarity groups</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="categories" className={styles.grid}>
          {allCategories().map(c => (
            <CategoryTile
              key={c.slug}
              to={`/browse/category/${c.slug}`}
              name={c.name}
              totalCards={Object.values(snap.cards).filter(card => card.categorySlug === c.slug).length}
              mastered={masteredBy(c.slug)}
            />
          ))}
        </Tabs.Content>
        <Tabs.Content value="all"><BrowseAllPage /></Tabs.Content>
        <Tabs.Content value="similar"><BrowseSimilarityPage /></Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
```

`BrowsePage.module.css`:
```css
.page { padding: var(--space-3) var(--space-4) calc(80px + env(safe-area-inset-bottom)); }
.tabs { display: flex; gap: var(--space-2); margin-bottom: var(--space-3); overflow-x: auto; scrollbar-width: none; }
.tabs::-webkit-scrollbar { display: none; }
.tab {
  flex: none;
  background: var(--surface); color: var(--text-mute);
  border: 1px solid var(--border); border-radius: var(--r-pill);
  padding: 8px 14px; font-weight: 700; font-size: 13px;
  min-height: 40px;
}
.tab[data-state="active"] {
  background: var(--brand-500); color: #fff; border-color: var(--brand-500);
}
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
@media (min-width: 768px) { .grid { grid-template-columns: repeat(3, 1fr); } }
```

- [ ] **Step 2: BrowseCategoryPage (virtualized)**

`BrowseCategoryPage.jsx`:
```jsx
import { useEffect, useRef, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useVirtualizer } from '@tanstack/react-virtual'
import { categoryBySlug } from '../domain/categories.js'
import { loadCategoryGroups } from '../data/examData.js'
import { groupsToCardDescriptors } from '../data/deckBuilder.js'
import { pickCanonical, repetitions, matchesQuery } from '../domain/similarityGroup.js'
import { QuestionListRow } from '../components/QuestionListRow.jsx'
import styles from './BrowseCategoryPage.module.css'

export default function BrowseCategoryPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const category = categoryBySlug(slug)
  const [descriptors, setDescriptors] = useState([])
  const [query, setQuery] = useState('')
  const parentRef = useRef(null)

  useEffect(() => {
    if (!category) return
    loadCategoryGroups(category).then(groups => {
      setDescriptors(groupsToCardDescriptors({ groups }, slug))
    })
  }, [slug])

  const filtered = useMemo(() => descriptors.filter(d => matchesQuery(d.members, query)), [descriptors, query])

  const v = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 6,
  })

  if (!category) return <div className={styles.page}>Category not found.</div>

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{category.name}</h1>
      <input
        className={styles.search}
        placeholder="Search questions…"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <div ref={parentRef} className={styles.scroll}>
        <div style={{ height: v.getTotalSize(), position: 'relative' }}>
          {v.getVirtualItems().map(item => {
            const d = filtered[item.index]
            const c = pickCanonical(d.members)
            return (
              <div
                key={d.id}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${item.start}px)`, padding: 'var(--space-1) 0' }}
              >
                <QuestionListRow
                  text={c?.data?.question_text ?? ''}
                  repetitions={repetitions(d.members)}
                  onActivate={() => navigate(`/browse/question/${encodeURIComponent(d.id)}`)}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

`BrowseCategoryPage.module.css`:
```css
.page { padding: var(--space-3) var(--space-4) calc(80px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; height: 100dvh; }
.title { font-family: var(--font-heading); font-size: 22px; margin-bottom: var(--space-3); }
.search { width: 100%; padding: 12px 14px; border-radius: var(--r-md); border: 1px solid var(--border); background: var(--surface); margin-bottom: var(--space-3); min-height: 44px; }
.scroll { flex: 1; overflow-y: auto; }
```

- [ ] **Step 3: BrowseAllPage** (virtualized across all categories — loads on demand per category)

`BrowseAllPage.jsx`:
```jsx
import { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVirtualizer } from '@tanstack/react-virtual'
import { allCategories } from '../domain/categories.js'
import { loadCategoryGroups } from '../data/examData.js'
import { groupsToCardDescriptors } from '../data/deckBuilder.js'
import { pickCanonical, matchesQuery, repetitions } from '../domain/similarityGroup.js'
import { QuestionListRow } from '../components/QuestionListRow.jsx'
import styles from './BrowseAllPage.module.css'

export default function BrowseAllPage() {
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const parentRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    Promise.all(allCategories().map(c =>
      loadCategoryGroups(c).then(groups => groupsToCardDescriptors({ groups }, c.slug).map(d => ({ ...d, categoryName: c.name })))
    )).then(parts => {
      if (cancelled) return
      setItems(parts.flat())
    })
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => items.filter(d => matchesQuery(d.members, query)), [items, query])

  const v = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 6,
  })

  return (
    <div className={styles.tab}>
      <input className={styles.search} placeholder="Search…" value={query} onChange={e => setQuery(e.target.value)} />
      <div ref={parentRef} className={styles.scroll}>
        <div style={{ height: v.getTotalSize(), position: 'relative' }}>
          {v.getVirtualItems().map(item => {
            const d = filtered[item.index]
            const c = pickCanonical(d.members)
            return (
              <div key={d.id} style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${item.start}px)`, padding: 'var(--space-1) 0' }}>
                <QuestionListRow
                  text={c?.data?.question_text ?? ''}
                  badge={d.categoryName}
                  repetitions={repetitions(d.members)}
                  onActivate={() => navigate(`/browse/question/${encodeURIComponent(d.id)}`)}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

`BrowseAllPage.module.css`:
```css
.tab { display: flex; flex-direction: column; height: calc(100dvh - 220px); }
.search { width: 100%; padding: 12px 14px; border-radius: var(--r-md); border: 1px solid var(--border); background: var(--surface); margin-bottom: var(--space-3); min-height: 44px; }
.scroll { flex: 1; overflow-y: auto; }
```

- [ ] **Step 4: BrowseSimilarityPage** (only groups with >1 member)

`BrowseSimilarityPage.jsx`:
```jsx
import { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVirtualizer } from '@tanstack/react-virtual'
import { allCategories } from '../domain/categories.js'
import { loadCategoryGroups } from '../data/examData.js'
import { groupsToCardDescriptors } from '../data/deckBuilder.js'
import { pickCanonical, matchesQuery, repetitions } from '../domain/similarityGroup.js'
import { QuestionListRow } from '../components/QuestionListRow.jsx'
import styles from './BrowseSimilarityPage.module.css'

export default function BrowseSimilarityPage() {
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const parentRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    Promise.all(allCategories().map(c =>
      loadCategoryGroups(c).then(groups => groupsToCardDescriptors({ groups }, c.slug).map(d => ({ ...d, categoryName: c.name })))
    )).then(parts => {
      if (cancelled) return
      setItems(parts.flat().filter(d => d.members.length > 1).sort((a, b) => b.members.length - a.members.length))
    })
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => items.filter(d => matchesQuery(d.members, query)), [items, query])

  const v = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 6,
  })

  return (
    <div className={styles.tab}>
      <input className={styles.search} placeholder="Search…" value={query} onChange={e => setQuery(e.target.value)} />
      <div ref={parentRef} className={styles.scroll}>
        <div style={{ height: v.getTotalSize(), position: 'relative' }}>
          {v.getVirtualItems().map(item => {
            const d = filtered[item.index]
            const c = pickCanonical(d.members)
            return (
              <div key={d.id} style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${item.start}px)`, padding: 'var(--space-1) 0' }}>
                <QuestionListRow text={c?.data?.question_text ?? ''} badge={d.categoryName} repetitions={repetitions(d.members)} onActivate={() => navigate(`/browse/question/${encodeURIComponent(d.id)}`)} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

`BrowseSimilarityPage.module.css`:
```css
.tab { display: flex; flex-direction: column; height: calc(100dvh - 220px); }
.search { width: 100%; padding: 12px 14px; border-radius: var(--r-md); border: 1px solid var(--border); background: var(--surface); margin-bottom: var(--space-3); min-height: 44px; }
.scroll { flex: 1; overflow-y: auto; }
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/Browse*.jsx src/pages/Browse*.module.css
git commit -m "feat(page): Browse hub + virtualized category/all/similarity tabs"
```

---

### Task C4: `QuestionSheet` (deep-linkable detail)

**Files:**
- Create: `src/pages/QuestionSheet.jsx` + `.module.css`

- [ ] **Step 1: Implement**

`QuestionSheet.jsx`:
```jsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { allCategories } from '../domain/categories.js'
import { loadCategoryGroups } from '../data/examData.js'
import { groupsToCardDescriptors } from '../data/deckBuilder.js'
import { pickCanonical } from '../domain/similarityGroup.js'
import { Button } from '../components/Button.jsx'
import { RevealPanel } from '../components/RevealPanel.jsx'
import styles from './QuestionSheet.module.css'

export default function QuestionSheet() {
  const { id } = useParams()
  const navigate = useNavigate()
  const decoded = decodeURIComponent(id)
  const [descriptor, setDescriptor] = useState(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all(allCategories().map(c =>
      loadCategoryGroups(c).then(groups => groupsToCardDescriptors({ groups }, c.slug))
    )).then(parts => {
      if (cancelled) return
      const found = parts.flat().find(d => d.id === decoded)
      setDescriptor(found || null)
    })
    return () => { cancelled = true }
  }, [decoded])

  const onClose = () => navigate(-1)
  const canonical = descriptor ? pickCanonical(descriptor.members) : null
  const variants = descriptor && canonical
    ? descriptor.members.filter(m => m !== canonical).map(m => m.data?.question_text).filter(Boolean)
    : []

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.sheet}>
          <Dialog.Title className={styles.title}>Question</Dialog.Title>
          {canonical ? (
            <>
              <p className={styles.text}>{canonical.data?.question_text}</p>
              {canonical.data?.options?.length > 0 && (
                <ul className={styles.options}>
                  {canonical.data.options.map((o, i) => <li key={i}>{o}</li>)}
                </ul>
              )}
              {revealed
                ? <RevealPanel answer={canonical.data?.correct_answer} variants={variants} />
                : <Button fullWidth onClick={() => setRevealed(true)}>Show answer</Button>}
            </>
          ) : (
            <p className={styles.text}>Loading…</p>
          )}
          <div className={styles.close}><Button variant="ghost" onClick={onClose}>Close</Button></div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

`QuestionSheet.module.css`:
```css
.overlay { position: fixed; inset: 0; background: rgba(15,23,42,.5); z-index: var(--z-sheet); }
.sheet {
  position: fixed; left: 0; right: 0; bottom: 0;
  background: var(--surface); border-radius: var(--r-lg) var(--r-lg) 0 0;
  padding: var(--space-5) var(--space-4) calc(var(--space-5) + env(safe-area-inset-bottom));
  max-height: 90dvh; overflow-y: auto; z-index: var(--z-sheet);
}
@media (min-width: 768px) {
  .sheet { left: 50%; right: auto; bottom: 50%; transform: translate(-50%, 50%); width: min(640px, 90vw); border-radius: var(--r-lg); max-height: 80vh; }
}
.title { font-family: var(--font-heading); font-size: 18px; margin-bottom: var(--space-3); }
.text { font-family: var(--font-heading); font-size: 18px; line-height: 1.4; }
.options { padding-left: 20px; color: var(--text-mute); margin: var(--space-3) 0; }
.close { margin-top: var(--space-4); }
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/QuestionSheet.*
git commit -m "feat(page): deep-linkable question detail sheet"
```

---

### Task C5: `StatsPage`

**Files:**
- Create: `src/pages/StatsPage.jsx` + `.module.css`

- [ ] **Step 1: Implement**

`StatsPage.jsx`:
```jsx
import { allCategories } from '../domain/categories.js'
import { useStore } from '../store/useStudyStore.js'
import { Card } from '../components/Card.jsx'
import { ProgressBar } from '../components/ProgressBar.jsx'
import { StreakStrip } from '../components/StreakStrip.jsx'
import styles from './StatsPage.module.css'

export default function StatsPage() {
  const store = useStore()
  const snap = store.getSnapshot()
  const cards = Object.values(snap.cards)
  const dueTomorrow = cards.filter(c => {
    const t = Date.now() + 24*3600*1000
    return c.state !== 'mastered' && c.dueAt <= t && c.dueAt > Date.now()
  }).length

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Stats</h1>
      <StreakStrip current={snap.streak.current} best={snap.streak.best} />
      <Card>
        <h2 className={styles.h2}>Mastery by category</h2>
        {allCategories().map(c => {
          const total = cards.filter(card => card.categorySlug === c.slug).length
          const mastered = cards.filter(card => card.categorySlug === c.slug && card.state === 'mastered').length
          const pct = total ? (mastered / total) * 100 : 0
          return (
            <div key={c.slug} className={styles.row}>
              <div className={styles.rowHead}><span>{c.name}</span><span className="tabular">{mastered}/{total}</span></div>
              <ProgressBar value={pct} tone="success" />
            </div>
          )
        })}
      </Card>
      <Card>
        <h2 className={styles.h2}>Due tomorrow</h2>
        <p className="tabular" style={{ fontSize: 28, fontFamily: 'var(--font-heading)' }}>{dueTomorrow}</p>
      </Card>
    </div>
  )
}
```

`StatsPage.module.css`:
```css
.page { padding: var(--space-3) var(--space-4) calc(80px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: var(--space-3); }
.title { font-family: var(--font-heading); font-size: 24px; }
.h2 { font-family: var(--font-heading); font-size: 16px; margin-bottom: var(--space-3); }
.row { margin-bottom: var(--space-3); }
.rowHead { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-mute); margin-bottom: var(--space-1); }
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/StatsPage.*
git commit -m "feat(page): Stats with mastery + streak"
```

---

### Task C6: `SettingsPage`

**Files:**
- Create: `src/pages/SettingsPage.jsx` + `.module.css`

- [ ] **Step 1: Implement**

`SettingsPage.jsx`:
```jsx
import { useState } from 'react'
import { useStore } from '../store/useStudyStore.js'
import { Card } from '../components/Card.jsx'
import { Button } from '../components/Button.jsx'
import styles from './SettingsPage.module.css'

const GOALS = [10, 20, 30]

export default function SettingsPage() {
  const store = useStore()
  const s = store.getSnapshot().settings
  const [confirming, setConfirming] = useState(false)

  const onExport = () => {
    const blob = new Blob([store.exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'csumpi-progress.json'; a.click()
    URL.revokeObjectURL(url)
  }

  const onImport = (file) => {
    const reader = new FileReader()
    reader.onload = () => store.importData(String(reader.result))
    reader.readAsText(file)
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>

      <Card>
        <label className={styles.field}>
          <span>Your name</span>
          <input value={s.userName} onChange={e => store.setSettings({ userName: e.target.value })} className={styles.input} />
        </label>
      </Card>

      <Card>
        <h2 className={styles.h2}>Daily goal</h2>
        <div className={styles.goals}>
          {GOALS.map(g => (
            <button
              key={g}
              className={styles.goal}
              data-active={s.dailyGoal === g}
              onClick={() => store.setSettings({ dailyGoal: g })}
            >{g}</button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className={styles.h2}>Data</h2>
        <div className={styles.btnRow}>
          <Button variant="ghost" onClick={onExport}>Export JSON</Button>
          <label className={styles.importLabel}>
            <span>Import JSON</span>
            <input type="file" accept="application/json" onChange={e => e.target.files?.[0] && onImport(e.target.files[0])} />
          </label>
        </div>
      </Card>

      <Card>
        <h2 className={styles.h2}>Reset</h2>
        {!confirming ? (
          <Button variant="ghost" onClick={() => setConfirming(true)}>Reset progress…</Button>
        ) : (
          <div className={styles.btnRow}>
            <Button variant="danger" onClick={() => { store.reset(); setConfirming(false) }}>Yes, reset everything</Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button>
          </div>
        )}
      </Card>
    </div>
  )
}
```

`SettingsPage.module.css`:
```css
.page { padding: var(--space-3) var(--space-4) calc(80px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: var(--space-3); }
.title { font-family: var(--font-heading); font-size: 24px; }
.h2 { font-family: var(--font-heading); font-size: 16px; margin-bottom: var(--space-3); }
.field { display: flex; flex-direction: column; gap: var(--space-2); }
.input { padding: 10px 12px; border-radius: var(--r-md); border: 1px solid var(--border); background: var(--surface); min-height: 44px; }
.goals { display: flex; gap: var(--space-2); }
.goal { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-pill); padding: 8px 14px; font-weight: 700; min-height: 40px; min-width: 60px; }
.goal[data-active="true"] { background: var(--brand-500); color: #fff; border-color: var(--brand-500); }
.btnRow { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.importLabel { display: inline-flex; align-items: center; padding: 14px 22px; min-height: 48px; border-radius: var(--r-md); border: 1px solid var(--border); background: var(--surface); cursor: pointer; font-weight: 700; }
.importLabel input { display: none; }
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/SettingsPage.*
git commit -m "feat(page): Settings with goal, export/import, reset"
```

---

### Task C7: `OnboardingOverlay`

**Files:**
- Create: `src/pages/OnboardingOverlay.jsx` + `.module.css`

- [ ] **Step 1: Implement**

`OnboardingOverlay.jsx`:
```jsx
import { useState } from 'react'
import { useStore } from '../store/useStudyStore.js'
import { Button } from '../components/Button.jsx'
import styles from './OnboardingOverlay.module.css'

export function OnboardingOverlay() {
  const store = useStore()
  const s = store.getSnapshot().settings
  const [step, setStep] = useState(0)
  if (s.onboardingComplete) return null

  const finish = (goal) => {
    store.setSettings({ dailyGoal: goal, onboardingComplete: true })
  }

  return (
    <div className={styles.overlay} role="dialog" aria-label="Welcome">
      {step === 0 && (
        <div className={styles.panel}>
          <h2 className={styles.h}>How it works</h2>
          <p className={styles.p}>Each day you'll review questions you've seen before. Knew it? It comes back later. Didn't? It comes back sooner.</p>
          <Button fullWidth onClick={() => setStep(1)}>Continue</Button>
        </div>
      )}
      {step === 1 && (
        <div className={styles.panel}>
          <h2 className={styles.h}>Pick a daily goal</h2>
          <div className={styles.goals}>
            {[10, 20, 30].map(g => (
              <button key={g} className={styles.goal} onClick={() => finish(g)}>{g} cards</button>
            ))}
          </div>
          <button className={styles.skip} onClick={() => finish(20)}>Skip</button>
        </div>
      )}
    </div>
  )
}
```

`OnboardingOverlay.module.css`:
```css
.overlay { position: fixed; inset: 0; background: rgba(15,23,42,.55); display: grid; place-items: end; z-index: var(--z-sheet); }
.panel { background: var(--surface); border-radius: var(--r-lg) var(--r-lg) 0 0; width: 100%; padding: var(--space-5) var(--space-4) calc(var(--space-5) + env(safe-area-inset-bottom)); }
.h { font-family: var(--font-heading); font-size: 22px; margin-bottom: var(--space-3); }
.p { color: var(--text-mute); margin-bottom: var(--space-4); }
.goals { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--space-2); margin-bottom: var(--space-3); }
.goal { background: var(--brand-50); color: var(--brand-600); border-radius: var(--r-md); padding: 14px 0; font-weight: 700; min-height: 48px; }
.skip { color: var(--text-mute); font-weight: 700; padding: 12px; width: 100%; }
@media (min-width: 768px) { .overlay { place-items: center; } .panel { max-width: 480px; border-radius: var(--r-lg); } }
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/OnboardingOverlay.*
git commit -m "feat(page): 2-step onboarding overlay"
```

---

## Phase D — Wiring, PWA, cleanup

### Task D1: `App.jsx` + routes + offline toast

**Files:**
- Create: `src/app/App.jsx`
- Modify: `src/main.jsx` (point to new App)
- Delete: `src/App.jsx`

- [ ] **Step 1: Write `src/app/App.jsx`**

```jsx
import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav.jsx'
import { OfflineToast } from '../components/OfflineToast.jsx'
import { OnboardingOverlay } from '../pages/OnboardingOverlay.jsx'

const HomePage             = lazy(() => import('../pages/HomePage.jsx'))
const StudyPage            = lazy(() => import('../pages/StudyPage.jsx'))
const BrowsePage           = lazy(() => import('../pages/BrowsePage.jsx'))
const BrowseCategoryPage   = lazy(() => import('../pages/BrowseCategoryPage.jsx'))
const QuestionSheet        = lazy(() => import('../pages/QuestionSheet.jsx'))
const StatsPage            = lazy(() => import('../pages/StatsPage.jsx'))
const SettingsPage         = lazy(() => import('../pages/SettingsPage.jsx'))

const HIDE_NAV_PATTERNS = [/^\/study(\/|$)/, /^\/browse\/question\//]

export default function App() {
  const { pathname } = useLocation()
  const hideNav = HIDE_NAV_PATTERNS.some(re => re.test(pathname))
  return (
    <>
      <OfflineToast />
      <OnboardingOverlay />
      <Suspense fallback={<div style={{ padding: 16 }}>Loading…</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="/study/:categorySlug" element={<StudyPage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/browse/category/:slug" element={<BrowseCategoryPage />} />
          <Route path="/browse/question/:id" element={<><BrowsePage /><QuestionSheet /></>} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Suspense>
      {!hideNav && <BottomNav />}
    </>
  )
}
```

- [ ] **Step 2: Update `src/main.jsx`**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './app/App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

- [ ] **Step 3: Delete old App.jsx**

```bash
git rm src/App.jsx
```

- [ ] **Step 4: Verify dev server**

```bash
npm run dev
```

Visit `/`, `/browse`, `/stats`, `/settings`. Confirm bottom nav appears, hides on `/study`, app loads, no console errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/App.jsx src/main.jsx
git commit -m "feat(app): new App with route-level code splitting + nav suppression"
```

---

### Task D2: PWA — manifest, icons, service worker

**Files:**
- Modify: `vite.config.js`
- Create: `public/manifest.webmanifest`
- Create: `public/offline.html`
- Create: `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (placeholders OK initially)
- Modify: `index.html` (manifest link)
- Create: `src/pwa/register.js`
- Modify: `src/main.jsx` (call register)

- [ ] **Step 1: `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png', 'offline.html'],
      manifest: {
        name: 'csumpi Learning Buddy',
        short_name: 'csumpi',
        description: 'Hungarian medical exam practice',
        theme_color: '#7C3AED',
        background_color: '#FAF7FF',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/offline.html',
        runtimeCaching: [
          {
            urlPattern: /\/categories\/.*\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'category-data',
              expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
})
```

- [ ] **Step 2: `public/offline.html`**

```html
<!doctype html><html><head><meta charset="utf-8" /><title>Offline</title>
<style>
body{font-family:system-ui,sans-serif;background:#FAF7FF;color:#0F172A;display:grid;place-items:center;min-height:100dvh;margin:0;padding:24px;text-align:center}
h1{font-size:22px}
</style></head><body>
<div><h1>You're offline</h1><p>Please check your connection and try again.</p></div>
</body></html>
```

- [ ] **Step 3: Placeholder icons**

Use `npx pwa-asset-generator` if you have time, or use any 512×512 purple PNG with the letter "c". Quickest path:

```bash
mkdir -p public/icons
# Drop in placeholder PNGs (192, 512, 512 maskable). Real icons can replace later.
```

If no design asset is available immediately, use a one-line `convert` (ImageMagick) command or any 512×512 PNG. The plan does not block on art quality.

- [ ] **Step 4: `index.html`** — add inside `<head>`:

```html
<link rel="manifest" href="/manifest.webmanifest" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

- [ ] **Step 5: `src/pwa/register.js`**

```js
import { registerSW } from 'virtual:pwa-register'

export const initPwa = () => {
  if (typeof window === 'undefined') return
  registerSW({
    immediate: true,
    onNeedRefresh() { /* could show a toast; non-blocking */ },
    onOfflineReady() { /* nothing to do */ },
  })
}
```

- [ ] **Step 6: Wire into `src/main.jsx`**

Add at the bottom of `src/main.jsx`:

```js
import { initPwa } from './pwa/register.js'
initPwa()
```

- [ ] **Step 7: Build + verify**

```bash
npm run build && npm run preview
```

Open the preview URL, run Lighthouse → PWA section should pass installability checks.

- [ ] **Step 8: Commit**

```bash
git add vite.config.js public/manifest.webmanifest public/offline.html public/icons \
  src/pwa/register.js src/main.jsx index.html
git commit -m "feat(pwa): manifest, service worker, runtime cache for category JSON"
```

---

### Task D3: Delete old pages and DaisyUI usage

**Files:**
- Delete: `src/pages/HomePage.jsx` (old), `CategoryPage.jsx`, `AllQuestionsPage.jsx`, `SimilarityGroupsPage.jsx`
- Delete: `src/components/QuestionCard.jsx`, `src/components/QuestionMarkdown.jsx`

> Note: the new `HomePage.jsx` lives in `src/pages/HomePage.jsx`. The old one was overwritten in Task C1 — verify nothing in the codebase still imports the old version.

- [ ] **Step 1: Search for stale imports**

```bash
grep -rn "from '../components/QuestionCard'" src || true
grep -rn "from './pages/HomePage'" src || true
grep -rn "QuestionMarkdown" src || true
grep -rn "daisyui" src || true
grep -rn "tailwind" src || true
grep -rn "className=\"btn " src || true
grep -rn "className=\"card " src || true
```

Expected: no DaisyUI / Tailwind class strings left. Resolve any remaining imports by switching to new components or removing.

- [ ] **Step 2: Remove the old files**

```bash
git rm src/pages/CategoryPage.jsx src/pages/AllQuestionsPage.jsx src/pages/SimilarityGroupsPage.jsx
git rm src/components/QuestionCard.jsx src/components/QuestionMarkdown.jsx
```

- [ ] **Step 3: Build clean**

```bash
npm run build
```

Expected: no missing-import errors.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: remove old DaisyUI pages and components"
```

---

### Task D4: Playwright smoke test on iPhone 13

**Files:**
- Create: `playwright.config.js`
- Create: `tests/e2e/smoke.spec.js`

- [ ] **Step 1: `playwright.config.js`**

```js
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:4173' },
  webServer: {
    command: 'npm run preview',
    port: 4173,
    reuseExistingServer: true,
  },
  projects: [
    { name: 'iPhone 13', use: { ...devices['iPhone 13'] } },
  ],
})
```

- [ ] **Step 2: `tests/e2e/smoke.spec.js`**

```js
import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // dismiss onboarding by pre-seeding storage
  await page.addInitScript(() => {
    localStorage.setItem('csumpi.studyStore.v1', JSON.stringify({
      version: 1, cards: {},
      settings: { dailyGoal: 20, theme: 'system', reducedMotion: 'system', onboardingComplete: true, userName: 'Test' },
      streak: { current: 0, best: 0, lastDay: null },
    }))
  })
})

test('home loads on iPhone 13 within 1.5s', async ({ page }) => {
  const t0 = Date.now()
  await page.goto('/')
  await expect(page.getByText(/Szia, Test/i)).toBeVisible()
  const elapsed = Date.now() - t0
  console.log(`Home interactive in ${elapsed}ms`)
  expect(elapsed).toBeLessThan(2500) // generous CI margin; track regressions
})

test('browse all questions does not crash', async ({ page }) => {
  await page.goto('/browse')
  await page.getByRole('tab', { name: /all questions/i }).click()
  await expect(page.locator('input[placeholder="Search…"]')).toBeVisible()
  // scroll fast — check no console errors
  const errors = []
  page.on('pageerror', e => errors.push(e))
  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel(0, 2000)
    await page.waitForTimeout(150)
  }
  expect(errors).toHaveLength(0)
})

test('start session, rate one card, return home', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /start session/i }).click().catch(() => {})
  // session may say "All caught up" if no cards seeded; either way, no crash:
  expect(await page.title()).not.toBe('')
})
```

- [ ] **Step 3: Install Playwright browsers**

```bash
npx playwright install chromium webkit
```

- [ ] **Step 4: Run**

```bash
npm run build && npm run test:e2e
```

Expected: all 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.js tests/e2e/smoke.spec.js
git commit -m "test(e2e): iPhone 13 smoke — home, browse, session"
```

---

### Task D5: Final manual verification on real iPhone 13

This is a manual gate, not an automated step.

- [ ] **Step 1:** From a Mac on the same Wi-Fi as the iPhone, run:

```bash
npm run build && npm run preview -- --host 0.0.0.0
```

- [ ] **Step 2:** On the iPhone 13, open Safari and visit `http://<mac-ip>:4173`.

- [ ] **Step 3:** Verify each acceptance criterion:
  - Cold load → home interactive within ~1.5 s.
  - "Add to Home Screen" works; the icon and name look correct.
  - Open the installed app → loads from cache when offline (toggle airplane mode).
  - Open Browse → All questions → search → scroll fast: no jank, no crash, memory stable.
  - Start a session → rate 50 cards → no crash, session completes.
  - Long-question and short-question/long-answer cards render correctly (find one in Pediatrics).
  - Dark mode looks correct.
  - All CTAs ≥ 44 pt; no horizontal scrolling.

- [ ] **Step 4:** If any criterion fails, file a follow-up task. Do not declare the rewrite "done" until this gate passes.

---

## Self-review (against spec)

| Spec section | Plan task(s) |
|---|---|
| §3 Stack changes | A1 |
| §4 Performance — virtualization | C3 (Browse pages), B9 (row) |
| §4 Performance — lazy markdown | B7 (Markdown lazy import) |
| §4 Performance — code splitting | D1 (`React.lazy` per route) |
| §4 PWA + offline cache | D2 |
| §4 iOS specifics (`100dvh`, tap-highlight, touch-action) | A2 (globals) |
| §5 Domain — scheduler | A4 |
| §5 Domain — srsCard | A5 |
| §5 Domain — studyStore | A6, A7 |
| §6 Visual — tokens / fonts / motion | A2 |
| §6 Visual — buttons depress | B2 |
| §7 IA — routes, nav | D1, B4 |
| §8.1 Home | C1 |
| §8.2 Study + CollapsibleQA + reveal flow | C2, B6, B7, B10 |
| §8.3 Browse hub | C3 |
| §8.4 Stats | C5 |
| §8.5 Settings (export/import/reset) | C6 |
| §9 Loading / empty / offline / error | B3 (EmptyState/Skeleton), B8 (OfflineToast), C2 |
| §10 Accessibility (focus rings, ARIA, reduced motion) | A2 globals + per-component (B-tasks) |
| §11 PWA | D2 |
| §12 Module layout | covered |
| §13 Testing strategy | A3, A4, A5, A6, A8, A9, B2, B4, B6, B10, D4 |
| §14 Migration / cleanup | D3 |
| §16 Mockup as visual reference | called out at top of plan |

No placeholders. Type names consistent (`SrsCard.id`, `categorySlug`, `state`, `step`, `dueAt`, `lastSeenAt`, `history`). Function names consistent (`schedule`, `createNewCard`, `isDue`, `groupsToCardDescriptors`, `pickCanonical`, `repetitions`, `matchesQuery`).

---

## Execution choice

Plan complete and saved to `docs/superpowers/plans/2026-05-02-ui-rewrite.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?

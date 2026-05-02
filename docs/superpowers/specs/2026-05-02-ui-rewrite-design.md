# csumpi Learning Buddy — UI Rewrite Design Spec

**Date:** 2026-05-02
**Author:** Dominik Horvath (with Claude)
**Status:** Approved for planning

## 1. Goal

Replace the current Tailwind + DaisyUI browse-only UI with a mobile-first PWA "learning buddy" centred on spaced-repetition study sessions, while keeping the existing Vite + React app and chunked `category-*.json` data pipeline untouched.

The rewrite must:

- Be **mobile-first** and feel like a native app on iPhone 13 (the original app failed to load there due to large question sets).
- Be **installable as a PWA** with full offline support.
- Use a **friendly, Duolingo-style** visual language adapted for medical-student maturity.
- Implement **simple 2-button spaced repetition** as the primary interaction.
- Drop **Tailwind** and **DaisyUI** entirely.
- Preserve all existing data, similarity-grouping, and category structures.

## 2. Non-goals

- Server-side persistence, accounts, sync.
- Multi-user features (sharing decks, leaderboards).
- Authoring / editing questions.
- Re-running the Python pipeline.
- Internationalization beyond keeping Hungarian content as-is.

## 3. Stack changes

| Concern | Before | After |
|---|---|---|
| Styling | Tailwind + DaisyUI | Plain CSS Modules + `tokens.css` (CSS custom properties) |
| Component primitives | DaisyUI components | Radix UI (`Dialog`, `Tabs`, `Toast`, `DropdownMenu`, `Switch`, `Progress`, `Collapsible`, `VisuallyHidden`) |
| Icons | Heroicons inline / none | Lucide React |
| Markdown | `react-markdown` (kept) | Same, but lazy-loaded |
| Routing | React Router 7 (kept) | Same |
| State | React local state | React local + `useSyncExternalStore` over a `studyStore` module wrapping `localStorage` |
| Virtualization | none | `@tanstack/react-virtual` for browse lists |
| PWA | none | `vite-plugin-pwa` + Workbox |

Removed dependencies: `tailwindcss`, `daisyui`, `@tailwindcss/typography`, `autoprefixer` (handled by Vite), `postcss` config.

## 4. Performance budget (hard constraint — driven by iPhone 13 incident)

- First paint ≤ 1 s on iPhone 13 / 4G; first interaction ≤ 1.5 s.
- Heap target on iPhone 13: peak < 80 MB.
- Initial JS bundle ≤ 80 KB gzipped.
- Never hold all ~5 000 questions in memory at once.
- Never render > 30 question rows in the DOM simultaneously.
- CLS < 0.1; INP < 200 ms.

### How the budget is met

1. **Per-category lazy loading** — home/study reads only SR metadata from `localStorage`. Question payloads load on demand.
2. **Streamed study deck** — Study session loads ~20 due cards at a time, advances by streaming.
3. **Virtualized browse lists** — `@tanstack/react-virtual` for All questions and Similarity groups; only visible rows mount.
4. **Memoized + lazy markdown** — `react-markdown` is `React.lazy`-loaded and rendered only on reveal; output cached per question id.
5. **Web Worker search** — search index runs off the main thread; debounced 200 ms.
6. **Incremental JSON parse** — keep category files small; if any chunk exceeds 500 KB the existing `split_by_category.py` re-splits at build time.
7. **Workbox `CacheFirst`** for category JSON (30-day max-age) — second-visit instant load, full offline.
8. **Selector subscriptions** — `useSyncExternalStore` so unrelated cards don't re-render on rating.
9. **Image discipline** — `loading="lazy"`, `decoding="async"`, declared dimensions, capped to 50 dvh.
10. **Route-level code splitting** via `React.lazy`.
11. **iOS specifics** — `min-height: 100dvh`, `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation`.

### Acceptance test

Real iPhone 13 over throttled 4G:
- Cold load → home interactive ≤ 1.5 s.
- Browse "All questions" with 5 000 rows → 60 fps scroll, no jank.
- 50-card Study session → no crashes, heap stays < 80 MB.

## 5. Domain model additions

Existing domain (`categories`, `similarityGroup`) stays. Adding:

### `srsCard`

A card is the SR unit derived from a similarity group. Stored in `localStorage` keyed by `card.id` (= group id):

```ts
type SrsCard = {
  id: string;            // similarity group id
  categorySlug: string;
  state: 'new' | 'learning' | 'mastered';
  step: 0 | 1 | 2 | 3 | 4;   // 0=new, 1=1d, 2=3d, 3=7d, 4=21d, 4→done=mastered
  dueAt: number;         // ms epoch
  lastSeenAt: number | null;
  history: Array<{ at: number; rating: 'right' | 'wrong' }>;
};
```

### `scheduler`

Pure module:

```ts
schedule(card, rating, now): SrsCard
```

Rules:
- `wrong` → `state: 'learning'`, `step: 0`, `dueAt: now` (re-queue same session).
- `right` and `step < 4` → `step + 1`, `dueAt: now + intervals[newStep]` where `intervals = [0, 1d, 3d, 7d, 21d]`.
- `right` and `step === 4` → `state: 'mastered'`, removed from due queue.

### `studyStore`

Single module wrapping `localStorage` with these reads/writes:

- `getDueCards(now, limit)` — returns due card ids, optionally filtered by category.
- `getCard(id)` / `upsertCard(card)`.
- `streak()` / `recordSessionCompletion(date)` — for streak counting.
- `dailyGoal()` / `setDailyGoal(n)`.
- `settings()` / `setSettings(partial)`.
- `subscribe(listener)` for `useSyncExternalStore`.

Schema versioning: top-level `{ version: 1, ... }` with a migration switch on read.

Bulk export / import as JSON (Settings → Export / Import) for user-controlled backup, since there is no server.

## 6. Visual system

### Tokens (`src/styles/tokens.css`)

```
--brand-500:#7C3AED  --brand-600:#6D28D9  --brand-50:#F5F0FF
--success-500:#10B981  --success-50:#ECFDF5
--danger-500:#EF4444   --danger-50:#FEF2F2
--streak-500:#F59E0B
--bg:#FAF7FF  --surface:#FFFFFF  --surface-2:#F5F2FB
--text:#0F172A  --text-mute:#475569  --border:#ECE6F7
--r-sm:12px  --r-md:18px  --r-lg:24px  --r-pill:999px
--shadow-card:0 1px 2px rgba(15,23,42,.06), 0 8px 24px rgba(124,58,237,.08)
--shadow-press:0 1px 2px rgba(15,23,42,.06)
--ease:cubic-bezier(.2,.7,.3,1)
```

Dark variant under `@media (prefers-color-scheme: dark)`; same semantic names. AA contrast verified for both.

### Typography

- Headings: **Baloo 2** (600 / 700).
- Body / UI: **Nunito** (400 / 600 / 700).
- Numbers: Nunito with `font-variant-numeric: tabular-nums`.
- Scale: 12 / 14 / 16 / 18 / 22 / 28 / 36. Body 16 px floor.
- Loaded via `<link rel="preconnect">` + Google Fonts `display=swap`.

### Shape & elevation

- Radii via tokens.
- Two-shadow stack on cards (card / pressed).
- Buttons get a 3 px solid bottom edge in a darker tone; `:active` flattens it and translates `translateY(2px)` (Duolingo "depress").

### Motion

- Transitions 150–250 ms, `var(--ease)`.
- Card / button press: `scale(0.97)`.
- Correct: green check pop (200 ms). Wrong: short red shake (180 ms, ≤ 6 px).
- Page transitions: 180 ms fade + 8 px slide; back reverses.
- All gated behind `prefers-reduced-motion: reduce`.

### Iconography

Lucide only, 24 px default, 1.75 stroke. **No emoji as structural icons.** Decorative emoji allowed only when there is also a label or icon (e.g. flame icon beside "🔥 7 days" is OK because the label exists).

### Touch & safe area

- All hit targets ≥ 44 × 44 pt; ≥ 8 px gap between adjacent targets.
- Bottom nav and primary CTAs respect `env(safe-area-inset-bottom)`.

## 7. Information architecture

### Routes

| Path | Screen |
|---|---|
| `/` | Home (study-first) |
| `/study` | Study session — mixed deck of due cards |
| `/study/:categorySlug` | Study session — scoped to one category |
| `/browse` | Browse hub (tabs: Categories · All questions · Similarity groups) |
| `/browse/category/:slug` | Category browse |
| `/browse/question/:id` | Question detail sheet (deep-linkable modal) |
| `/stats` | Stats |
| `/settings` | Settings |

Back navigation preserves scroll and filter state via `history.state`.

### Bottom nav

4 items: **Home · Browse · Stats · Settings**. Icons + labels. Active state in `--brand-50` pill. Hidden during a Study session and on the Question detail sheet.

### No drawer

Browse hub replaces what a drawer might hold; Settings is a dedicated tab.

### Onboarding

First launch only: 2-screen overlay (1: 1-sentence SR explainer; 2: pick daily goal 10/20/30). Skippable. `onboardingComplete: true` flag in `studyStore`.

## 8. Key screens

### 8.1 Home

Composition top-to-bottom:

1. Greeting line ("Szia, {name} 👋" — name from settings, default "there").
2. **Streak strip** — flame + day count + best.
3. **Due card** — large "X cards due today", est. minutes, progress toward daily goal, primary CTA "Start session". Disabled state with friendly empty copy when 0 due.
4. Horizontal "Pick a category" pill row (1 "All" + 11 categories) — taps go to `/study/:slug`.
5. Recent activity card (last session result).

### 8.2 Study session

Full-screen runner. No bottom nav.

Header:
- Close (✕) — confirms if mid-session.
- Linear progress (cards rated / cards in batch).
- Counter `n/total`.

Card body — single scroll region, sticky action bar at the bottom:

**Pre-reveal:**
- Category badge.
- Question text + options.
- "Show answer" primary CTA at the bottom of the card. Swipe-up alternative.

**Post-reveal:**
- Question text + options stay above.
- Reveal panel (success-tinted background) with canonical answer.
- "Show N other wordings" Radix `Collapsible` for similarity-group variants (only when N > 0).
- Action bar: **Didn't know** (danger) / **Knew it** (success). Swipe-left / swipe-right alternatives.

Long-content rule (the `<CollapsibleQA>` component):
- Body uses `flex: 1; overflow-y: auto; overscroll-behavior: contain;` with bottom fade-mask.
- After reveal, if `bodyScrollHeight > bodyClientHeight && answerHeight > questionHeight`, the question collapses to a **sticky 1-line banner** at the top with a `▾` to re-expand. Symmetric: applied to whichever side overflows.
- Action bar is always sticky at the bottom of the card.
- Markdown content: `max-width: 65ch`, `overflow-wrap: anywhere`, `word-break: break-word`.
- Code/formula blocks scroll horizontally inside themselves only.
- Embedded images: `max-height: 50dvh`, tap → Radix `Dialog` zoom.

Edge cases:
- Empty `correct_answer` → friendly "No answer recorded" state.
- Single option that is a paragraph → renders as a stacked card option, not an inline bullet.

### 8.3 Browse hub (`/browse`)

Radix `Tabs` with three tabs: **Categories** (grid of 11 tiles with progress ring), **All questions** (virtualized list, 2-line clamp per row, search input with debounce), **Similarity groups** (virtualized list of canonical questions with ×N badges).

Tapping a row opens the **Question detail sheet** (`/browse/question/:id`) — Radix `Dialog` styled as a bottom sheet on mobile, centred dialog on desktop. Sheet shows full question, options, reveal toggle, all variant wordings, source exam metadata. No SR rating buttons (browse is lookup, not study).

### 8.4 Stats

Simple, single-screen:
- Streak strip (current / best).
- Cards mastered per category — horizontal bar list.
- Last 7 days activity — tiny dotted line chart.
- "Cards due tomorrow" count.

No external chart library; bars and the 7-day line are hand-rolled SVG (we own ~20 lines of code).

### 8.5 Settings

- Theme: System / Light / Dark.
- Reduced motion: System / Off.
- Daily goal: 10 / 20 / 30 / Custom.
- Reset progress (destructive, double-confirm).
- Export data (JSON download) / Import data.
- About + version + link to source.

## 9. Loading, empty, error, offline states

| State | Behaviour |
|---|---|
| App shell loading | Skeleton home in < 100 ms — never spinner. |
| Category JSON loading | Skeleton question card. |
| Empty due queue | "All caught up — come back tomorrow 🎉" + "Browse instead" link. |
| Offline | Top Radix Toast "Offline — using cached data", dismissible. |
| Failed JSON load | Inline retry tile with "Try again" button. |
| First launch ever | Onboarding overlay (Section 7). |

## 10. Accessibility

- Contrast 4.5:1 floor for body text in both modes; verified in CI via Playwright + axe.
- Focus rings 2 px, `--brand-500`, never removed.
- `aria-label` on all icon-only controls.
- `prefers-reduced-motion` honoured everywhere.
- Dynamic-type tested at 200% zoom; no clipping.
- Every gesture has a visible tap equivalent.
- Sheet / modal trap focus; ESC dismisses; route returns focus to trigger.
- `aria-live="polite"` for the offline toast and rating feedback announcements.

## 11. PWA

- `vite-plugin-pwa` with Workbox.
- Precache app shell + route bundles.
- Runtime cache (`CacheFirst`, 30-day max-age) for `/data/category-*.json`.
- `manifest.webmanifest` with name, short_name "csumpi", theme color `#7C3AED`, background `#FAF7FF`, 192 / 512 / maskable icons.
- Offline fallback page under `/offline.html` for navigation requests when the cache misses entirely.
- `apple-mobile-web-app-capable` + `apple-touch-icon` for iOS home-screen install.

## 12. Module layout

```
src/
  app/
    App.jsx
    routes.jsx
  pages/
    HomePage.jsx
    StudyPage.jsx
    BrowsePage.jsx              (tabs hub)
    BrowseCategoryPage.jsx
    BrowseAllPage.jsx
    BrowseSimilarityPage.jsx
    QuestionSheet.jsx
    StatsPage.jsx
    SettingsPage.jsx
    OnboardingOverlay.jsx
  components/
    AppHeader.jsx
    BottomNav.jsx
    Button.jsx
    Card.jsx
    ProgressBar.jsx
    StreakStrip.jsx
    CategoryTile.jsx
    StudyCard.jsx               (the runner card incl. CollapsibleQA)
    CollapsibleQA.jsx
    RevealPanel.jsx
    VariantsList.jsx
    QuestionListRow.jsx         (virtualized row)
    Skeleton.jsx
    OfflineToast.jsx
    EmptyState.jsx
  domain/
    categories.js               (existing)
    similarityGroup.js          (existing, untouched)
    srsCard.js                  (new)
    scheduler.js                (new — pure)
  store/
    studyStore.js               (new)
    useStudyStore.js            (new — useSyncExternalStore hook)
    migrations.js               (new)
  data/
    examData.js                 (existing, kept)
    searchWorker.js             (new — Web Worker)
  styles/
    tokens.css
    globals.css
    reset.css
  pwa/
    register.js
public/
  manifest.webmanifest
  icons/
  offline.html
```

## 13. Testing strategy

- **Unit:** `scheduler` (pure, deterministic), `studyStore` (with mocked localStorage), `srsCard` migrations. Vitest.
- **Component:** key components rendered with Testing Library: StudyCard reveal flow, CollapsibleQA breakpoint logic, BottomNav active state.
- **Integration:** Home → Start session → rate 3 cards → return home reflects updated streak. Vitest + jsdom.
- **E2E (smoke):** Playwright on iPhone 13 emulation (375×812, throttled 4G) — cold load, run a session, open All questions, scroll 1 000 rows. Asserts no console errors, FCP < 1.5 s.
- **Accessibility:** axe-playwright per route in CI.
- **Manual on real iPhone 13** before merging — hard requirement.

## 14. Migration strategy

- Single PR series (one branch). Phased commits, but the master branch only flips when the new UI is fully wired and the old pages are deleted.
- Existing `localStorage` keys (none — current app is stateless) → no migration needed for users.
- Data files (`data/category-*.json`, `data/similarity-groups/*.json`) are unchanged.
- Removed: `tailwind.config.js`, `postcss.config.js`, `daisyui` import in `index.css`, all `className="..."` Tailwind utilities in components.

## 15. Open questions / future work (out of scope here)

- Spaced-repetition tuning beyond fixed intervals (potential FSRS upgrade).
- Optional sync via a lightweight backend.
- Image-rich questions: currently the dataset is mostly text — confirm before broad rollout.
- Translation toggle (HU ↔ EN) using existing variant wordings.

## 16. Approval

Sections 1–14 reviewed against original brief: ✓ mobile-first, ✓ PWA, ✓ Duolingo-friendly, ✓ Tailwind/DaisyUI dropped, ✓ Radix + CSS Modules, ✓ 2-button SR, ✓ similarity group as card with variants on reveal, ✓ iPhone 13 performance addressed, ✓ long-content / inverse cases handled, ✓ reveal-on-tap study mechanic preserved.

Mockup: `docs/superpowers/mockups/visual-system.html`.

---

Next step: invoke `superpowers:writing-plans` to break this spec into an executable, TDD-driven implementation plan.

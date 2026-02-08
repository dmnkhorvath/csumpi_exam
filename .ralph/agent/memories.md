# Memories

## Patterns

### mem-1770550568-7a31
> Added /all-questions route to App.jsx and primary button on HomePage to view all questions
<!-- tags: react, routing | created: 2026-02-08 -->

### mem-1770550567-2948
> Created AllQuestionsPage.jsx: loads all questions from categorized_questions_with_similarity.json, displays with search (question/answer/category), reveals answers on click, shows category badges
<!-- tags: react, ui, search | created: 2026-02-08 -->

### mem-1770536115-cb65
> Search filter checks all fields: question_text, correct_answer, and options array joined
<!-- tags: search, filter | created: 2026-02-08 -->

### mem-1770536114-6df9
> Added sticky search to CategoryPage: filters groups by question_text/answer/options, shows count, positioned with sticky top-0 z-10
<!-- tags: react, search, ui | created: 2026-02-08 -->

### mem-1770536081-62e1
> Changed dev port from 5173 to 5175 (and HMR from 5174 to 5176) in vite.config.js
<!-- tags: vite, config, ports | created: 2026-02-08 -->

### mem-1770535800-755d
> Added LATIN entry to src/helpers/categories.js: { name: 'Latin', file: 'latin.json' }. Placed alphabetically in the categories list
<!-- tags: frontend, category, latin | created: 2026-02-08 -->

### mem-1770535780-2162
> Created extract_latin_questions.py: filters questions containing 'latin' (case-insensitive) from categorized_questions_with_similarity.json, outputs to public/categories/latin.json with 434 questions found
<!-- tags: scripts, latin, category | created: 2026-02-08 -->

## Decisions

## Fixes

### mem-1770535919-44a4
> Committed and pushed Latin category: commit 7a7d074 'Add Latin category for medical terminology questions'. Build passed, 3 files changed (9205 insertions). Successfully pushed to origin/master
<!-- tags: git, commit, latin | created: 2026-02-08 -->

### mem-1770535882-dfe3
> Validated Latin category through Chrome MCP: homepage displays Latin link, clicking navigates to /category/latin, page shows 434 questions containing 'latin' in question_text. Screenshot saved to latin-category-validation.png
<!-- tags: validation, chromemcp, latin | created: 2026-02-08 -->

## Context

### mem-1770367764-f992
> ARCHITECTURE.md created at repo root. Covers 5-stage Python pipeline (extract→parse→categorize→similarity→split), React/Vite frontend (3 pages), Docker/Nginx deployment, and 12-phase reproduction checklist.
<!-- tags: architecture, documentation | created: 2026-02-06 -->

import { migrate } from './migrations.js'

const KEY = 'csumpi.studyStore.v1'

const isoDay = (ms) => {
  const d = new Date(ms)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
const dayDiff = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000)

export const createStudyStore = ({ storage = window.localStorage, now = Date.now } = {}) => {
  let state = migrate(storage.getItem(KEY))
  const listeners = new Set()

  const persist = () => {
    try {
      storage.setItem(KEY, JSON.stringify(state))
    } catch (e) {
      console.warn('studyStore: failed to persist state', e)
    }
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
      let parsed
      try { parsed = JSON.parse(json) } catch {
        throw new Error('importData: invalid JSON')
      }
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('importData: not a valid store object')
      }
      state = migrate(json)
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

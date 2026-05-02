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
    let day = new Date(2026, 4, 1, 12, 0, 0).getTime()
    store = createStudyStore({ storage, now: () => day })
    store.recordSessionCompletion()
    expect(store.streak()).toEqual({ current: 1, best: 1, lastDay: '2026-05-01' })

    day = new Date(2026, 4, 2, 12, 0, 0).getTime()
    store = createStudyStore({ storage, now: () => day })
    store.recordSessionCompletion()
    expect(store.streak().current).toBe(2)
    expect(store.streak().best).toBe(2)
  })

  it('streak resets if a day is skipped', () => {
    let day = new Date(2026, 4, 1, 12, 0, 0).getTime()
    store = createStudyStore({ storage, now: () => day })
    store.recordSessionCompletion()

    day = new Date(2026, 4, 3, 12, 0, 0).getTime()
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

  it('unsubscribe prevents further notifications', () => {
    const fn = vi.fn()
    const unsub = store.subscribe(fn)
    unsub()
    store.upsertCard({ id: 'a', categorySlug: 'k', state: 'new', step: 0, dueAt: 0, lastSeenAt: null, history: [] })
    expect(fn).not.toHaveBeenCalled()
  })

  it('streak best is preserved after a break', () => {
    let day = new Date(2026, 4, 1, 12).getTime()
    store = createStudyStore({ storage, now: () => day })
    store.recordSessionCompletion()
    day = new Date(2026, 4, 2, 12).getTime()
    store = createStudyStore({ storage, now: () => day })
    store.recordSessionCompletion()
    expect(store.streak()).toMatchObject({ current: 2, best: 2 })
    // skip a day -> reset
    day = new Date(2026, 4, 4, 12).getTime()
    store = createStudyStore({ storage, now: () => day })
    store.recordSessionCompletion()
    expect(store.streak()).toMatchObject({ current: 1, best: 2 })
  })

  it('importData throws on invalid JSON', () => {
    expect(() => store.importData('not json')).toThrow(/invalid JSON/)
  })
})

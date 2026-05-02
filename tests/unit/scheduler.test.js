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
    expect(original.state).toBe('new')
    expect(original.dueAt).toBe(0)
    expect(original.lastSeenAt).toBeNull()
    expect(original.history).toEqual([])
  })

  it('exposes interval ladder via INTERVALS_MS', () => {
    expect(INTERVALS_MS).toEqual([0, DAY, 3 * DAY, 7 * DAY, 21 * DAY])
  })
})

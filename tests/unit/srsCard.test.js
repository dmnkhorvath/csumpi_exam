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
    expect(isDue({ state: 'mastered', dueAt: 0 }, 999)).toBe(false)
  })
})

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

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

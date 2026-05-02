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

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

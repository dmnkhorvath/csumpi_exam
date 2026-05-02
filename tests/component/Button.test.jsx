import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../../src/components/Button.jsx'

describe('Button', () => {
  it('renders children and calls onClick', async () => {
    const fn = vi.fn()
    render(<Button onClick={fn}>Hi</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Hi' }))
    expect(fn).toHaveBeenCalled()
  })

  it('applies variant attribute', () => {
    render(<Button variant="success">ok</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'success')
  })

  it('disabled blocks click', async () => {
    const fn = vi.fn()
    render(<Button onClick={fn} disabled>x</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(fn).not.toHaveBeenCalled()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudyCard } from '../../src/components/StudyCard.jsx'

const card = {
  id: 'g1',
  categoryName: 'Cardiology',
  pts: 3,
  questionText: 'Q?',
  options: ['A', 'B'],
  correctAnswer: 'A is correct',
  variants: ['Other wording 1'],
}

describe('StudyCard', () => {
  it('shows question and Show answer button before reveal', () => {
    render(<StudyCard card={card} onRate={() => {}} />)
    expect(screen.getByText('Q?')).toBeVisible()
    expect(screen.getByRole('button', { name: /show answer/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /knew it/i })).not.toBeInTheDocument()
  })

  it('reveals answer + rating buttons on Show answer', async () => {
    render(<StudyCard card={card} onRate={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /show answer/i }))
    expect(screen.getByText(/A is correct/)).toBeVisible()
    expect(screen.getByRole('button', { name: /knew it/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /didn't know/i })).toBeInTheDocument()
  })

  it('calls onRate with the chosen rating', async () => {
    const onRate = vi.fn()
    render(<StudyCard card={card} onRate={onRate} />)
    await userEvent.click(screen.getByRole('button', { name: /show answer/i }))
    await userEvent.click(screen.getByRole('button', { name: /knew it/i }))
    expect(onRate).toHaveBeenCalledWith('right')
  })

  it('swipe up reveals the answer', async () => {
    render(<StudyCard card={card} onRate={() => {}} />)
    const article = document.querySelector('article')
    const makeTouchEvent = (type, touches) => {
      const ev = new Event(type, { bubbles: true })
      ev.touches = type === 'touchstart' ? touches : []
      ev.changedTouches = type === 'touchend' ? touches : []
      return ev
    }
    act(() => {
      article.dispatchEvent(makeTouchEvent('touchstart', [{ clientX: 50, clientY: 200 }]))
      article.dispatchEvent(makeTouchEvent('touchend', [{ clientX: 50, clientY: 100 }]))
    })
    expect(screen.getByText(/A is correct/)).toBeVisible()
  })

  it('swipe right after reveal calls onRate("right")', async () => {
    const onRate = vi.fn()
    render(<StudyCard card={card} onRate={onRate} />)
    await userEvent.click(screen.getByRole('button', { name: /show answer/i }))
    const article = document.querySelector('article')
    const makeTouchEvent = (type, touches) => {
      const ev = new Event(type, { bubbles: true })
      ev.touches = type === 'touchstart' ? touches : []
      ev.changedTouches = type === 'touchend' ? touches : []
      return ev
    }
    act(() => {
      article.dispatchEvent(makeTouchEvent('touchstart', [{ clientX: 100, clientY: 200 }]))
      article.dispatchEvent(makeTouchEvent('touchend', [{ clientX: 200, clientY: 200 }]))
    })
    expect(onRate).toHaveBeenCalledWith('right')
  })
})

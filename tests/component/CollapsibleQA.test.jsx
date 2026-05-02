import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CollapsibleQA } from '../../src/components/CollapsibleQA.jsx'

describe('CollapsibleQA', () => {
  it('renders both sides expanded by default', () => {
    render(<CollapsibleQA question={<div>Q text</div>} answer={<div>A text</div>} forceCondensedSide={null} />)
    expect(screen.getByText('Q text')).toBeVisible()
    expect(screen.getByText('A text')).toBeVisible()
  })

  it('condenses question to a banner when forced', () => {
    render(<CollapsibleQA question={<div>Q text</div>} answer={<div>A text</div>} forceCondensedSide="question" />)
    const banner = screen.getByRole('button', { name: /question/i })
    expect(banner).toBeInTheDocument()
    // The full question wrapper <div>Q text</div> is no longer rendered;
    // text from the banner remains as a child of the button.
    expect(banner).toHaveTextContent('Q text')
    // Answer remains visible alongside the banner.
    expect(screen.getByText('A text')).toBeVisible()
  })

  it('tapping the banner re-expands the question', async () => {
    render(<CollapsibleQA question={<div>Q text</div>} answer={<div>A text</div>} forceCondensedSide="question" />)
    await userEvent.click(screen.getByRole('button', { name: /question/i }))
    expect(screen.getByText('Q text')).toBeVisible()
  })

  it('renders only the question when answer is null', () => {
    render(<CollapsibleQA question={<div>Q text</div>} answer={null} forceCondensedSide={null} />)
    expect(screen.getByText('Q text')).toBeVisible()
  })
})

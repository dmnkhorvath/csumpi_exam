import { lazy, Suspense } from 'react'
import { VariantsList } from './VariantsList.jsx'
import styles from './RevealPanel.module.css'

const Markdown = lazy(() => import('./Markdown.jsx'))

export function RevealPanel({ answer, variants }) {
  if (!answer || !answer.trim()) {
    return (
      <div className={styles.empty} role="region" aria-label="Answer">
        No answer recorded for this question.
      </div>
    )
  }
  return (
    <div className={styles.panel} role="region" aria-label="Answer">
      <h4 className={styles.title}>Answer</h4>
      <Suspense fallback={<div>{answer}</div>}>
        <Markdown>{answer}</Markdown>
      </Suspense>
      <VariantsList variants={variants} />
    </div>
  )
}

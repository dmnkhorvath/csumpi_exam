import { useState, useRef, useEffect } from 'react'
import { Eye, Check, X } from 'lucide-react'
import { Button } from './Button.jsx'
import { Icon } from './Icon.jsx'
import { CollapsibleQA } from './CollapsibleQA.jsx'
import { RevealPanel } from './RevealPanel.jsx'
import styles from './StudyCard.module.css'

export function StudyCard({ card, onRate }) {
  const [revealed, setRevealed] = useState(false)
  const cardRef = useRef(null)

  useEffect(() => { setRevealed(false) }, [card.id])

  // Keep latest values readable from a stable listener closure.
  const revealedRef = useRef(revealed)
  const onRateRef = useRef(onRate)
  useEffect(() => { revealedRef.current = revealed })
  useEffect(() => { onRateRef.current = onRate })

  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    let startX = null, startY = null
    const onStart = (e) => { const t = e.touches[0]; startX = t.clientX; startY = t.clientY }
    const reset = () => { startX = null; startY = null }
    const onEnd = (e) => {
      if (startX == null) return
      const t = e.changedTouches[0]
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      reset()
      const isRevealed = revealedRef.current
      if (Math.abs(dy) > Math.abs(dx) && dy < -60 && !isRevealed) { setRevealed(true); return }
      if (isRevealed && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
        onRateRef.current(dx > 0 ? 'right' : 'wrong')
      }
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchend', onEnd, { passive: true })
    el.addEventListener('touchcancel', reset, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', reset)
    }
  }, [])

  const question = (
    <div>
      <span className={styles.badge}>{card.categoryName}{card.pts ? ` · ${card.pts} pts` : ''}</span>
      <p className={styles.qtext}>{card.questionText}</p>
      {card.options?.length > 0 && (
        <ul className={styles.options}>
          {card.options.map((o, i) => <li key={i}>{o}</li>)}
        </ul>
      )}
    </div>
  )
  const answer = revealed ? <RevealPanel answer={card.correctAnswer} variants={card.variants} /> : null

  return (
    <article className={styles.card} ref={cardRef}>
      <CollapsibleQA question={question} answer={answer} />
      {!revealed ? (
        <div className={styles.actions}>
          <Button fullWidth onClick={() => setRevealed(true)}>
            <Icon as={Eye} size={20} /> Show answer
          </Button>
        </div>
      ) : (
        <div className={styles.actions} data-double>
          <Button variant="danger" onClick={() => onRate('wrong')}>
            <Icon as={X} size={20} /> Didn't know
          </Button>
          <Button variant="success" onClick={() => onRate('right')}>
            <Icon as={Check} size={20} /> Knew it
          </Button>
        </div>
      )}
    </article>
  )
}

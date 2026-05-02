import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Icon } from './Icon.jsx'
import styles from './CollapsibleQA.module.css'

const useMeasureCondense = ({ enabled, qRef, aRef, bodyRef }) => {
  const [side, setSide] = useState(null) // 'question' | 'answer' | null
  useLayoutEffect(() => {
    if (!enabled) return
    const body = bodyRef.current
    const q = qRef.current
    const a = aRef.current
    if (!body || !q || !a) return
    const overflows = body.scrollHeight > body.clientHeight + 4
    if (!overflows) { setSide(null); return }
    setSide(a.offsetHeight > q.offsetHeight ? 'question' : 'answer')
  }, [enabled, qRef, aRef, bodyRef])
  return side
}

export function CollapsibleQA({ question, answer, forceCondensedSide }) {
  const bodyRef = useRef(null)
  const qRef = useRef(null)
  const aRef = useRef(null)
  const measured = useMeasureCondense({
    enabled: forceCondensedSide === undefined && answer != null,
    qRef, aRef, bodyRef,
  })
  const condensedSide = forceCondensedSide !== undefined ? forceCondensedSide : measured
  const [expanded, setExpanded] = useState(false)

  useEffect(() => { setExpanded(false) }, [condensedSide, answer])

  const showQBanner = answer != null && condensedSide === 'question' && !expanded

  return (
    <div className={styles.body} ref={bodyRef}>
      {showQBanner ? (
        <button
          type="button"
          className={styles.banner}
          aria-expanded="false"
          aria-label="Show question"
          onClick={() => setExpanded(true)}
        >
          <span className={styles.tag}>Q</span>
          <span className={styles.bannerText}>{question}</span>
          <Icon as={ChevronDown} size={16} />
        </button>
      ) : (
        <div ref={qRef} className={styles.q}>{question}</div>
      )}
      {answer != null ? <div ref={aRef} className={styles.a}>{answer}</div> : null}
    </div>
  )
}

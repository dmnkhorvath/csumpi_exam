import { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVirtualizer } from '@tanstack/react-virtual'
import { allCategories } from '../domain/categories.js'
import { loadCategoryGroups } from '../data/examData.js'
import { groupsToCardDescriptors } from '../data/deckBuilder.js'
import { pickCanonical, matchesQuery, repetitions } from '../domain/similarityGroup.js'
import { QuestionListRow } from '../components/QuestionListRow.jsx'
import styles from './BrowseSimilarityPage.module.css'

export default function BrowseSimilarityPage() {
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const parentRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    Promise.all(allCategories().map(c =>
      loadCategoryGroups(c).then(groups => groupsToCardDescriptors({ groups }, c.slug).map(d => ({ ...d, categoryName: c.name })))
    )).then(parts => {
      if (cancelled) return
      setItems(parts.flat().filter(d => d.members.length > 1).sort((a, b) => b.members.length - a.members.length))
    })
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => items.filter(d => matchesQuery(d.members, query)), [items, query])

  const v = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 6,
  })

  return (
    <div className={styles.tab}>
      <input className={styles.search} placeholder="Search…" value={query} onChange={e => setQuery(e.target.value)} />
      <div ref={parentRef} className={styles.scroll}>
        <div style={{ height: v.getTotalSize(), position: 'relative' }}>
          {v.getVirtualItems().map(item => {
            const d = filtered[item.index]
            const c = pickCanonical(d.members)
            return (
              <div key={d.id} style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${item.start}px)`, padding: 'var(--space-1) 0' }}>
                <QuestionListRow text={c?.data?.question_text ?? ''} badge={d.categoryName} repetitions={repetitions(d.members)} onActivate={() => navigate(`/browse/question/${encodeURIComponent(d.id)}`)} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

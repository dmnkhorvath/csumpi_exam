import { useEffect, useRef, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useVirtualizer } from '@tanstack/react-virtual'
import { categoryBySlug } from '../domain/categories.js'
import { loadCategoryGroups } from '../data/examData.js'
import { groupsToCardDescriptors } from '../data/deckBuilder.js'
import { pickCanonical, repetitions, matchesQuery } from '../domain/similarityGroup.js'
import { QuestionListRow } from '../components/QuestionListRow.jsx'
import styles from './BrowseCategoryPage.module.css'

export default function BrowseCategoryPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const category = categoryBySlug(slug)
  const [descriptors, setDescriptors] = useState([])
  const [query, setQuery] = useState('')
  const parentRef = useRef(null)

  useEffect(() => {
    if (!category) return
    loadCategoryGroups(category).then(groups => {
      setDescriptors(groupsToCardDescriptors({ groups }, slug))
    })
  }, [slug])

  const filtered = useMemo(() => descriptors.filter(d => matchesQuery(d.members, query)), [descriptors, query])

  const v = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 6,
  })

  if (!category) return <div className={styles.page}>Category not found.</div>

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{category.name}</h1>
      <input
        className={styles.search}
        placeholder="Search questions…"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <div ref={parentRef} className={styles.scroll}>
        <div style={{ height: v.getTotalSize(), position: 'relative' }}>
          {v.getVirtualItems().map(item => {
            const d = filtered[item.index]
            const c = pickCanonical(d.members)
            return (
              <div
                key={d.id}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${item.start}px)`, padding: 'var(--space-1) 0' }}
              >
                <QuestionListRow
                  text={c?.data?.question_text ?? ''}
                  repetitions={repetitions(d.members)}
                  onActivate={() => navigate(`/browse/question/${encodeURIComponent(d.id)}`)}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

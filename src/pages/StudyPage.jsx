import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { Icon } from '../components/Icon.jsx'
import { ProgressBar } from '../components/ProgressBar.jsx'
import { StudyCard } from '../components/StudyCard.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { useStore } from '../store/useStudyStore.js'
import { schedule } from '../domain/scheduler.js'
import { createNewCard } from '../domain/srsCard.js'
import { loadCategoryGroups } from '../data/examData.js'
import { categoryBySlug, allCategories } from '../domain/categories.js'
import { groupsToCardDescriptors } from '../data/deckBuilder.js'
import { pickCanonical } from '../domain/similarityGroup.js'
import styles from './StudyPage.module.css'

const BATCH = 20

const buildCardView = (descriptor, category) => {
  const canonical = pickCanonical(descriptor.members)
  const data = canonical?.data || {}
  const others = descriptor.members
    .filter(m => m !== canonical)
    .map(m => m.data?.question_text)
    .filter(Boolean)
  return {
    id: descriptor.id,
    categoryName: category.name,
    pts: data.points,
    questionText: data.question_text,
    options: data.options,
    correctAnswer: data.correct_answer,
    variants: others,
  }
}

export default function StudyPage() {
  const { categorySlug } = useParams()
  const navigate = useNavigate()
  const store = useStore()
  const [pool, setPool] = useState([])
  const [rated, setRated] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const completedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    completedRef.current = false
    const cats = categorySlug
      ? [categoryBySlug(categorySlug)].filter(Boolean)
      : allCategories()
    Promise.all(cats.map(c => loadCategoryGroups(c).then(groups => ({ category: c, groups }))))
      .then(results => {
        if (cancelled) return
        const all = results.flatMap(r =>
          groupsToCardDescriptors({ groups: r.groups }, r.category.slug).map(d => ({ ...d, category: r.category }))
        )
        all.forEach(d => {
          if (!store.getCard(d.id)) store.upsertCard(createNewCard(d.id, d.categorySlug))
        })
        const dueIds = new Set(store.getDueCards(Date.now(), BATCH * 5))
        const due = all.filter(d => dueIds.has(d.id)).slice(0, BATCH)
        const fallback = due.length === 0 ? all.slice(0, BATCH) : due
        setPool(fallback)
      })
      .catch(e => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [categorySlug])

  const current = pool[0]
  const total = pool.length + rated
  const view = useMemo(() => current ? buildCardView(current, current.category) : null, [current])

  const handleRate = useCallback((rating) => {
    if (!current) return
    const existing = store.getCard(current.id)
    const next = schedule(existing, rating, Date.now())
    store.upsertCard(next)
    setPool(p => {
      const [head, ...rest] = p
      return rating === 'wrong' ? [...rest, head] : rest
    })
    if (rating === 'right') setRated(r => r + 1)
  }, [current])

  useEffect(() => {
    if (!loading && pool.length === 0 && rated > 0 && !completedRef.current) {
      completedRef.current = true
      store.recordSessionCompletion()
    }
  }, [pool.length, rated, loading])

  if (loading) return <div className={styles.runner}><div className={styles.center}>Loading…</div></div>

  if (error) return (
    <div className={styles.runner}>
      <EmptyState title="Could not load questions" body={String(error.message || error)} />
    </div>
  )

  return (
    <div className={styles.runner}>
      <header className={styles.top}>
        <button className={styles.close} onClick={() => navigate('/')} aria-label="Close session">
          <Icon as={X} size={22} />
        </button>
        <ProgressBar value={rated} max={total || 1} />
        <span className={`${styles.counter} tabular`}>{rated}/{total || 0}</span>
      </header>

      {view ? (
        <div className={styles.cardWrap}>
          <StudyCard card={view} onRate={handleRate} />
        </div>
      ) : (
        <EmptyState
          title="Session complete 🎉"
          body={`You reviewed ${rated} card${rated === 1 ? '' : 's'}.`}
          action={<button className={styles.doneBtn} onClick={() => navigate('/')}>Back home</button>}
        />
      )}
    </div>
  )
}

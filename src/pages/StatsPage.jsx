import { allCategories } from '../domain/categories.js'
import { useStore } from '../store/useStudyStore.js'
import { Card } from '../components/Card.jsx'
import { ProgressBar } from '../components/ProgressBar.jsx'
import { StreakStrip } from '../components/StreakStrip.jsx'
import styles from './StatsPage.module.css'

export default function StatsPage() {
  const store = useStore()
  const snap = store.getSnapshot()
  const cards = Object.values(snap.cards)
  const dueTomorrow = cards.filter(c => {
    const t = Date.now() + 24*3600*1000
    return c.state !== 'mastered' && c.dueAt <= t && c.dueAt > Date.now()
  }).length

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Stats</h1>
      <StreakStrip current={snap.streak.current} best={snap.streak.best} />
      <Card>
        <h2 className={styles.h2}>Mastery by category</h2>
        {allCategories().map(c => {
          const total = cards.filter(card => card.categorySlug === c.slug).length
          const mastered = cards.filter(card => card.categorySlug === c.slug && card.state === 'mastered').length
          const pct = total ? (mastered / total) * 100 : 0
          return (
            <div key={c.slug} className={styles.row}>
              <div className={styles.rowHead}><span>{c.name}</span><span className="tabular">{mastered}/{total}</span></div>
              <ProgressBar value={pct} tone="success" />
            </div>
          )
        })}
      </Card>
      <Card>
        <h2 className={styles.h2}>Due tomorrow</h2>
        <p className="tabular" style={{ fontSize: 28, fontFamily: 'var(--font-heading)' }}>{dueTomorrow}</p>
      </Card>
    </div>
  )
}

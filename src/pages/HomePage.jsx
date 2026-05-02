import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import { allCategories } from '../domain/categories.js'
import { useStudyStore } from '../store/useStudyStore.js'
import { studyStore } from '../store/studyStore.js'
import { Button } from '../components/Button.jsx'
import { Card } from '../components/Card.jsx'
import { StreakStrip } from '../components/StreakStrip.jsx'
import { Icon } from '../components/Icon.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import styles from './HomePage.module.css'

export default function HomePage() {
  const navigate = useNavigate()
  const snap = useStudyStore()
  const store = studyStore()
  const now = Date.now()
  const dueIds = useMemo(() => store.getDueCards(now, 9999), [snap])
  const dueCount = dueIds.length
  const estMinutes = Math.max(1, Math.ceil(dueCount * 0.5))
  const userName = snap.settings.userName || 'there'

  return (
    <div className={styles.page}>
      <h2 className={styles.greet}>Szia, {userName} 👋</h2>
      <p className={styles.sub}>Let's keep the streak going.</p>

      <StreakStrip current={snap.streak.current} best={snap.streak.best} />

      <Card>
        {dueCount > 0 ? (
          <>
            <div className={styles.dueRow}>
              <div>
                <div className={`${styles.bigNum} tabular`}>{dueCount}</div>
                <div className={styles.muted}>cards due today</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className={styles.estTime}>~{estMinutes} min</div>
                <div className={styles.muted}>est. session</div>
              </div>
            </div>
            <Button fullWidth onClick={() => navigate('/study')}>
              <Icon as={Play} size={20} /> Start session
            </Button>
          </>
        ) : (
          <EmptyState
            title="All caught up — come back tomorrow 🎉"
            body="No cards due right now."
            action={<Link to="/browse" className={styles.link}>Browse instead</Link>}
          />
        )}
      </Card>

      <h3 className={styles.section}>Pick a category</h3>
      <div className={styles.pills}>
        {allCategories().map(c => (
          <Link key={c.slug} to={`/study/${c.slug}`} className={styles.pill}>{c.name}</Link>
        ))}
      </div>
    </div>
  )
}

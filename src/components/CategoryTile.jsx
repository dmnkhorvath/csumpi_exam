import { Link } from 'react-router-dom'
import { ProgressBar } from './ProgressBar.jsx'
import styles from './CategoryTile.module.css'

export function CategoryTile({ to, name, totalCards, mastered }) {
  const pct = totalCards ? (mastered / totalCards) * 100 : 0
  return (
    <Link to={to} className={styles.tile}>
      <div className={styles.name}>{name}</div>
      <div className={styles.meta}>
        <span className="tabular">{mastered}/{totalCards}</span>
      </div>
      <ProgressBar value={pct} tone="success" />
    </Link>
  )
}

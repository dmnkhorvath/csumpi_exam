import { Flame } from 'lucide-react'
import { Icon } from './Icon.jsx'
import styles from './StreakStrip.module.css'

export function StreakStrip({ current, best }) {
  return (
    <div className={styles.wrap} role="status" aria-label={`Streak ${current} days, best ${best}`}>
      <Icon as={Flame} size={36} />
      <div>
        <div className={`${styles.num} tabular`}>{current}</div>
        <div className={styles.lbl}>day streak · best {best}</div>
      </div>
    </div>
  )
}

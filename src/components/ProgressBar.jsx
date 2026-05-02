import * as Progress from '@radix-ui/react-progress'
import styles from './ProgressBar.module.css'

export function ProgressBar({ value, max = 100, tone = 'brand' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <Progress.Root className={styles.root} value={pct} data-tone={tone}>
      <Progress.Indicator
        className={styles.indicator}
        style={{ transform: `translateX(-${100 - pct}%)` }}
      />
    </Progress.Root>
  )
}

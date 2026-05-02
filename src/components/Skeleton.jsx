import styles from './Skeleton.module.css'
export function Skeleton({ width = '100%', height = 16, radius }) {
  return <span className={styles.s} style={{ width, height, borderRadius: radius ?? 'var(--r-sm)' }} />
}

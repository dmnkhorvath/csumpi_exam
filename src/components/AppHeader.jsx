import styles from './AppHeader.module.css'
export function AppHeader({ title, leading, trailing }) {
  return (
    <header className={styles.header}>
      <div className={styles.leading}>{leading}</div>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.trailing}>{trailing}</div>
    </header>
  )
}

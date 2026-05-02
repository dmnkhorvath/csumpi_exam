import styles from './EmptyState.module.css'
export function EmptyState({ icon, title, body, action }) {
  return (
    <div className={styles.wrap}>
      {icon ? <div className={styles.icon}>{icon}</div> : null}
      <h3 className={styles.title}>{title}</h3>
      {body ? <p className={styles.body}>{body}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  )
}

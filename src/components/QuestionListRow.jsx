import styles from './QuestionListRow.module.css'

export function QuestionListRow({ text, badge, repetitions, onActivate }) {
  return (
    <button type="button" className={styles.row} onClick={onActivate}>
      <div className={styles.text}>{text}</div>
      <div className={styles.meta}>
        {badge ? <span className={styles.badge}>{badge}</span> : null}
        {repetitions > 1 ? <span className={styles.rep}>×{repetitions}</span> : null}
      </div>
    </button>
  )
}

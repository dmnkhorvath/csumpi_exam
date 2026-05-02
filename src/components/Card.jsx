import styles from './Card.module.css'
export function Card({ as: Tag = 'div', children, ...rest }) {
  return <Tag className={styles.card} {...rest}>{children}</Tag>
}

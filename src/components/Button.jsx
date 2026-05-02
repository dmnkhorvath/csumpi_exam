import styles from './Button.module.css'

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  ...rest
}) {
  return (
    <button
      className={styles.btn}
      data-variant={variant}
      data-size={size}
      data-full={fullWidth || undefined}
      {...rest}
    >
      {children}
    </button>
  )
}

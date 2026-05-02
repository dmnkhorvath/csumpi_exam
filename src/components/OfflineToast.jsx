import * as Toast from '@radix-ui/react-toast'
import { useEffect, useState } from 'react'
import styles from './OfflineToast.module.css'

export function OfflineToast() {
  const [open, setOpen] = useState(typeof navigator !== 'undefined' && !navigator.onLine)
  useEffect(() => {
    const off = () => setOpen(true)
    const on  = () => setOpen(false)
    window.addEventListener('offline', off)
    window.addEventListener('online', on)
    return () => { window.removeEventListener('offline', off); window.removeEventListener('online', on) }
  }, [])
  return (
    <Toast.Provider swipeDirection="down">
      <Toast.Root className={styles.toast} open={open} onOpenChange={setOpen}>
        <Toast.Title className={styles.title}>Offline</Toast.Title>
        <Toast.Description className={styles.desc}>Using cached data.</Toast.Description>
      </Toast.Root>
      <Toast.Viewport className={styles.viewport} />
    </Toast.Provider>
  )
}

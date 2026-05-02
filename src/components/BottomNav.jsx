import { NavLink, useLocation } from 'react-router-dom'
import { Home, LayoutGrid, BarChart3, Settings } from 'lucide-react'
import { Icon } from './Icon.jsx'
import styles from './BottomNav.module.css'

const items = [
  { to: '/',         label: 'Home',     icon: Home },
  { to: '/browse',   label: 'Browse',   icon: LayoutGrid },
  { to: '/stats',    label: 'Stats',    icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  const { pathname } = useLocation()
  return (
    <nav className={styles.nav} aria-label="Primary">
      {items.map(({ to, label, icon }) => {
        const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
        return (
          <NavLink key={to} to={to} className={styles.item} data-active={active} aria-label={label}>
            <Icon as={icon} size={22} />
            <span>{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

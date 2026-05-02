import * as Collapsible from '@radix-ui/react-collapsible'
import { ChevronDown } from 'lucide-react'
import { Icon } from './Icon.jsx'
import styles from './VariantsList.module.css'

export function VariantsList({ variants }) {
  if (!variants || variants.length === 0) return null
  return (
    <Collapsible.Root className={styles.root}>
      <Collapsible.Trigger className={styles.trigger}>
        <Icon as={ChevronDown} size={14} />
        Show {variants.length} other wording{variants.length === 1 ? '' : 's'}
      </Collapsible.Trigger>
      <Collapsible.Content asChild>
        <ul className={styles.list}>
          {variants.map((v, i) => <li key={i}>{v}</li>)}
        </ul>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}

import * as Tabs from '@radix-ui/react-tabs'
import { allCategories } from '../domain/categories.js'
import { CategoryTile } from '../components/CategoryTile.jsx'
import { useStore } from '../store/useStudyStore.js'
import BrowseAllPage from './BrowseAllPage.jsx'
import BrowseSimilarityPage from './BrowseSimilarityPage.jsx'
import styles from './BrowsePage.module.css'

export default function BrowsePage() {
  const store = useStore()
  const snap = store.getSnapshot()
  const masteredBy = (slug) =>
    Object.values(snap.cards).filter(c => c.categorySlug === slug && c.state === 'mastered').length
  const totalBy = (slug) =>
    Object.values(snap.cards).filter(c => c.categorySlug === slug).length
  return (
    <div className={styles.page}>
      <Tabs.Root defaultValue="categories">
        <Tabs.List className={styles.tabs}>
          <Tabs.Trigger value="categories" className={styles.tab}>Categories</Tabs.Trigger>
          <Tabs.Trigger value="all" className={styles.tab}>All questions</Tabs.Trigger>
          <Tabs.Trigger value="similar" className={styles.tab}>Similarity groups</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="categories" className={styles.grid}>
          {allCategories().map(c => (
            <CategoryTile
              key={c.slug}
              to={`/browse/category/${c.slug}`}
              name={c.name}
              totalCards={totalBy(c.slug)}
              mastered={masteredBy(c.slug)}
            />
          ))}
        </Tabs.Content>
        <Tabs.Content value="all"><BrowseAllPage /></Tabs.Content>
        <Tabs.Content value="similar"><BrowseSimilarityPage /></Tabs.Content>
      </Tabs.Root>
    </div>
  )
}

import { useSyncExternalStore } from 'react'
import { studyStore } from './studyStore.js'

export const useStudyStore = (selector) => {
  const store = studyStore()
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getSnapshot(), store),
    () => selector(store.getSnapshot(), store),
  )
}

export const useStore = studyStore

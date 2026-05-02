import { useSyncExternalStore } from 'react'
import { studyStore } from './studyStore.js'

const identity = (s) => s

// Subscribes the calling component to the store and returns the selected slice.
// Pass a selector to read just the part you need; defaults to the full snapshot.
export const useStudyStore = (selector = identity) => {
  const store = studyStore()
  const get = () => selector(store.getSnapshot())
  return useSyncExternalStore(store.subscribe, get, get)
}

// Returns the store singleton without subscribing — only use for imperative ops.
export const studyStoreSingleton = () => studyStore()

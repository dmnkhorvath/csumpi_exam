import { registerSW } from 'virtual:pwa-register'

export const initPwa = () => {
  if (typeof window === 'undefined') return
  registerSW({
    immediate: true,
    onNeedRefresh() {},
    onOfflineReady() {},
  })
}

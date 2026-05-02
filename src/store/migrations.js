export const CURRENT_VERSION = 1

export const defaultState = () => ({
  version: CURRENT_VERSION,
  cards: {},
  settings: {
    dailyGoal: 20,
    theme: 'system',
    reducedMotion: 'system',
    onboardingComplete: false,
    userName: '',
  },
  streak: { current: 0, best: 0, lastDay: null },
})

export const migrate = (raw) => {
  if (!raw) return defaultState()
  let s
  try { s = JSON.parse(raw) } catch { return defaultState() }
  if (!s || typeof s !== 'object') return defaultState()
  // future migrations: switch on s.version
  const base = defaultState()
  return {
    ...base,
    ...s,
    settings: { ...base.settings, ...(s.settings || {}) },
    streak: { ...base.streak, ...(s.streak || {}) },
    cards: s.cards || {},
    version: CURRENT_VERSION,
  }
}

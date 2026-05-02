export const createNewCard = (id, categorySlug) => ({
  id,
  categorySlug,
  state: 'new',
  step: 0,
  dueAt: 0,
  lastSeenAt: null,
  history: [],
})

export const isDue = (card, now) =>
  card.state !== 'mastered' && card.dueAt <= now

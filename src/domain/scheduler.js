const DAY = 24 * 60 * 60 * 1000

export const INTERVALS_MS = Object.freeze([0, DAY, 3 * DAY, 7 * DAY, 21 * DAY])

export const schedule = (card, rating, now) => {
  const next = {
    ...card,
    history: [...card.history, { at: now, rating }],
    lastSeenAt: now,
  }
  if (rating === 'wrong') {
    next.state = 'learning'
    next.step = 0
    next.dueAt = now
    return next
  }
  if (card.step >= 4) {
    next.state = 'mastered'
    next.step = 4
    next.dueAt = now + INTERVALS_MS[4]
    return next
  }
  next.step = card.step + 1
  next.state = 'learning'
  next.dueAt = now + INTERVALS_MS[next.step]
  return next
}

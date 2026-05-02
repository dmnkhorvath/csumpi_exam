export const isInteresting = (group) => group.questions.length > 1

export const pickCanonical = (members) => {
  const byLength = [...members].sort(
    (a, b) => (b.data?.question_text?.length || 0) - (a.data?.question_text?.length || 0)
  )
  return byLength.find(q => q.data?.correct_answer?.trim()) || byLength[0]
}

export const repetitions = (members) => members.length

export const matchesQuery = (members, query) => {
  if (!query.trim()) return true
  const q = query.toLowerCase()
  return members.some(item => {
    const text = item.data?.question_text?.toLowerCase() || ''
    const ans = item.data?.correct_answer?.toLowerCase() || ''
    const opts = (item.data?.options || []).join(' ').toLowerCase()
    return text.includes(q) || ans.includes(q) || opts.includes(q)
  })
}

import { allCategories, categoryFile } from '../domain/categories'

export const loadAllQuestions = async () => {
  const res = await fetch('/categorized_questions_with_similarity.json')
  const data = await res.json()
  return (data || []).filter(q => q.success && q.data)
}

export const loadCategoryGroups = async (category) => {
  const res = await fetch(`/categories/${categoryFile(category)}`)
  const data = await res.json()
  return (data.groups || []).slice().sort((a, b) => b.length - a.length)
}

export const loadSimilarityGroups = async () => {
  const buckets = {}

  for (const cat of allCategories()) {
    try {
      const res = await fetch(`/categories/${categoryFile(cat)}`)
      const data = await res.json()

      for (const group of data.groups || []) {
        for (const question of group) {
          const groupId = question.similarity_group_id
          if (!groupId || groupId.startsWith('__null_')) continue

          if (!buckets[groupId]) {
            buckets[groupId] = { groupId, category: data.category_name, questions: [] }
          }
          buckets[groupId].questions.push(question)
        }
      }
    } catch (e) {
      console.error(`Failed to load ${categoryFile(cat)}:`, e)
    }
  }

  return Object.values(buckets).sort((a, b) => b.questions.length - a.questions.length)
}

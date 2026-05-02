import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import QuestionCard from '../components/QuestionCard'
import { categoryBySlug } from '../domain/categories'
import { loadCategoryGroups } from '../data/examData'
import { pickCanonical, repetitions, matchesQuery } from '../domain/similarityGroup'

function CategoryPage() {
  const { categoryName } = useParams()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [revealedAnswers, setRevealedAnswers] = useState({})
  const [searchQuery, setSearchQuery] = useState('')

  const category = categoryBySlug(categoryName)

  useEffect(() => {
    if (!category) { setLoading(false); return }
    loadCategoryGroups(category)
      .then(gs => {
        setGroups(gs)
        setRevealedAnswers({})
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [category])

  const toggleAnswer = (index) => {
    setRevealedAnswers(prev => ({ ...prev, [index]: !prev[index] }))
  }

  const filteredGroups = groups.filter(group => matchesQuery(group, searchQuery))

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="container mx-auto p-4">
        <Link to="/" className="btn btn-ghost btn-sm">← Back to Categories</Link>
        <p className="mt-4">Category not found.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Link to="/" className="btn btn-ghost btn-sm">← Back to Categories</Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">{category.name}</h1>

      <div className="sticky top-0 z-10 bg-base-100 pb-4 mb-4">
        <input
          type="text"
          placeholder="Search questions..."
          className="input input-bordered w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <div className="text-sm text-base-content/70 mt-2">
            Found {filteredGroups.length} question{filteredGroups.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {filteredGroups.map((group, groupIndex) => (
          <QuestionCard
            key={groupIndex}
            question={pickCanonical(group)}
            isRevealed={!!revealedAnswers[groupIndex]}
            onReveal={() => toggleAnswer(groupIndex)}
            repetitions={repetitions(group)}
          />
        ))}
      </div>
    </div>
  )
}

export default CategoryPage

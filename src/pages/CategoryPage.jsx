import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { Categories } from '../helpers/categories'

function CategoryPage() {
  const { categoryName } = useParams()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [revealedAnswers, setRevealedAnswers] = useState({})
  const [searchQuery, setSearchQuery] = useState('')

  const category = Object.values(Categories).find(
    cat => cat.file.replace('.json', '') === categoryName
  )

  useEffect(() => {
    if (!category) {
      setLoading(false)
      return
    }

    fetch(`/categories/${category.file}`)
      .then(res => res.json())
      .then(data => {
        const sorted = (data.groups || []).sort((a, b) => b.length - a.length)
        setGroups(sorted)
        setRevealedAnswers({})
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [category])

  const toggleAnswer = (index) => {
    setRevealedAnswers(prev => ({ ...prev, [index]: !prev[index] }))
  }

  // Filter groups based on search query
  const filteredGroups = groups.filter(group => {
    if (!searchQuery.trim()) return true

    const query = searchQuery.toLowerCase()
    return group.some(item => {
      const questionText = item.data?.question_text?.toLowerCase() || ''
      const answer = item.data?.correct_answer?.toLowerCase() || ''
      const options = (item.data?.options || []).join(' ').toLowerCase()
      return questionText.includes(query) || answer.includes(query) || options.includes(query)
    })
  })

  const renderMarkdown = (text) => {
    if (!text) return null
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="table table-zebra table-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-base-300">{children}</thead>,
          th: ({ children }) => <th className="px-2 py-1">{children}</th>,
          td: ({ children }) => <td className="px-2 py-1">{children}</td>,
          p: ({ children }) => <p className="mb-2">{children}</p>,
        }}
      >
        {text}
      </ReactMarkdown>
    )
  }

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
        <Link to="/" className="btn btn-ghost btn-sm">
          ← Back to Categories
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">{category.name}</h1>

      {/* Sticky search input */}
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
        {filteredGroups.map((group, groupIndex) => {
          // Sort by question_text length descending
          const sorted = [...group].sort((a, b) =>
            (b.data?.question_text?.length || 0) - (a.data?.question_text?.length || 0)
          )
          // Pick longest with non-empty answer, or fall back to longest overall
          const item = sorted.find(q => q.data?.correct_answer?.trim()) || sorted[0]
          const repetitions = group.length
          const isRevealed = revealedAnswers[groupIndex]

          return (
            <div key={groupIndex} className="card bg-base-100 shadow-sm">
              <div className="card-body">

                <div className="text-center prose prose-sm max-w-none w-full">
                  {renderMarkdown(item.data?.question_text)}
                </div>

                {item.data?.options && item.data.options.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {item.data.options.map((opt, i) => (
                      <li key={i}>{opt}</li>
                    ))}
                  </ul>
                )}

                {isRevealed ? (
                  <div className="mt-4 p-4 bg-success/10 rounded-lg">
                    <h3 className="font-semibold mb-2 text-success">Answer:</h3>
                    <div className="prose prose-sm max-w-none">
                      {renderMarkdown(item.data?.correct_answer)}
                    </div>
                  </div>
                ) : (
                  <div className="card-actions justify-center mt-4">
                    <button className="btn btn-primary" onClick={() => toggleAnswer(groupIndex)}>
                      Answer
                    </button>
                  </div>
                )}

                {repetitions > 1 && (
                  <div className="flex justify-end mt-2">
                    <span className="badge badge-warning">×{repetitions}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CategoryPage

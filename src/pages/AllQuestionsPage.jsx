import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

function AllQuestionsPage() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [revealedAnswers, setRevealedAnswers] = useState({})
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetch('/categorized_questions_with_similarity.json')
      .then(res => res.json())
      .then(data => {
        // Filter to only successful questions with data
        const validQuestions = (data || []).filter(q => q.success && q.data)
        setQuestions(validQuestions)
        setRevealedAnswers({})
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const toggleAnswer = (index) => {
    setRevealedAnswers(prev => ({ ...prev, [index]: !prev[index] }))
  }

  // Filter questions based on search query
  const filteredQuestions = questions.filter(question => {
    if (!searchQuery.trim()) return true

    const query = searchQuery.toLowerCase()
    const questionText = question.data?.question_text?.toLowerCase() || ''
    const answer = question.data?.correct_answer?.toLowerCase() || ''
    const options = (question.data?.options || []).join(' ').toLowerCase()
    const category = question.categorization?.category?.toLowerCase() || ''

    return questionText.includes(query) ||
           answer.includes(query) ||
           options.includes(query) ||
           category.includes(query)
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

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Link to="/" className="btn btn-ghost btn-sm">
          ← Back to Categories
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">All Questions</h1>

      {/* Sticky search input */}
      <div className="sticky top-0 z-10 bg-base-100 pb-4 mb-4">
        <input
          type="text"
          placeholder="Search questions, answers, or categories..."
          className="input input-bordered w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <div className="text-sm text-base-content/70 mt-2">
            Found {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {filteredQuestions.map((question, index) => {
          const isRevealed = revealedAnswers[index]
          const category = question.categorization?.category || 'Uncategorized'

          return (
            <div key={index} className="card bg-base-100 shadow-sm">
              <div className="card-body">
                {/* Category badge */}
                <div className="flex justify-between items-start mb-2">
                  <span className="badge badge-outline">{category}</span>
                  {question.data?.question_number && (
                    <span className="text-xs text-base-content/50">
                      Q{question.data.question_number}
                    </span>
                  )}
                </div>

                <div className="text-center prose prose-sm max-w-none w-full">
                  {renderMarkdown(question.data?.question_text)}
                </div>

                {question.data?.options && question.data.options.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {question.data.options.map((opt, i) => (
                      <li key={i}>{opt}</li>
                    ))}
                  </ul>
                )}

                {isRevealed ? (
                  <div className="mt-4 p-4 bg-success/10 rounded-lg">
                    <h3 className="font-semibold mb-2 text-success">Answer:</h3>
                    <div className="prose prose-sm max-w-none">
                      {renderMarkdown(question.data?.correct_answer)}
                    </div>
                  </div>
                ) : (
                  <div className="card-actions justify-center mt-4">
                    <button className="btn btn-primary" onClick={() => toggleAnswer(index)}>
                      Answer
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredQuestions.length === 0 && (
        <div className="text-center text-base-content/50 mt-8">
          No questions found matching your search.
        </div>
      )}
    </div>
  )
}

export default AllQuestionsPage

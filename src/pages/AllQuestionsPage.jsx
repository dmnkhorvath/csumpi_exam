import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import QuestionCard from '../components/QuestionCard'
import { loadAllQuestions } from '../data/examData'

function AllQuestionsPage() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [revealedAnswers, setRevealedAnswers] = useState({})
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadAllQuestions()
      .then(qs => {
        setQuestions(qs)
        setRevealedAnswers({})
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleAnswer = (index) => {
    setRevealedAnswers(prev => ({ ...prev, [index]: !prev[index] }))
  }

  const filteredQuestions = questions.filter(question => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    const questionText = question.data?.question_text?.toLowerCase() || ''
    const answer = question.data?.correct_answer?.toLowerCase() || ''
    const options = (question.data?.options || []).join(' ').toLowerCase()
    const category = question.categorization?.category?.toLowerCase() || ''
    return questionText.includes(query) || answer.includes(query) ||
           options.includes(query) || category.includes(query)
  })

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
        <Link to="/" className="btn btn-ghost btn-sm">← Back to Categories</Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">All Questions</h1>

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
        {filteredQuestions.map((question, index) => (
          <QuestionCard
            key={index}
            question={question}
            isRevealed={!!revealedAnswers[index]}
            onReveal={() => toggleAnswer(index)}
            category={question.categorization?.category || 'Uncategorized'}
            questionNumber={question.data?.question_number}
          />
        ))}
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

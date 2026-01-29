import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

function CategoryPage() {
  const { categoryName } = useParams()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/categorized_questions.json')
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter(
          item => item.categorization?.category === decodeURIComponent(categoryName)
        )
        setQuestions(filtered)
        setLoading(false)
      })
  }, [categoryName])

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

      <h1 className="text-2xl font-bold mb-6">{decodeURIComponent(categoryName)}</h1>
      <p className="mb-4 text-base-content/70">{questions.length} questions</p>

      <div className="space-y-2">
        {questions.map((item, index) => (
          <div key={item.file} className="collapse collapse-arrow bg-base-100">
            <input type="checkbox" />
            <div className="collapse-title font-medium">
              <span className="badge badge-neutral mr-2">{item.data?.points || '?'} pts</span>
              <span className="badge badge-outline mr-2">{item.data?.question_type || 'unknown'}</span>
              Question {index + 1}
              <span className="text-xs text-base-content/50 font-mono ml-2">{item.file}</span>
            </div>
            <div className="collapse-content">
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Question:</h3>
                <div className="prose prose-sm max-w-none">
                  {renderMarkdown(item.data?.question_text)}
                </div>
              </div>

              {item.data?.options && item.data.options.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Options:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {item.data.options.map((opt, i) => (
                      <li key={i}>{opt}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 p-4 bg-success/10 rounded-lg">
                <h3 className="font-semibold mb-2 text-success">Answer:</h3>
                <div className="prose prose-sm max-w-none">
                  {renderMarkdown(item.data?.correct_answer)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CategoryPage

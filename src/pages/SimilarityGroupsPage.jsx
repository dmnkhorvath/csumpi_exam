import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { Categories } from '../helpers/categories'

function SimilarityGroupsPage() {
  const [similarityGroups, setSimilarityGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState({})

  useEffect(() => {
    const loadAllCategories = async () => {
      const allGroups = {}

      for (const cat of Object.values(Categories)) {
        try {
          const res = await fetch(`/categories/${cat.file}`)
          const data = await res.json()

          for (const group of data.groups || []) {
            for (const question of group) {
              const groupId = question.similarity_group_id
              // Skip questions without real similarity groups (null or __null_ prefix)
              if (!groupId || groupId.startsWith('__null_')) continue

              if (!allGroups[groupId]) {
                allGroups[groupId] = {
                  groupId,
                  category: data.category_name,
                  questions: []
                }
              }
              allGroups[groupId].questions.push(question)
            }
          }
        } catch (e) {
          console.error(`Failed to load ${cat.file}:`, e)
        }
      }

      // Convert to array and sort by count (descending)
      const sorted = Object.values(allGroups)
        .filter(g => g.questions.length > 1) // Only groups with 2+ questions
        .sort((a, b) => b.questions.length - a.questions.length)

      setSimilarityGroups(sorted)
      setLoading(false)
    }

    loadAllCategories()
  }, [])

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))
  }

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

  const totalQuestions = similarityGroups.reduce((sum, g) => sum + g.questions.length, 0)

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Link to="/" className="btn btn-ghost btn-sm">
          ← Back to Categories
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-2">Similarity Groups</h1>
      <p className="text-base-content/70 mb-6">
        {similarityGroups.length} groups with {totalQuestions} total questions
      </p>

      <div className="space-y-4">
        {similarityGroups.map((group) => {
          const isExpanded = expandedGroups[group.groupId]

          return (
            <div key={group.groupId} className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleGroup(group.groupId)}
                >
                  <div>
                    <h2 className="card-title text-lg">
                      {group.groupId}
                    </h2>
                    <p className="text-sm text-base-content/70">{group.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-primary badge-lg">{group.questions.length}</span>
                    <span className="text-xl">{isExpanded ? '▼' : '▶'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 space-y-4 border-t pt-4">
                    {group.questions.map((q, idx) => (
                      <div key={idx} className="p-4 bg-base-200 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="badge badge-ghost text-xs">{q.source_folder}</span>
                          <span className="text-xs text-base-content/50">{q.file}</span>
                        </div>
                        <div className="prose prose-sm max-w-none">
                          {renderMarkdown(q.data?.question_text)}
                        </div>
                        {q.data?.correct_answer && (
                          <div className="mt-2 p-2 bg-success/10 rounded text-sm">
                            <span className="font-semibold text-success">Answer: </span>
                            {renderMarkdown(q.data.correct_answer)}
                          </div>
                        )}
                      </div>
                    ))}
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

export default SimilarityGroupsPage

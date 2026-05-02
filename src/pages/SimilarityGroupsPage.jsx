import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import QuestionMarkdown from '../components/QuestionMarkdown'
import { loadSimilarityGroups } from '../data/examData'
import { isInteresting } from '../domain/similarityGroup'

function SimilarityGroupsPage() {
  const [similarityGroups, setSimilarityGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState({})

  useEffect(() => {
    loadSimilarityGroups()
      .then(gs => setSimilarityGroups(gs.filter(isInteresting)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))
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
        <Link to="/" className="btn btn-ghost btn-sm">← Back to Categories</Link>
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
                    <h2 className="card-title text-lg">{group.groupId}</h2>
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
                          <QuestionMarkdown>{q.data?.question_text}</QuestionMarkdown>
                        </div>
                        {q.data?.correct_answer && (
                          <div className="mt-2 p-2 bg-success/10 rounded text-sm">
                            <span className="font-semibold text-success">Answer: </span>
                            <QuestionMarkdown>{q.data.correct_answer}</QuestionMarkdown>
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

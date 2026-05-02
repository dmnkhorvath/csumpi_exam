import QuestionMarkdown from './QuestionMarkdown'

function QuestionCard({ question, isRevealed, onReveal, category, repetitions, questionNumber }) {
  const data = question?.data || {}
  const showHeader = category || questionNumber

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        {showHeader && (
          <div className="flex justify-between items-start mb-2">
            {category ? <span className="badge badge-outline">{category}</span> : <span />}
            {questionNumber && (
              <span className="text-xs text-base-content/50">Q{questionNumber}</span>
            )}
          </div>
        )}

        <div className="text-center prose prose-sm max-w-none w-full">
          <QuestionMarkdown>{data.question_text}</QuestionMarkdown>
        </div>

        {data.options && data.options.length > 0 && (
          <ul className="list-disc list-inside space-y-1 mt-2">
            {data.options.map((opt, i) => <li key={i}>{opt}</li>)}
          </ul>
        )}

        {isRevealed ? (
          <div className="mt-4 p-4 bg-success/10 rounded-lg">
            <h3 className="font-semibold mb-2 text-success">Answer:</h3>
            <div className="prose prose-sm max-w-none">
              <QuestionMarkdown>{data.correct_answer}</QuestionMarkdown>
            </div>
          </div>
        ) : (
          <div className="card-actions justify-center mt-4">
            <button className="btn btn-primary" onClick={onReveal}>Answer</button>
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
}

export default QuestionCard

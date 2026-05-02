import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

const components = {
  table: ({ children }) => (
    <div className="overflow-x-auto my-2">
      <table className="table table-zebra table-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-base-300">{children}</thead>,
  th: ({ children }) => <th className="px-2 py-1">{children}</th>,
  td: ({ children }) => <td className="px-2 py-1">{children}</td>,
  p: ({ children }) => <p className="mb-2">{children}</p>,
}

function QuestionMarkdown({ children }) {
  if (!children) return null
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
      {children}
    </ReactMarkdown>
  )
}

export default QuestionMarkdown

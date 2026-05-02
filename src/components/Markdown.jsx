import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

export default function Markdown({ children }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{children || ''}</ReactMarkdown>
}

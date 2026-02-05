import { Link } from 'react-router-dom'
import { Categories } from '../helpers/categories'

function HomePage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">Exam Preparation</h1>
      <h2 className="text-xl text-center mb-6 text-base-content/70">Select a category to practice</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.values(Categories).map(category => (
          <Link
            key={category.file}
            to={`/category/${category.file.replace('.json', '')}`}
            className="btn btn-outline btn-lg h-auto py-4 flex flex-col items-start text-left"
          >
            <span className="text-lg font-semibold">{category.name}</span>
          </Link>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link to="/similarity-groups" className="btn btn-secondary">
          View Similarity Groups
        </Link>
      </div>
    </div>
  )
}

export default HomePage

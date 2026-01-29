import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function HomePage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/categorized_questions.json')
      .then(res => res.json())
      .then(data => {
        const categoryMap = {}
        data.forEach(item => {
          if (item.categorization?.success && item.categorization?.category) {
            const cat = item.categorization.category
            if (!categoryMap[cat]) {
              categoryMap[cat] = 0
            }
            categoryMap[cat]++
          }
        })
        const categoryList = Object.entries(categoryMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
        setCategories(categoryList)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">Exam Preparation</h1>
      <h2 className="text-xl text-center mb-6 text-base-content/70">Select a category to practice</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(category => (
          <Link
            key={category.name}
            to={`/category/${encodeURIComponent(category.name)}`}
            className="btn btn-outline btn-lg h-auto py-4 flex flex-col items-start text-left"
          >
            <span className="text-lg font-semibold">{category.name}</span>
            <span className="text-sm opacity-70">{category.count} questions</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default HomePage

import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CategoryPage from './pages/CategoryPage'
import SimilarityGroupsPage from './pages/SimilarityGroupsPage'
import AllQuestionsPage from './pages/AllQuestionsPage'

function App() {
  return (
    <div className="min-h-screen bg-base-200">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/category/:categoryName" element={<CategoryPage />} />
        <Route path="/similarity-groups" element={<SimilarityGroupsPage />} />
        <Route path="/all-questions" element={<AllQuestionsPage />} />
      </Routes>
    </div>
  )
}

export default App

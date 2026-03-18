import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api from '../services/api'

export default function TakeQuizPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuiz()
  }, [id])

  const fetchQuiz = async () => {
    try {
      const data = await api.get(`/quizzes/${id}`)
      setQuiz(data)
    } catch (error) {
      console.error('Failed to fetch quiz:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-20 px-4 flex items-center justify-center">
        <div className="text-white">Loading quiz...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-20 px-4 pb-12">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition">
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <h1 className="text-4xl font-bold text-white mb-8">{quiz?.title || 'Quiz'}</h1>
        
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <p className="text-gray-400 text-center">Quiz interface will be implemented here</p>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Award, Clock, PlayCircle } from 'lucide-react'
import api from '../services/api'

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuizzes()
  }, [])

  const fetchQuizzes = async () => {
    try {
      const data = await api.get('/quizzes')
      setQuizzes(data)
    } catch (error) {
      console.error('Failed to fetch quizzes:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-20 px-4 flex items-center justify-center">
        <div className="text-white">Loading quizzes...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-20 px-4 pb-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Quizzes</h1>
          <p className="text-gray-400">Test your knowledge and earn certificates</p>
        </div>

        {quizzes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Award className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">No quizzes available yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

function QuizCard({ quiz }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-600 transition">
      <Award className="w-8 h-8 text-blue-500 mb-4" />
      <h3 className="text-xl font-bold text-white mb-2">{quiz.title}</h3>
      <p className="text-gray-400 text-sm mb-4">{quiz.description}</p>
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {quiz.duration} min
        </div>
        <span>{quiz.total_questions} questions</span>
      </div>
      <Link to={`/quizzes/${quiz.id}`} className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg transition">
        <PlayCircle className="w-5 h-5" />
        Start Quiz
      </Link>
    </div>
  )
}

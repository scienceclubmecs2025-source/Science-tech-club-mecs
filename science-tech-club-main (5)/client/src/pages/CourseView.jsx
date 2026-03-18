import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import ReactPlayer from 'react-player'
import { ArrowLeft, Clock } from 'lucide-react'
import Loading from '../components/Loading'

export default function CourseView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourse()
  }, [id])

  const fetchCourse = async () => {
    try {
      const data = await api.get(`/courses/${id}`)
      setCourse(data)
    } catch (error) {
      console.error('Failed to fetch course:', error)
      navigate('/courses')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading />
  if (!course) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/courses')}
        className="flex items-center space-x-2 text-gray-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Courses</span>
      </button>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="aspect-video bg-black">
          <ReactPlayer
            url={course.video_url}
            controls
            width="100%"
            height="100%"
            config={{
              youtube: {
                playerVars: { showinfo: 1 }
              }
            }}
          />
        </div>

        <div className="p-8">
          <div className="flex items-center space-x-4 mb-4">
            <span className="px-3 py-1 bg-blue-600 text-sm rounded-full">{course.category}</span>
            {course.duration > 0 && (
              <div className="flex items-center text-gray-400">
                <Clock className="w-4 h-4 mr-1" />
                <span>{course.duration} minutes</span>
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">{course.title}</h1>
          <p className="text-gray-400 text-lg leading-relaxed">{course.description}</p>
        </div>
      </div>
    </div>
  )
}

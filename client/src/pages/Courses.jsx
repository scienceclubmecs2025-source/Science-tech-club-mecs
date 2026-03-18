import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import { BookOpen, Clock, Search, Plus, Trash2 } from 'lucide-react'
import Loading from '../components/Loading'

export default function Courses() {
  const { user } = useAuthStore()
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    category: 'General',
    duration: 0
  })

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    const filtered = courses.filter(course =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredCourses(filtered)
  }, [searchTerm, courses])

  const fetchCourses = async () => {
    try {
      const data = await api.get('/courses')
      setCourses(data)
      setFilteredCourses(data)
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCourse = async (e) => {
    e.preventDefault()
    try {
      await api.post('/courses', newCourse)
      setShowAddModal(false)
      setNewCourse({
        title: '',
        description: '',
        video_url: '',
        thumbnail_url: '',
        category: 'General',
        duration: 0
      })
      fetchCourses()
    } catch (error) {
      alert('Failed to add course')
    }
  }

  const handleDeleteCourse = async (id) => {
    if (!confirm('Are you sure you want to delete this course?')) return
    try {
      await api.delete(`/courses/${id}`)
      fetchCourses()
    } catch (error) {
      alert('Failed to delete course')
    }
  }

  if (loading) return <Loading />

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Video Courses</h1>
        {(user.role === 'admin' || user.is_committee) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            <span>Add Course</span>
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No courses found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-blue-500 transition">
              {course.thumbnail_url && (
                <img src={course.thumbnail_url} alt={course.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-3 py-1 bg-blue-600 text-xs rounded-full">{course.category}</span>
                  {course.duration > 0 && (
                    <div className="flex items-center text-gray-400 text-sm">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{course.duration} min</span>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{course.description}</p>
                <div className="flex items-center justify-between">
                  <Link
                    to={`/courses/${course.id}`}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Watch</span>
                  </Link>
                  {user.role === 'admin' && (
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-xl w-full max-w-2xl border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-6">Add New Course</h2>
            <form onSubmit={handleAddCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-slate-600 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-slate-600 rounded-lg text-white"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Video URL</label>
                <input
                  type="url"
                  value={newCourse.video_url}
                  onChange={(e) => setNewCourse({ ...newCourse, video_url: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-slate-600 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Thumbnail URL</label>
                <input
                  type="url"
                  value={newCourse.thumbnail_url}
                  onChange={(e) => setNewCourse({ ...newCourse, thumbnail_url: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={newCourse.category}
                    onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-slate-600 rounded-lg text-white"
                  >
                    <option>General</option>
                    <option>Programming</option>
                    <option>AI/ML</option>
                    <option>Web Development</option>
                    <option>Robotics</option>
                    <option>IoT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={newCourse.duration}
                    onChange={(e) => setNewCourse({ ...newCourse, duration: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-800 border border-slate-600 rounded-lg text-white"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2 bg-gray-800 hover:bg-slate-600 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                >
                  Add Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

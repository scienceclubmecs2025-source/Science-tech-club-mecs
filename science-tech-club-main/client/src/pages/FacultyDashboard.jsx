import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { 
  User, Award, BookOpen, Bell, CheckCircle, XCircle, Clock
} from 'lucide-react'
import Loading from '../components/Loading'

export default function FacultyDashboard() {
  const [profile, setProfile] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [pendingProjects, setPendingProjects] = useState([])
  const [pendingQuizzes, setPendingQuizzes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [profileRes, announcementsRes, projectsRes, quizzesRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/announcements'),
        api.get('/projects?status=pending'),
        api.get('/quizzes?status=draft')
      ])
      
      setProfile(profileRes.data)
      setAnnouncements(announcementsRes.data.slice(0, 5))
      setPendingProjects(projectsRes.data)
      setPendingQuizzes(quizzesRes.data.filter(q => q.created_by === profileRes.data.id))
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveProject = async (projectId) => {
    try {
      await api.put(`/projects/${projectId}/status`, { 
        status: 'approved',
        guide_id: profile.id 
      })
      alert('Project approved!')
      fetchData()
    } catch (error) {
      alert('Failed to approve project')
    }
  }

  const handleRejectProject = async (projectId) => {
    try {
      await api.put(`/projects/${projectId}/status`, { status: 'rejected' })
      alert('Project rejected')
      fetchData()
    } catch (error) {
      alert('Failed to reject project')
    }
  }

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome, Dr. {profile?.username} 👨‍🏫
          </h1>
          <p className="text-gray-400">
            {profile?.department} Department
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-xl">
            <Clock className="w-8 h-8 mb-4" />
            <h3 className="text-2xl font-bold">{pendingProjects.length}</h3>
            <p className="text-blue-100">Pending Approvals</p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-xl">
            <CheckCircle className="w-8 h-8 mb-4" />
            <h3 className="text-2xl font-bold">0</h3>
            <p className="text-green-100">Approved Projects</p>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-xl">
            <BookOpen className="w-8 h-8 mb-4" />
            <h3 className="text-2xl font-bold">{pendingQuizzes.length}</h3>
            <p className="text-purple-100">My Quizzes</p>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-orange-800 p-6 rounded-xl">
            <Award className="w-8 h-8 mb-4" />
            <h3 className="text-2xl font-bold">0</h3>
            <p className="text-orange-100">Guided Students</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Link
                  to="/profile"
                  className="flex flex-col items-center gap-3 p-4 bg-gray-800 hover:bg-gray-750 rounded-lg transition"
                >
                  <User className="w-8 h-8 text-blue-400" />
                  <span className="text-sm text-center">My Profile</span>
                </Link>

                <Link
                  to="/projects"
                  className="flex flex-col items-center gap-3 p-4 bg-gray-800 hover:bg-gray-750 rounded-lg transition"
                >
                  <Award className="w-8 h-8 text-purple-400" />
                  <span className="text-sm text-center">My Projects</span>
                </Link>

                <Link
                  to="/quizzes/create"
                  className="flex flex-col items-center gap-3 p-4 bg-gray-800 hover:bg-gray-750 rounded-lg transition"
                >
                  <BookOpen className="w-8 h-8 text-green-400" />
                  <span className="text-sm text-center">Create Quiz</span>
                </Link>

                <Link
                  to="/courses"
                  className="flex flex-col items-center gap-3 p-4 bg-gray-800 hover:bg-gray-750 rounded-lg transition"
                >
                  <BookOpen className="w-8 h-8 text-cyan-400" />
                  <span className="text-sm text-center">Browse Courses</span>
                </Link>
              </div>
            </div>

            {/* Project Requests */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Project Approval Requests</h2>
              
              {pendingProjects.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                  <p className="text-gray-500">No pending project requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingProjects.map(project => (
                    <div key={project.id} className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{project.title}</h3>
                          <p className="text-sm text-gray-400 mt-1">{project.description}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            By: {project.creator?.username} • {project.creator?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-4">
                        <button
                          onClick={() => handleApproveProject(project.id)}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm transition"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve & Guide
                        </button>
                        <button
                          onClick={() => handleRejectProject(project.id)}
                          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm transition"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My Quizzes */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">My Quizzes</h2>
                <Link to="/quizzes/create" className="text-blue-400 hover:text-blue-300 text-sm">
                  + Create New
                </Link>
              </div>
              
              {pendingQuizzes.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                  <p className="text-gray-500 mb-4">No quizzes created yet</p>
                  <Link
                    to="/quizzes/create"
                    className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition"
                  >
                    Create Quiz
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingQuizzes.map(quiz => (
                    <div key={quiz.id} className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="font-semibold">{quiz.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">{quiz.description}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          quiz.status === 'approved' ? 'bg-green-600' :
                          quiz.status === 'draft' ? 'bg-yellow-600' :
                          'bg-gray-600'
                        }`}>
                          {quiz.status}
                        </span>
                        {quiz.status === 'draft' && (
                          <span className="text-xs text-gray-500">Waiting for admin approval</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Announcements */}
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-bold">Announcements</h2>
              </div>
              
              {announcements.length === 0 ? (
                <p className="text-gray-500 text-sm">No announcements yet.</p>
              ) : (
                <div className="space-y-4">
                  {announcements.map(announcement => (
                    <div key={announcement.id} className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="font-semibold text-sm">{announcement.title}</h3>
                      <p className="text-xs text-gray-400 mt-2">{announcement.content}</p>
                      <span className="text-xs text-gray-600 mt-2 block">
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

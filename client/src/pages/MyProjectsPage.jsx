import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Calendar, Users, ArrowLeft, ExternalLink, CheckCircle, Clock } from 'lucide-react'
import api from '../services/api'
import Loading from '../components/Loading'

export default function MyProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, ongoing, completed

  useEffect(() => {
    fetchMyProjects()
  }, [])

  const fetchMyProjects = async () => {
  try {
    const data = await api.get('/projects/my-projects')
    setProjects(Array.isArray(data) ? data : [])  // ← add guard
  } catch (error) {
    console.error('Failed to fetch projects:', error)
  } finally {
    setLoading(false)
  }
}


  const filteredProjects = projects.filter(project => {
    if (filter === 'ongoing') return project.status === 'ongoing'
    if (filter === 'completed') return project.status === 'completed'
    return true
  })

  const ongoingCount = projects.filter(p => p.status === 'ongoing').length
  const completedCount = projects.filter(p => p.status === 'completed').length

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/projects')}
              className="p-2 hover:bg-gray-800 rounded-lg transition"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-4xl font-bold">My Projects</h1>
              <p className="text-gray-400 mt-1">Projects you're working on</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition"
          >
            <ExternalLink className="w-5 h-5" />
            Browse All Projects
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-xl">
            <Briefcase className="w-8 h-8 mb-3" />
            <h3 className="text-3xl font-bold">{projects.length}</h3>
            <p className="text-blue-100 text-sm">Total Projects</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-600 to-orange-600 p-6 rounded-xl">
            <Clock className="w-8 h-8 mb-3" />
            <h3 className="text-3xl font-bold">{ongoingCount}</h3>
            <p className="text-yellow-100 text-sm">Ongoing</p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-teal-600 p-6 rounded-xl">
            <CheckCircle className="w-8 h-8 mb-3" />
            <h3 className="text-3xl font-bold">{completedCount}</h3>
            <p className="text-green-100 text-sm">Completed</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-lg transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            All ({projects.length})
          </button>
          <button
            onClick={() => setFilter('ongoing')}
            className={`px-6 py-2 rounded-lg transition ${
              filter === 'ongoing'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Ongoing ({ongoingCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-6 py-2 rounded-lg transition ${
              filter === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold mb-2">No projects found</h3>
            <p className="text-gray-400 mb-6">
              {filter === 'all' 
                ? "You haven't joined any projects yet"
                : `You don't have any ${filter} projects`
              }
            </p>
            <button
              onClick={() => navigate('/projects')}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition"
            >
              Browse Available Projects
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-blue-500 transition group"
              >
                {/* Project Image */}
                {project.image_url && (
                  <img
                    src={project.image_url}
                    alt={project.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition duration-300"
                  />
                )}

                <div className="p-6">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        project.status === 'ongoing'
                          ? 'bg-yellow-600'
                          : project.status === 'completed'
                          ? 'bg-green-600'
                          : 'bg-gray-600'
                      }`}
                    >
                      {project.status === 'ongoing' ? '🔄 Ongoing' : '✅ Completed'}
                    </span>
                    
                    {project.role && (
                      <span className="text-xs text-gray-400 capitalize">
                        {project.role}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition">
                    {project.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  {/* Meta Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{project.current_members || 0} members</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {new Date(project.joined_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Technologies */}
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.technologies.slice(0, 3).map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-800 rounded text-xs"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.technologies.length > 3 && (
                        <span className="px-2 py-1 bg-gray-800 rounded text-xs">
                          +{project.technologies.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Progress Bar (for ongoing projects) */}
                  {project.status === 'ongoing' && project.progress !== undefined && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Progress</span>
                        <span className="text-xs font-semibold">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* View Button */}
                  <button
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="w-full bg-gray-800 hover:bg-blue-600 py-2 rounded-lg transition"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

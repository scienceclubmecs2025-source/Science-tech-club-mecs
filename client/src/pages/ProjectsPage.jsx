import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Briefcase, Code, Users, Calendar } from 'lucide-react'
import api from '../services/api'

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    branch: 'all',
    domain: 'all',
    status: 'all'
  })

  const user = JSON.parse(localStorage.getItem('user'))

  const branches = ['CSE', 'AIML', 'CSD', 'IT', 'CME', 'Civil', 'Mech', 'ECE', 'EEE']
  const domains = [
    'Web Development',
    'Mobile Development',
    'AI/ML',
    'Data Science',
    'IoT',
    'Robotics',
    'Cloud Computing',
    'Cybersecurity',
    'Blockchain',
    'AR/VR',
    'Game Development',
    'DevOps'
  ]

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [projects, searchQuery, filters])

  const fetchProjects = async () => {
  try {
    const data = await api.get('/projects')   // ← remove res., use data directly
    setProjects(Array.isArray(data) ? data : [])
  } catch (error) {
    console.error('Failed to fetch projects:', error)
  } finally {
    setLoading(false)
  }
}

  const applyFilters = () => {
    let filtered = [...projects]

    if (searchQuery) {
      filtered = filtered.filter(project =>
        project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filters.branch !== 'all') {
      filtered = filtered.filter(project =>
        project.branch === filters.branch || project.branches?.includes(filters.branch)
      )
    }

    if (filters.domain !== 'all') {
      filtered = filtered.filter(project =>
        project.domain === filters.domain ||
        project.domains?.includes(filters.domain) ||
        project.tech_stack?.includes(filters.domain)
      )
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(project => project.status === filters.status)
    }

    setFilteredProjects(filtered)
  }

  const resetFilters = () => {
    setFilters({
      branch: 'all',
      domain: 'all',
      status: 'all'
    })
    setSearchQuery('')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-green-600'
      case 'in_progress': return 'bg-yellow-600'
      case 'completed': return 'bg-blue-600'
      case 'closed': return 'bg-gray-600'
      default: return 'bg-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-20 flex items-center justify-center">
        <div className="text-white text-xl">Loading projects...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Projects</h1>
            <p className="text-gray-400">Discover and join exciting projects</p>
          </div>

          <div className="flex gap-3">
            {user?.role === 'student' && (
              <button
                onClick={() => navigate('/my-projects')}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg transition text-white"
              >
                <Briefcase className="w-5 h-5" />
                My Projects
              </button>
            )}

            {(user?.role === 'admin' || user?.role === 'faculty' || user?.is_committee) && (
              <button
                onClick={() => navigate('/projects/create')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition text-white"
              >
                <Plus className="w-5 h-5" />
                Create Project
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-600"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 px-6 py-3 rounded-lg transition text-white"
            >
              <Filter className="w-5 h-5" />
              Filters
              {(filters.branch !== 'all' || filters.domain !== 'all' || filters.status !== 'all') && (
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Filters</h3>
                <button onClick={resetFilters} className="text-sm text-blue-400 hover:text-blue-300">
                  Reset All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Branch</label>
                  <select
                    value={filters.branch}
                    onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="all">All Branches</option>
                    {branches.map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Domain</label>
                  <select
                    value={filters.domain}
                    onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="all">All Domains</option>
                    {domains.map(domain => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6 text-gray-400">
          Showing {filteredProjects.length} of {projects.length} projects
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition group cursor-pointer"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition">
                    {project.title}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(project.status)}`}>
                    {project.status?.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-gray-400 mb-4 line-clamp-3">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tech_stack?.slice(0, 3).map((tech, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">
                      {tech}
                    </span>
                  ))}
                  {project.tech_stack?.length > 3 && (
                    <span className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-500">
                      +{project.tech_stack.length - 3} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    {project.vacancies > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {project.vacancies} spots
                      </div>
                    )}
                    {project.created_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(project.created_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Code className="w-16 h-16 mx-auto mb-4 text-gray-700" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No projects found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your filters or search query</p>
            <button
              onClick={resetFilters}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition text-white"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

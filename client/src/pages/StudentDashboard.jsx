import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  User, Award, BookOpen, Bell, ExternalLink, TrendingUp, Target,
  Code, MessageSquare, Calendar, ArrowRight, Plus, Users, Download, Edit3
} from 'lucide-react'
import Loading from '../components/Loading'
import MessagesFloatingButton from '../components/MessagesFloatingButton'
import api from '../services/api'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [projects, setProjects] = useState([])
  const [myProjects, setMyProjects] = useState([])
  const [reportFormat, setReportFormat] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  
  // Create project form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domain: '',
    technologies: '',
    image_url: '',
    github_url: '',
    live_url: '',
    max_members: 5
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
  try {
    const [profileRes, announcementsRes, allRes, myRes, formatRes] = await Promise.all([
      api.get('/users/profile'),
      api.get('/announcements'),
      api.get('/projects'),
      api.get('/projects/my-projects'),
      api.get('/report-formats/active').catch(() => ({ data: null }))
    ])

    setProfile(profileRes.data || null)
    setAnnouncements((announcementsRes.data || []).slice(0, 5))
    setProjects(allRes.data || [])
    setMyProjects(myRes.data || [])
    setReportFormat(formatRes.data || null)
  } catch (error) {
    console.error('Failed to fetch dashboard:', error)
  } finally {
    setLoading(false)
  }
}

  const handleCreateProject = async (e) => {
    e.preventDefault()
    setCreating(true)

    try {
      const techArray = formData.technologies
        .split(',')
        .map(t => t.trim())
        .filter(t => t)

      await api.post('/projects', {
        ...formData,
        technologies: techArray
      })

      alert('🎉 Project created successfully!')
      setShowCreateModal(false)
      setFormData({
        title: '',
        description: '',
        domain: '',
        technologies: '',
        image_url: '',
        github_url: '',
        live_url: '',
        max_members: 5
      })
      fetchData()
    } catch (error) {
      console.error('Create error:', error)
      alert(error.response?.data?.message || 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Welcome back, {profile?.full_name}! 
          </h1>
          <p className="text-gray-400 text-lg">
            {profile?.department} • Year {profile?.year}
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/profile')}
                className="group bg-gradient-to-br from-blue-900 to-blue-950 hover:from-blue-800 hover:to-blue-900 border border-blue-800 rounded-xl p-6 transition-all"
              >
                <User className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition" />
                <h3 className="font-semibold text-white mb-1">Profile</h3>
                <p className="text-xs text-blue-300">View & Edit</p>
              </button>

              <button
                onClick={() => navigate('/messages')}
                className="group bg-gradient-to-br from-purple-900 to-purple-950 hover:from-purple-800 hover:to-purple-900 border border-purple-800 rounded-xl p-6 transition-all"
              >
                <MessageSquare className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition" />
                <h3 className="font-semibold text-white mb-1">Messages</h3>
                <p className="text-xs text-purple-300">Chat & DMs</p>
              </button>

              <button
                onClick={() => navigate('/projects')}
                className="group bg-gradient-to-br from-pink-900 to-pink-950 hover:from-pink-800 hover:to-pink-900 border border-pink-800 rounded-xl p-6 transition-all"
              >
                <Code className="w-8 h-8 text-pink-400 mb-3 group-hover:scale-110 transition" />
                <h3 className="font-semibold text-white mb-1">Projects</h3>
                <p className="text-xs text-pink-300">Join & Create</p>
              </button>

              <button
                onClick={() => navigate('/courses')}
                className="group bg-gradient-to-br from-green-900 to-green-950 hover:from-green-800 hover:to-green-900 border border-green-800 rounded-xl p-6 transition-all"
              >
                <BookOpen className="w-8 h-8 text-green-400 mb-3 group-hover:scale-110 transition" />
                <h3 className="font-semibold text-white mb-1">Courses</h3>
                <p className="text-xs text-green-300">Learn</p>
              </button>

              <button
                onClick={() => navigate('/events')}
                className="group bg-gradient-to-br from-orange-900 to-orange-950 hover:from-orange-800 hover:to-orange-900 border border-orange-800 rounded-xl p-6 transition-all"
              >
                <Calendar className="w-8 h-8 text-orange-400 mb-3 group-hover:scale-110 transition" />
                <h3 className="font-semibold text-white mb-1">Events</h3>
                <p className="text-xs text-orange-300">Upcoming</p>
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="group bg-gradient-to-br from-emerald-900 to-emerald-950 hover:from-emerald-800 hover:to-emerald-900 border border-emerald-800 rounded-xl p-6 transition-all"
              >
                <Plus className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition" />
                <h3 className="font-semibold text-white mb-1">New Project</h3>
                <p className="text-xs text-emerald-300">Create</p>
              </button>

              <a
                href="https://club.ndl.iitkgp.ac.in"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-gradient-to-br from-cyan-900 to-cyan-950 hover:from-cyan-800 hover:to-cyan-900 border border-cyan-800 rounded-xl p-6 transition-all"
              >
                <ExternalLink className="w-8 h-8 text-cyan-400 mb-3 group-hover:scale-110 transition" />
                <h3 className="font-semibold text-white mb-1">NDLI</h3>
                <p className="text-xs text-cyan-300">Resources</p>
              </a>
            </div>

            {/* My Projects Section */}
            {myProjects.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">My Projects</h2>
                  <button
                    onClick={() => navigate('/projects')}
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                  >
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myProjects.slice(0, 4).map((project) => (
                    <div key={project.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          project.status === 'approved' ? 'bg-green-100 text-green-800' :
                          project.status === 'open' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {project.status?.toUpperCase()}
                        </span>
                        {project.role === 'creator' && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-bold">
                            Creator
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold mb-2 line-clamp-1">{project.title}</h3>
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">{project.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-gray-400">
                          <Users className="w-4 h-4" />
                          {project.current_members}/{project.max_members}
                        </div>
                        <span className="text-blue-400 font-medium">{project.progress || 0}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Research Section */}
            <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-700/50 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                🔬 Get into Research!
              </h2>
              <p className="text-indigo-100 mb-4">
                Join ongoing research projects, publish papers, and collaborate with faculty on cutting-edge technology.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/research')}
                  className="bg-white text-indigo-900 px-6 py-2 rounded-lg font-medium hover:bg-indigo-50 transition"
                >
                  Explore Research
                </button>
                <a
                  href="https://scholar.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-indigo-800 px-6 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                >
                  Google Scholar
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
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
                <div className="space-y-3">
                  {announcements.map(announcement => (
                    <div key={announcement.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition">
                      <h3 className="font-semibold text-sm mb-2">{announcement.title}</h3>
                      <p className="text-xs text-gray-400 line-clamp-2">{announcement.content}</p>
                      <span className="text-xs text-gray-600 mt-2 block">
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile Completion */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Profile Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Basic Info</span>
                  <span className="text-green-400">✓</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Profile Photo</span>
                  <span className={profile?.profile_photo_url ? "text-green-400" : "text-yellow-400"}>
                    {profile?.profile_photo_url ? "✓" : "○"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Interests</span>
                  <span className={profile?.interests?.length > 0 ? "text-green-400" : "text-yellow-400"}>
                    {profile?.interests?.length > 0 ? "✓" : "○"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg text-sm transition flex items-center justify-center gap-2"
              >
                Update Profile
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Create Project Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Create New Project</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Project Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    placeholder="Enter project title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description *</label>
                  <textarea
                    rows="4"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white resize-vertical"
                    placeholder="Describe your project..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Domain</label>
                    <select
                      value={formData.domain}
                      onChange={(e) => setFormData({...formData, domain: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                    >
                      <option value="">Select Domain</option>
                      <option value="Web Development">Web Development</option>
                      <option value="Mobile App">Mobile App</option>
                      <option value="AI/ML">AI/ML</option>
                      <option value="IoT">IoT</option>
                      <option value="Blockchain">Blockchain</option>
                      <option value="Data Science">Data Science</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Max Members</label>
                    <input
                      type="number"
                      min="2"
                      max="10"
                      value={formData.max_members}
                      onChange={(e) => setFormData({...formData, max_members: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Technologies (comma separated)</label>
                  <input
                    type="text"
                    value={formData.technologies}
                    onChange={(e) => setFormData({...formData, technologies: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="React, Node.js, MongoDB"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">GitHub URL</label>
                    <input
                      type="url"
                      value={formData.github_url}
                      onChange={(e) => setFormData({...formData, github_url: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                      placeholder="https://github.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Live URL</label>
                    <input
                      type="url"
                      value={formData.live_url}
                      onChange={(e) => setFormData({...formData, live_url: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Image URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                    placeholder="https://..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-6 rounded-lg font-medium"
                  >
                    {creating ? 'Creating...' : 'Create Project'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Floating Buttons */}
      <MessagesFloatingButton />
    </div>
  )
}

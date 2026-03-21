import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import {
  User, Award, BookOpen, Bell, CheckCircle,
  XCircle, Clock, KeyRound, AtSign, Eye, EyeOff
} from 'lucide-react'
import Loading from '../components/Loading'

export default function FacultyDashboard() {
  const [profile,         setProfile]         = useState(null)
  const [announcements,   setAnnouncements]   = useState([])
  const [pendingProjects, setPendingProjects] = useState([])
  const [pendingQuizzes,  setPendingQuizzes]  = useState([])
  const [loading,         setLoading]         = useState(true)

  // Self-service credentials modal
  const [showCredModal,  setShowCredModal]  = useState(false)
  const [credTab,        setCredTab]        = useState('password') // 'password' | 'username'
  const [currentPass,    setCurrentPass]    = useState('')
  const [newUsername,    setNewUsername]    = useState('')
  const [newPassword,    setNewPassword]    = useState('')
  const [confirmPass,    setConfirmPass]    = useState('')
  const [showCurrent,    setShowCurrent]    = useState(false)
  const [showNew,        setShowNew]        = useState(false)
  const [credLoading,    setCredLoading]    = useState(false)
  const [credError,      setCredError]      = useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [profileRes, announcementsRes, projectsRes, quizzesRes] = await Promise.all([
        api.get('/users/profile'),
        api.get('/announcements'),
        api.get('/projects?status=pending'),
        api.get('/quizzes?status=draft')
      ])
      setProfile(profileRes || null)
      setAnnouncements((Array.isArray(announcementsRes) ? announcementsRes : []).slice(0, 5))
      setPendingProjects(Array.isArray(projectsRes) ? projectsRes : [])
      const quizzes = Array.isArray(quizzesRes) ? quizzesRes : []
      setPendingQuizzes(quizzes.filter(q => q.created_by === profileRes?.id))
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveProject = async (projectId) => {
    try {
      await api.put(`/projects/${projectId}/status`, { status: 'approved', guide_id: profile.id })
      alert('Project approved!')
      fetchData()
    } catch { alert('Failed to approve project') }
  }

  const handleRejectProject = async (projectId) => {
    try {
      await api.put(`/projects/${projectId}/status`, { status: 'rejected' })
      alert('Project rejected')
      fetchData()
    } catch { alert('Failed to reject project') }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setCredError('')
    if (newPassword !== confirmPass) { setCredError('Passwords do not match'); return }
    if (newPassword.length < 6)      { setCredError('Password must be at least 6 characters'); return }
    setCredLoading(true)
    try {
      await api.put('/users/profile/password', {
        current_password: currentPass,
        new_password:     newPassword
      })
      alert('✅ Password changed successfully!')
      setShowCredModal(false)
      setCurrentPass(''); setNewPassword(''); setConfirmPass('')
    } catch (err) {
      setCredError(err?.response?.data?.message || 'Failed to change password')
    } finally { setCredLoading(false) }
  }

  const handleChangeUsername = async (e) => {
    e.preventDefault()
    setCredError('')
    if (!newUsername.trim()) { setCredError('Username cannot be empty'); return }
    if (newUsername.trim().length < 3) { setCredError('Username must be at least 3 characters'); return }
    setCredLoading(true)
    try {
      await api.put('/users/profile/username', { username: newUsername.trim() })
      alert('✅ Username changed successfully! Please log in again.')
      localStorage.clear()
      window.location.href = '/login'
    } catch (err) {
      setCredError(err?.response?.data?.message || 'Failed to change username')
    } finally { setCredLoading(false) }
  }

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome, {profile?.full_name || profile?.username} 👨‍🏫
            </h1>
            <p className="text-gray-400">{profile?.department} Department</p>
            <p className="text-gray-600 text-sm mt-1">
              Employee ID: <span className="text-gray-400 font-mono">{profile?.employment_id || '—'}</span>
            </p>
          </div>
          <button
            onClick={() => { setShowCredModal(true); setCredError(''); setCredTab('password') }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-700 hover:border-blue-500 rounded-lg text-sm transition"
          >
            <KeyRound className="w-4 h-4 text-blue-400" />
            Change Credentials
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { icon: Clock,        color: 'blue',   value: pendingProjects.length, label: 'Pending Approvals' },
            { icon: CheckCircle,  color: 'green',  value: 0,                      label: 'Approved Projects' },
            { icon: BookOpen,     color: 'purple', value: pendingQuizzes.length,  label: 'My Quizzes' },
            { icon: Award,        color: 'orange', value: 0,                      label: 'Guided Students' },
          ].map(({ icon: Icon, color, value, label }) => (
            <div key={label} className={`bg-gradient-to-br from-${color}-600 to-${color}-800 p-6 rounded-xl`}>
              <Icon className="w-8 h-8 mb-4" />
              <h3 className="text-2xl font-bold">{value}</h3>
              <p className={`text-${color}-100`}>{label}</p>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* Quick Actions */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { to: '/profile',        icon: User,     color: 'blue',   label: 'My Profile' },
                  { to: '/projects',       icon: Award,    color: 'purple', label: 'My Projects' },
                  { to: '/quizzes/create', icon: BookOpen, color: 'green',  label: 'Create Quiz' },
                  { to: '/courses',        icon: BookOpen, color: 'cyan',   label: 'Browse Courses' },
                ].map(({ to, icon: Icon, color, label }) => (
                  <Link key={to} to={to}
                    className="flex flex-col items-center gap-3 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
                  >
                    <Icon className={`w-8 h-8 text-${color}-400`} />
                    <span className="text-sm text-center">{label}</span>
                  </Link>
                ))}
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
              ) : pendingProjects.map(project => (
                <div key={project.id} className="bg-gray-800 p-4 rounded-lg mb-3">
                  <h3 className="font-semibold">{project.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{project.description}</p>
                  <p className="text-xs text-gray-500 mt-2">By: {project.creator?.username}</p>
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => handleApproveProject(project.id)}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm transition">
                      <CheckCircle className="w-4 h-4" /> Approve & Guide
                    </button>
                    <button onClick={() => handleRejectProject(project.id)}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm transition">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* My Quizzes */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">My Quizzes</h2>
                <Link to="/quizzes/create" className="text-blue-400 hover:text-blue-300 text-sm">+ Create New</Link>
              </div>
              {pendingQuizzes.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                  <p className="text-gray-500 mb-4">No quizzes created yet</p>
                  <Link to="/quizzes/create" className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition">
                    Create Quiz
                  </Link>
                </div>
              ) : pendingQuizzes.map(quiz => (
                <div key={quiz.id} className="bg-gray-800 p-4 rounded-lg mb-3">
                  <h3 className="font-semibold">{quiz.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{quiz.description}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      quiz.status === 'approved' ? 'bg-green-600' :
                      quiz.status === 'draft'    ? 'bg-yellow-600' : 'bg-gray-600'
                    }`}>{quiz.status}</span>
                    {quiz.status === 'draft' && <span className="text-xs text-gray-500">Waiting for admin approval</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Announcements */}
          <div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-bold">Announcements</h2>
              </div>
              {announcements.length === 0 ? (
                <p className="text-gray-500 text-sm">No announcements yet.</p>
              ) : announcements.map(a => (
                <div key={a.id} className="bg-gray-800 p-4 rounded-lg mb-3">
                  <h3 className="font-semibold text-sm">{a.title}</h3>
                  <p className="text-xs text-gray-400 mt-2">{a.content}</p>
                  <span className="text-xs text-gray-600 mt-2 block">
                    {new Date(a.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Change Credentials Modal ── */}
      {showCredModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-400" /> Change Credentials
            </h3>

            {/* Sub-tabs */}
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => { setCredTab('password'); setCredError('') }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  credTab === 'password' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-4 h-4" /> Password
              </button>
              <button
                onClick={() => { setCredTab('username'); setCredError('') }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  credTab === 'username' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <AtSign className="w-4 h-4" /> Username
              </button>
            </div>

            {/* Change Password */}
            {credTab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPass}
                      onChange={e => setCurrentPass(e.target.value)}
                      placeholder="Your current password"
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button type="button" onClick={() => setShowCurrent(v => !v)}
                      className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300">
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">New Password</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="New password (min 6 chars)"
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 pr-10 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button type="button" onClick={() => setShowNew(v => !v)}
                      className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300">
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPass}
                    onChange={e => setConfirmPass(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                {credError && <p className="text-red-400 text-sm">{credError}</p>}
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={credLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-2.5 rounded-lg text-sm font-medium transition">
                    {credLoading ? 'Changing...' : 'Change Password'}
                  </button>
                  <button type="button" onClick={() => setShowCredModal(false)}
                    className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Change Username */}
            {credTab === 'username' && (
              <form onSubmit={handleChangeUsername} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Current Username</label>
                  <input
                    type="text"
                    value={profile?.username || ''}
                    disabled
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-500 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">New Username</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="New username (min 3 chars)"
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-gray-600 text-xs mt-1">⚠️ You will be logged out after changing username</p>
                </div>
                {credError && <p className="text-red-400 text-sm">{credError}</p>}
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={credLoading}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 py-2.5 rounded-lg text-sm font-medium transition">
                    {credLoading ? 'Changing...' : 'Change Username'}
                  </button>
                  <button type="button" onClick={() => setShowCredModal(false)}
                    className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

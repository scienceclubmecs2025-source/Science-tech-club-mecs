import { useState, useEffect } from 'react'
import { 
  Users, BookOpen, Upload, UserPlus, Key, Trash2, GraduationCap,
  Settings, Calendar, Award, FileText, Bell, Download, Shield,
  Database, Activity, UserCheck, Check
} from 'lucide-react'
import api from '../services/api'
import { generateStatisticsReport } from '../utils/reportGenerator'

export default function AdminPanel() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [allUsers, setAllUsers] = useState([])
  const [events, setEvents] = useState([])
  const [projects, setProjects] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [reportFormats, setReportFormats] = useState([])
  const [generatingReport, setGeneratingReport] = useState(false)

  const [newStudent, setNewStudent] = useState({ 
    username: '', email: '', department: '', year: 1, rollnumber: '', dob: '' 
  })
  const [newFaculty, setNewFaculty] = useState({ 
    username: '', email: '', department: '', employmentid: ''
  })
  const [config, setConfig] = useState({
    site_name: 'Science & Tech Club',
    logo_url: '',
    mecs_logo_url: '',
    theme_mode: 'dark',
    primary_color: '#3b82f6',
    watermark_opacity: '0.25'
  })
  const [newAnnouncement, setNewAnnouncement] = useState({ 
    title: '', content: '', target_audience: 'all' 
  })
  const [reportFormData, setReportFormData] = useState({
    title: '', academic_year: '', file: null
  })
  const [uploadingReport, setUploadingReport] = useState(false)

  const user = JSON.parse(localStorage.getItem('user'))

  const departments = ['CSE', 'AIML', 'CSD', 'IT', 'CME', 'Civil', 'Mech', 'ECE', 'EEE']
  
  const committeePosts = [
    'Chair', 'Vice Chair', 'Secretary', 'Vice Secretary',
    'CSE Head', 'CSE Vice Head', 'AIML Head', 'AIML Vice Head',
    'CSD Head', 'CSD Vice Head', 'IT Head', 'IT Vice Head',
    'CME Head', 'CME Vice Head', 'Civil Head', 'Civil Vice Head',
    'Mech Head', 'Mech Vice Head', 'ECE Head', 'ECE Vice Head',
    'EEE Head', 'EEE Vice Head', 'Executive Head', 'Executive Member',
    'Representative Head', 'Representative Member', 'Developer'
  ]

  useEffect(() => {
    fetchDashboard()
    if (activeTab === 'users') fetchAllUsers()
    if (activeTab === 'events') fetchEvents()
    if (activeTab === 'projects') fetchProjects()
    if (activeTab === 'announcements') fetchAnnouncements()
    if (activeTab === 'config') fetchConfig()
    if (activeTab === 'reports') fetchReportFormats()
  }, [activeTab])

  // ✅ FIXED: use response.data not response directly
  const fetchDashboard = async () => {
    try {
      const [usersRes, evtsRes, projsRes] = await Promise.all([
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/events').catch(() => ({ data: [] })),
        api.get('/projects').catch(() => ({ data: [] }))
      ])
      const u = Array.isArray(usersRes.data) ? usersRes.data : []
      const e = Array.isArray(evtsRes.data) ? evtsRes.data : []
      const p = Array.isArray(projsRes.data) ? projsRes.data : []
      setStats({
        total_users: u.length,
        committee_members: u.filter(x => x.is_committee).length,
        total_events: e.length,
        total_projects: p.length,
        active_students: u.filter(x => x.role === 'student').length,
        faculty_count: u.filter(x => x.role === 'faculty').length,
      })
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllUsers = async () => {
    try {
      const response = await api.get('/users')
      setAllUsers(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events')
      setEvents(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects')
      setProjects(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('/announcements')
      setAnnouncements(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
    }
  }

  const fetchConfig = async () => {
    try {
      const response = await api.get('/config')
      setConfig(prev => ({ ...prev, ...(response.data || {}) }))
    } catch (error) {
      console.error('Failed to fetch config:', error)
    }
  }

  const fetchReportFormats = async () => {
    try {
      const response = await api.get('/reports')
      setReportFormats(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Failed to fetch formats:', error)
    }
  }

  const handleAddStudent = async (e) => {
    e.preventDefault()
    try {
      const dobParts = newStudent.dob.split('-')
      const username = `${newStudent.username}${dobParts[2]}${dobParts[1]}${dobParts[0].slice(-2)}`
      await api.post('/admin/add-student', {
        username,
        email: newStudent.email,
        password: newStudent.rollnumber,
        roll_number: newStudent.rollnumber,
        department: newStudent.department,
        year: newStudent.year,
        dob: newStudent.dob
      })
      alert('Student added successfully')
      setNewStudent({ username: '', email: '', department: '', year: 1, rollnumber: '', dob: '' })
      fetchDashboard()
      fetchAllUsers()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add student')
    }
  }

  const handleAddFaculty = async (e) => {
    e.preventDefault()
    try {
      const username = newFaculty.email.split('@')[0]
      await api.post('/admin/add-faculty', {
        username,
        email: newFaculty.email,
        password: newFaculty.employmentid,
        employment_id: newFaculty.employmentid,
        department: newFaculty.department
      })
      alert('Faculty added successfully')
      setNewFaculty({ username: '', email: '', department: '', employmentid: '' })
      fetchDashboard()
      fetchAllUsers()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add faculty')
    }
  }

  const handleChangeRole = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole })
      alert('Role updated successfully')
      fetchAllUsers()
    } catch (error) {
      alert('Failed to update role')
    }
  }

  const handleAssignCommitteePost = async (userId, post) => {
    try {
      await api.put(`/users/${userId}`, { 
        committee_post: post,
        is_committee: post !== null && post !== ''
      })
      alert('Committee post assigned')
      fetchAllUsers()
    } catch (error) {
      alert('Failed to assign post')
    }
  }

  const handleGraduateStudents = async () => {
    if (!confirm('Graduate all students? 1→2, 2→3, 3→4, 4→deleted')) return
    try {
      const students = allUsers.filter(u => u.role === 'student' && u.year)
      for (const student of students) {
        if (student.year === 4) {
          await api.delete(`/users/${student.id}`)
        } else {
          await api.put(`/users/${student.id}`, { year: student.year + 1 })
        }
      }
      alert('All students graduated!')
      fetchAllUsers()
      fetchDashboard()
    } catch (error) {
      alert('Failed to graduate students')
    }
  }

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Delete user ${username}?`)) return
    try {
      await api.delete(`/users/${userId}`)
      alert('User deleted')
      fetchAllUsers()
      fetchDashboard()
    } catch (error) {
      alert('Failed to delete user')
    }
  }

  const handleUploadStudents = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      await api.post('/admin/upload-students', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      alert('Students uploaded successfully')
      fetchDashboard()
      fetchAllUsers()
      e.target.value = null
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to upload students')
    }
  }

  const handleUploadFaculty = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      await api.post('/admin/upload-faculty', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      alert('Faculty uploaded successfully')
      fetchDashboard()
      fetchAllUsers()
      e.target.value = null
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to upload faculty')
    }
  }

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault()
    try {
      await api.post('/announcements', newAnnouncement)
      alert('Announcement created successfully')
      setNewAnnouncement({ title: '', content: '', target_audience: 'all' })
      fetchAnnouncements()
    } catch (error) {
      alert('Failed to create announcement')
    }
  }

  const handleDeleteAnnouncement = async (id) => {
    if (!confirm('Delete this announcement?')) return
    try {
      await api.delete(`/announcements/${id}`)
      alert('Announcement deleted')
      fetchAnnouncements()
    } catch (error) {
      alert('Failed to delete announcement')
    }
  }

  const handleApproveEvent = async (eventId) => {
    try {
      await api.put(`/events/${eventId}/status`, { status: 'approved' })
      alert('Event approved')
      fetchEvents()
    } catch (error) {
      alert('Failed to approve event')
    }
  }

  const handleConfigSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.put('/config', config)
      alert('Configuration updated successfully!')
    } catch (error) {
      alert('Failed to update configuration')
    }
  }

  const handleUploadReport = async (e) => {
    e.preventDefault()
    if (!reportFormData.file) { alert('Please select a file'); return }
    setUploadingReport(true)
    try {
      const data = new FormData()
      data.append('file', reportFormData.file)
      data.append('title', reportFormData.title)
      data.append('academic_year', reportFormData.academic_year)
      await api.post('/reports/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      alert('Report format uploaded successfully!')
      setReportFormData({ title: '', academic_year: '', file: null })
      fetchReportFormats()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to upload format')
    } finally {
      setUploadingReport(false)
    }
  }

  const handleDeleteReport = async (id) => {
    if (!confirm('Delete this report format?')) return
    try {
      await api.delete(`/reports/${id}`)
      alert('Format deleted successfully')
      fetchReportFormats()
    } catch (error) {
      alert('Failed to delete format')
    }
  }

  const handleActivateReport = async (id) => {
    try {
      await api.put(`/reports/${id}/activate`)
      alert('Format activated successfully')
      fetchReportFormats()
    } catch (error) {
      alert('Failed to activate format')
    }
  }

  // ✅ FIXED: use response.data
  const handleGenerateReport = async () => {
    setGeneratingReport(true)
    try {
      const [usersRes, evtsRes, projsRes] = await Promise.all([
        api.get('/users'),
        api.get('/events'),
        api.get('/projects')
      ])
      const u = Array.isArray(usersRes.data) ? usersRes.data : []
      const e = Array.isArray(evtsRes.data) ? evtsRes.data : []
      const p = Array.isArray(projsRes.data) ? projsRes.data : []
      const reportStats = {
        total_users: u.length,
        committee_members: u.filter(x => x.is_committee).length,
        active_students: u.filter(x => x.role === 'student').length,
        faculty_count: u.filter(x => x.role === 'faculty').length,
        total_events: e.length,
        total_projects: p.length
      }
      await generateStatisticsReport(reportStats, u, e, p)
      alert('Report generated successfully!')
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setGeneratingReport(false)
    }
  }

  const downloadCSVTemplate = (type) => {
    let csvContent = ''
    if (type === 'students') {
      csvContent = 'surname,email,roll_number,dob,department,year\nMathsa,mathsa@example.com,21R11A0501,2005-06-07,CSE,1\nKumar,kumar@example.com,21R11A0502,2004-12-15,ECE,2'
    } else {
      csvContent = 'email,employment_id,department\ndrsmith@college.edu,EMP12345,CSE\nprofjones@college.edu,EMP12346,ECE'
    }
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}_template.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-20">
        <div className="text-white text-xl">Loading Admin Panel...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Admin Control Panel</h1>
              <p className="text-gray-400">Welcome back, {user?.full_name || user?.username}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 border border-blue-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-300" />
              <span className="text-3xl font-bold">{stats?.total_users || 0}</span>
            </div>
            <h3 className="text-blue-200 font-medium">Total Users</h3>
          </div>
          <div className="bg-gradient-to-br from-purple-900 to-purple-800 border border-purple-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-8 h-8 text-purple-300" />
              <span className="text-3xl font-bold">{stats?.committee_members || 0}</span>
            </div>
            <h3 className="text-purple-200 font-medium">Committee</h3>
          </div>
          <div className="bg-gradient-to-br from-green-900 to-green-800 border border-green-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-green-300" />
              <span className="text-3xl font-bold">{stats?.total_events || 0}</span>
            </div>
            <h3 className="text-green-200 font-medium">Events</h3>
          </div>
          <div className="bg-gradient-to-br from-yellow-900 to-yellow-800 border border-yellow-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-8 h-8 text-yellow-300" />
              <span className="text-3xl font-bold">{stats?.total_projects || 0}</span>
            </div>
            <h3 className="text-yellow-200 font-medium">Projects</h3>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <div className="flex border-b border-gray-800 overflow-x-auto scrollbar-hide">
            {[
              { id: 'overview', label: 'Overview', icon: Settings },
              { id: 'users', label: 'Manage Users', icon: Users },
              { id: 'committee', label: 'Committee', icon: Award },
              { id: 'announcements', label: 'Announcements', icon: Bell },
              { id: 'events', label: 'Events', icon: Calendar },
              { id: 'projects', label: 'Projects', icon: FileText },
              { id: 'reports', label: 'Report Formats', icon: Download },
              { id: 'add-student', label: 'Add Student', icon: UserPlus },
              { id: 'add-faculty', label: 'Add Faculty', icon: UserPlus },
              { id: 'upload', label: 'Upload CSV', icon: Upload },
              { id: 'config', label: 'Site Config', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap ${
                  activeTab === tab.id ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <UserCheck className="w-6 h-6 text-blue-400" />
                      <h3 className="font-bold">Active Students</h3>
                    </div>
                    <p className="text-3xl font-bold">{stats?.active_students || 0}</p>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Award className="w-6 h-6 text-purple-400" />
                      <h3 className="font-bold">Faculty</h3>
                    </div>
                    <p className="text-3xl font-bold">{stats?.faculty_count || 0}</p>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Activity className="w-6 h-6 text-green-400" />
                      <h3 className="font-bold">System Status</h3>
                    </div>
                    <p className="text-2xl font-bold text-green-400">Operational</p>
                  </div>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={handleGraduateStudents}
                      className="w-full flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg transition"
                    >
                      <GraduationCap className="w-5 h-5" />
                      Graduate All Students
                    </button>
                    <button
                      onClick={handleGenerateReport}
                      disabled={generatingReport}
                      className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileText className="w-5 h-5" />
                      {generatingReport ? 'Generating...' : 'Generate Statistics Report'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">All Users ({allUsers.length})</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">User</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Role</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Department</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Year</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((u) => (
                        <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {u.profile_photo_url ? (
                                <img src={u.profile_photo_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold">
                                  {u.full_name?.[0]?.toUpperCase() || u.username?.[0]?.toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-white">{u.full_name || u.username}</p>
                                <p className="text-sm text-gray-400">@{u.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-400">{u.email}</td>
                          <td className="py-3 px-4">
                            <select
                              value={u.role}
                              onChange={(e) => handleChangeRole(u.id, e.target.value)}
                              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm"
                            >
                              <option value="student">Student</option>
                              <option value="faculty">Faculty</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="py-3 px-4 text-gray-300">{u.department || '-'}</td>
                          <td className="py-3 px-4 text-gray-300">{u.year || '-'}</td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              className="p-2 bg-red-600 hover:bg-red-700 rounded transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Committee Tab */}
            {activeTab === 'committee' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">Committee Management</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Username</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Current Post</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Assign Post</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.filter(u => u.role === 'student' || u.is_committee).map((u) => (
                        <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                          <td className="py-3 px-4 text-white">{u.username}</td>
                          <td className="py-3 px-4 text-gray-400 text-sm">{u.email}</td>
                          <td className="py-3 px-4 text-gray-400">
                            {u.committee_post ? (
                              <span className="px-2 py-1 bg-green-600 rounded text-sm">{u.committee_post}</span>
                            ) : 'None'}
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={u.committee_post || ''}
                              onChange={(e) => handleAssignCommitteePost(u.id, e.target.value || null)}
                              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                            >
                              <option value="">None</option>
                              {committeePosts.map(post => (
                                <option key={post} value={post}>{post}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Announcements Tab */}
            {activeTab === 'announcements' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">Manage Announcements</h2>
                <form onSubmit={handleCreateAnnouncement} className="bg-gray-800 p-6 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Create Announcement</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                      <input type="text" value={newAnnouncement.title}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
                      <textarea value={newAnnouncement.content}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white h-24" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Target Audience</label>
                      <select value={newAnnouncement.target_audience}
                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, target_audience: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white">
                        <option value="all">All</option>
                        <option value="students">Students Only</option>
                        <option value="faculty">Faculty Only</option>
                        <option value="committee">Committee Only</option>
                      </select>
                    </div>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition">
                      Create Announcement
                    </button>
                  </div>
                </form>
                <div className="space-y-4">
                  {announcements.map(ann => (
                    <div key={ann.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-white">{ann.title}</h4>
                        <p className="text-gray-400 text-sm mt-1">{ann.content}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-500">{new Date(ann.created_at).toLocaleDateString()}</span>
                          <span className="px-2 py-1 bg-blue-600 rounded text-xs">{ann.target_audience}</span>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteAnnouncement(ann.id)} className="p-2 bg-red-600 hover:bg-red-700 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">Events Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map(event => (
                    <div key={event.id} className="bg-gray-800 p-4 rounded-lg">
                      <h4 className="font-semibold text-white">{event.title}</h4>
                      <p className="text-gray-400 text-sm mt-2">{event.description}</p>
                      <p className="text-gray-500 text-xs mt-2">{event.date}</p>
                      <div className="flex items-center justify-between mt-4">
                        <span className={`px-3 py-1 rounded text-xs ${event.status === 'approved' ? 'bg-green-600' : 'bg-yellow-600'}`}>
                          {event.status}
                        </span>
                        {event.status === 'draft' && (
                          <button onClick={() => handleApproveEvent(event.id)} className="bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded text-sm">
                            Approve
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects Tab */}
            {activeTab === 'projects' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">Projects Overview</h2>
                <div className="space-y-4">
                  {projects.map(proj => (
                    <div key={proj.id} className="bg-gray-800 p-4 rounded-lg">
                      <h4 className="font-semibold text-white">{proj.title}</h4>
                      <p className="text-gray-400 text-sm mt-2">{proj.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span>Status: {proj.status}</span>
                        <span>Vacancies: {proj.vacancies}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Project Report Formats</h2>
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8">
                  <h3 className="text-xl font-bold mb-4">Upload New Format</h3>
                  <form onSubmit={handleUploadReport} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Format Title</label>
                      <input type="text" value={reportFormData.title}
                        onChange={(e) => setReportFormData({...reportFormData, title: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                        placeholder="e.g., Project Report Format 2026" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Academic Year</label>
                      <input type="text" value={reportFormData.academic_year}
                        onChange={(e) => setReportFormData({...reportFormData, academic_year: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                        placeholder="e.g., 2025-2026" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Upload Document (.doc or .docx)</label>
                      <input type="file" accept=".doc,.docx"
                        onChange={(e) => setReportFormData({...reportFormData, file: e.target.files[0]})}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white" required />
                      {reportFormData.file && (
                        <p className="text-sm text-gray-400 mt-2">Selected: {reportFormData.file.name}</p>
                      )}
                    </div>
                    <button type="submit" disabled={uploadingReport}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      {uploadingReport ? 'Uploading...' : 'Upload Format'}
                    </button>
                  </form>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-xl">
                  <div className="p-6 border-b border-gray-700">
                    <h3 className="text-xl font-bold">Uploaded Formats</h3>
                  </div>
                  <div className="divide-y divide-gray-700">
                    {reportFormats.length === 0 ? (
                      <div className="p-8 text-center text-gray-400">No report formats uploaded yet</div>
                    ) : (
                      reportFormats.map((format) => (
                        <div key={format.id} className="p-6 flex items-center justify-between hover:bg-gray-700/30">
                          <div className="flex items-center gap-4">
                            <FileText className="w-8 h-8 text-blue-400" />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-white">{format.title}</h4>
                                {format.is_active && (
                                  <span className="bg-green-900/50 text-green-400 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Active
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />{format.academic_year}
                                </span>
                                <span>{format.file_name}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a href={format.file_url} download
                              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                              <Download className="w-4 h-4" /> Download
                            </a>
                            {!format.is_active && (
                              <button onClick={() => handleActivateReport(format.id)}
                                className="bg-green-900/50 hover:bg-green-900/70 text-green-400 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4" /> Set Active
                              </button>
                            )}
                            <button onClick={() => handleDeleteReport(format.id)}
                              className="bg-red-900/50 hover:bg-red-900/70 text-red-400 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Add Student Tab */}
            {activeTab === 'add-student' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">Add New Student</h2>
                <form onSubmit={handleAddStudent} className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Surname</label>
                      <input type="text" value={newStudent.username}
                        onChange={(e) => setNewStudent({ ...newStudent, username: e.target.value })}
                        placeholder="Mathsa" className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" required />
                      <p className="text-xs text-gray-500 mt-1">Will generate username</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Date of Birth</label>
                      <input type="date" value={newStudent.dob}
                        onChange={(e) => setNewStudent({ ...newStudent, dob: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" required />
                      <p className="text-xs text-gray-500 mt-1">Format: YYYY-MM-DD</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Roll Number</label>
                      <input type="text" value={newStudent.rollnumber}
                        onChange={(e) => setNewStudent({ ...newStudent, rollnumber: e.target.value })}
                        placeholder="21R11A0501" className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" required />
                      <p className="text-xs text-gray-500 mt-1">Will be used as password</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      <input type="email" value={newStudent.email}
                        onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
                      <select value={newStudent.department}
                        onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" required>
                        <option value="">Select Department</option>
                        {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                      <select value={newStudent.year}
                        onChange={(e) => setNewStudent({ ...newStudent, year: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                        <option value={1}>1st Year</option>
                        <option value={2}>2nd Year</option>
                        <option value={3}>3rd Year</option>
                        <option value={4}>4th Year</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition">
                    <UserPlus className="w-5 h-5" /> Add Student
                  </button>
                </form>
              </div>
            )}

            {/* Add Faculty Tab */}
            {activeTab === 'add-faculty' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">Add New Faculty</h2>
                <form onSubmit={handleAddFaculty} className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      <input type="email" value={newFaculty.email}
                        onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })}
                        placeholder="faculty@example.com" className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" required />
                      <p className="text-xs text-gray-500 mt-1">Username will be generated</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Employment ID</label>
                      <input type="text" value={newFaculty.employmentid}
                        onChange={(e) => setNewFaculty({ ...newFaculty, employmentid: e.target.value })}
                        placeholder="EMP12345" className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" required />
                      <p className="text-xs text-gray-500 mt-1">Will be used as password</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
                    <select value={newFaculty.department}
                      onChange={(e) => setNewFaculty({ ...newFaculty, department: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" required>
                      <option value="">Select Department</option>
                      {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition">
                    <UserPlus className="w-5 h-5" /> Add Faculty
                  </button>
                </form>
              </div>
            )}

            {/* Upload CSV Tab */}
            {activeTab === 'upload' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">Bulk Upload Users</h2>
                <p className="text-sm text-gray-400 mb-8">Upload students and faculty in bulk using CSV files. Download templates below.</p>
                <div className="space-y-8 max-w-4xl">
                  <div className="bg-gray-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Upload Students CSV</h3>
                      <button onClick={() => downloadCSVTemplate('students')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition">
                        <Download className="w-4 h-4" /> Download Template
                      </button>
                    </div>
                    <input type="file" accept=".csv" onChange={handleUploadStudents}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700" />
                  </div>
                  <div className="bg-gray-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Upload Faculty CSV</h3>
                      <button onClick={() => downloadCSVTemplate('faculty')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition">
                        <Download className="w-4 h-4" /> Download Template
                      </button>
                    </div>
                    <input type="file" accept=".csv" onChange={handleUploadFaculty}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700" />
                  </div>
                </div>
              </div>
            )}

            {/* Config Tab */}
            {activeTab === 'config' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Site Configuration</h2>
                <form onSubmit={handleConfigSubmit} className="space-y-6 max-w-3xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white mb-2 text-sm font-medium">Site Name</label>
                      <input type="text" value={config.site_name}
                        onChange={(e) => setConfig({...config, site_name: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                        placeholder="Science & Tech Club" />
                    </div>
                    <div>
                      <label className="block text-white mb-2 text-sm font-medium">Theme Mode</label>
                      <select value={config.theme_mode}
                        onChange={(e) => setConfig({...config, theme_mode: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600">
                        <option value="dark">Dark Theme</option>
                        <option value="light">Light Theme</option>
                        <option value="auto">Auto (System)</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white mb-2 text-sm font-medium">Club Logo URL</label>
                      <input type="url" value={config.logo_url}
                        onChange={(e) => setConfig({...config, logo_url: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                        placeholder="https://your-logo-url.com/logo.png" />
                      {config.logo_url && (
                        <div className="mt-2 p-2 bg-gray-800 rounded-lg inline-block">
                          <img src={config.logo_url} alt="Club Logo Preview" className="h-12 w-auto" />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-white mb-2 text-sm font-medium">MECS College Logo URL</label>
                      <input type="url" value={config.mecs_logo_url}
                        onChange={(e) => setConfig({...config, mecs_logo_url: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                        placeholder="https://mecs-logo-url.com/logo.png" />
                      {config.mecs_logo_url && (
                        <div className="mt-2 p-2 bg-gray-800 rounded-lg inline-block">
                          <img src={config.mecs_logo_url} alt="MECS Logo Preview" className="h-12 w-auto" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white mb-2 text-sm font-medium">Primary Color</label>
                      <div className="flex gap-2">
                        <input type="color" value={config.primary_color}
                          onChange={(e) => setConfig({...config, primary_color: e.target.value})}
                          className="w-16 h-12 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer" />
                        <input type="text" value={config.primary_color}
                          onChange={(e) => setConfig({...config, primary_color: e.target.value})}
                          className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
                          placeholder="#3b82f6" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-white mb-2 text-sm font-medium">Watermark Opacity (0.1 - 0.5)</label>
                      <input type="number" min="0.1" max="0.5" step="0.05" value={config.watermark_opacity}
                        onChange={(e) => setConfig({...config, watermark_opacity: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600" />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-medium transition">
                    Save Configuration
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

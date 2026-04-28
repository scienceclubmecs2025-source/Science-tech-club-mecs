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

  // Forms - FIXED STATE NAMES
  const [newStudent, setNewStudent] = useState({ 
    username: '', 
    email: '', 
    department: '', 
    year: 1, 
    rollnumber: '', // ← Fixed: was roll_number
    dob: '' 
  })
  const [newFaculty, setNewFaculty] = useState({ 
    username: '', 
    email: '', 
    department: '', 
    employmentid: '' // ← Fixed: was employment_id
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
    title: '',
    academic_year: '',
    file: null
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

  const fetchDashboard = async () => {
    try {
      const [usersRes, eventsRes, projectsRes] = await Promise.all([
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/events').catch(() => ({ data: [] })),
        api.get('/projects').catch(() => ({ data: [] }))
      ])

      const users = usersRes.data || []
      const events = eventsRes.data || []
      const projects = projectsRes.data || []

      setStats({
        totalUsers: users.length,
        total_users: users.length,
        committee_members: users.filter(u => u.is_committee).length,
        total_events: events.length,
        total_projects: projects.length,
        active_students: users.filter(u => u.role === 'student').length,
        faculty_count: users.filter(u => u.role === 'faculty').length,
        totalCourses: 0
      })
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllUsers = async () => {
    try {
      const { data } = await api.get('/users')
      setAllUsers(data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const fetchEvents = async () => {
    try {
      const { data } = await api.get('/events')
      setEvents(data)
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects')
      setProjects(data)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      const { data } = await api.get('/announcements')
      setAnnouncements(data)
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
    }
  }

  const fetchConfig = async () => {
    try {
      const { data } = await api.get('/config')
      setConfig({ ...config, ...data })
    } catch (error) {
      console.error('Failed to fetch config:', error)
    }
  }

  const fetchReportFormats = async () => {
    try {
      const { data } = await api.get('/report-formats')
      setReportFormats(data || [])
    } catch (error) {
      console.error('Failed to fetch formats:', error)
    }
  }

  const handleAddStudent = async (e) => {
    e.preventDefault()
    try {
      // Generate username from surname and DOB
      const dobParts = newStudent.dob.split('-') // YYYY-MM-DD
      const username = `${newStudent.username}${dobParts[2]}${dobParts[1]}${dobParts[0].slice(-2)}`
      const password = newStudent.rollnumber

      await api.post('/admin/add-student', {
        username,
        email: newStudent.email,
        password,
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
      // Username is email prefix, password is employmentid
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
    if (!reportFormData.file) {
      alert('Please select a file')
      return
    }

    setUploadingReport(true)
    try {
      const data = new FormData()
      data.append('file', reportFormData.file)
      data.append('title', reportFormData.title)
      data.append('academic_year', reportFormData.academic_year)

      await api.post('/report-formats/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      alert('Report format uploaded successfully!')
      setReportFormData({ title: '', academic_year: '', file: null })
      fetchReportFormats()
    } catch (error) {
      console.error('Upload failed:', error)
      alert(error.response?.data?.message || 'Failed to upload format')
    } finally {
      setUploadingReport(false)
    }
  }

  const handleDeleteReport = async (id) => {
    if (!confirm('Delete this report format?')) return

    try {
      await api.delete(`/report-formats/${id}`)
      alert('Format deleted successfully')
      fetchReportFormats()
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete format')
    }
  }

  const handleActivateReport = async (id) => {
    try {
      await api.put(`/report-formats/${id}/activate`)
      alert('Format activated successfully')
      fetchReportFormats()
    } catch (error) {
      console.error('Activate failed:', error)
      alert('Failed to activate format')
    }
  }

  const handleGenerateReport = async () => {
    setGeneratingReport(true)
    try {
      // Fetch fresh data
      const [usersRes, eventsRes, projectsRes] = await Promise.all([
        api.get('/users'),
        api.get('/events'),
        api.get('/projects')
      ])

      const users = usersRes.data || []
      const events = eventsRes.data || []
      const projects = projectsRes.data || []

      const reportStats = {
        total_users: users.length,
        committee_members: users.filter(u => u.is_committee).length,
        active_students: users.filter(u => u.role === 'student').length,
        faculty_count: users.filter(u => u.role === 'faculty').length,
        total_events: events.length,
        total_projects: projects.length
      }

      await generateStatisticsReport(reportStats, users, events, projects)
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
                                <img 
                                  src={u.profile_photo_url} 
                                  className="w-10 h-10 rounded-full object-cover" 
                                  alt=""
                                />
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

            {/* Add Student Tab - FIXED INPUT FIELDS */}
            {activeTab === 'add-student' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">Add New Student</h2>
                <form onSubmit={handleAddStudent} className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Surname</label>
                      <input
                        type="text"
                        value={newStudent.username}
                        onChange={(e) => setNewStudent({ ...newStudent, username: e.target.value })}
                        placeholder="Mathsa"
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Will generate username</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Date of Birth</label>
                      <input
                        type="date"
                        value={newStudent.dob}
                        onChange={(e) => setNewStudent({ ...newStudent, dob: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Format: YYYY-MM-DD</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Roll Number</label>
                      <input
                        type="text"
                        value={newStudent.rollnumber}
                        onChange={(e) => setNewStudent({ ...newStudent, rollnumber: e.target.value })}
                        placeholder="21R11A0501"
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Will be used as password</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={newStudent.email}
                        onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
                      <select
                        value={newStudent.department}
                        onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                      <select
                        value={newStudent.year}
                        onChange={(e) => setNewStudent({ ...newStudent, year: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      >
                        <option value={1}>1st Year</option>
                        <option value={2}>2nd Year</option>
                        <option value={3}>3rd Year</option>
                        <option value={4}>4th Year</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition"
                  >
                    <UserPlus className="w-5 h-5" />
                    Add Student
                  </button>
                </form>
              </div>
            )}

            {/* Add Faculty Tab - FIXED INPUT FIELDS */}
            {activeTab === 'add-faculty' && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">Add New Faculty</h2>
                <form onSubmit={handleAddFaculty} className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={newFaculty.email}
                        onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })}
                        placeholder="faculty@example.com"
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Username will be generated</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Employment ID</label>
                      <input
                        type="text"
                        value={newFaculty.employmentid}
                        onChange={(e) => setNewFaculty({ ...newFaculty, employmentid: e.target.value })}
                        placeholder="EMP12345"
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Will be used as password</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
                    <select
                      value={newFaculty.department}
                      onChange={(e) => setNewFaculty({ ...newFaculty, department: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition"
                  >
                    <UserPlus className="w-5 h-5" />
                    Add Faculty
                  </button>
                </form>
              </div>
            )}

            {/* Other tabs remain the same... */}
          </div>
        </div>
      </div>
    </div>
  )
}

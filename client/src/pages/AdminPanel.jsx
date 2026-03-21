import { useState, useEffect } from 'react'
import {
  Users, BookOpen, Upload, UserPlus, Trash2, GraduationCap,
  Settings, Calendar, Award, FileText, Bell, Download, Shield,
  Database, Activity, UserCheck, Check, X, ClipboardList, KeyRound
} from 'lucide-react'
import api from '../services/api'
import { generateStatisticsReport } from '../utils/reportGenerator'

export default function AdminPanel() {
  const [stats, setStats]                 = useState(null)
  const [loading, setLoading]             = useState(true)
  const [activeTab, setActiveTab]         = useState('overview')
  const [allUsers, setAllUsers]           = useState([])
  const [events, setEvents]               = useState([])
  const [projects, setProjects]           = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [reportFormats, setReportFormats] = useState([])
  const [generatingReport, setGeneratingReport] = useState(false)

  // ── Requests state ───────────────────────────────────────────
  const [profileRequests,  setProfileRequests]  = useState([])
  const [passwordRequests, setPasswordRequests] = useState([])
  const [requestsTab,      setRequestsTab]      = useState('profile')
  const [processingId,     setProcessingId]     = useState(null)

  const [newStudent, setNewStudent] = useState({
    unique_id: '', name: '', roll_number: '', branch: '', year: 1,
    address: '', phone: '', email: '', guardian_name: '',
    guardian_number: '', field_of_interest: ''
  })
  const [newFaculty, setNewFaculty] = useState({
    username: '', email: '', department: '', employmentid: ''
  })
  const [config, setConfig] = useState({
    site_name: 'Science & Tech Club', logo_url: '', mecs_logo_url: '',
    theme_mode: 'dark', primary_color: '#3b82f6', watermark_opacity: '0.25'
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
    if (activeTab === 'users')         fetchAllUsers()
    if (activeTab === 'events')        fetchEvents()
    if (activeTab === 'projects')      fetchProjects()
    if (activeTab === 'announcements') fetchAnnouncements()
    if (activeTab === 'config')        fetchConfig()
    if (activeTab === 'reports')       fetchReportFormats()
    if (activeTab === 'requests')      fetchRequests()
  }, [activeTab])

  const fetchDashboard = async () => {
    try {
      const [u, e, p] = await Promise.all([
        api.get('/users').catch(() => []),
        api.get('/events').catch(() => []),
        api.get('/projects').catch(() => [])
      ])
      const users    = Array.isArray(u) ? u : []
      const events   = Array.isArray(e) ? e : []
      const projects = Array.isArray(p) ? p : []
      setStats({
        total_users:       users.length,
        committee_members: users.filter(x => x.is_committee).length,
        total_events:      events.length,
        total_projects:    projects.length,
        active_students:   users.filter(x => x.role === 'student').length,
        faculty_count:     users.filter(x => x.role === 'faculty').length,
      })
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllUsers      = async () => { try { const d = await api.get('/users');         setAllUsers(Array.isArray(d) ? d : [])         } catch(e) { console.error(e) } }
  const fetchEvents        = async () => { try { const d = await api.get('/events');        setEvents(Array.isArray(d) ? d : [])           } catch(e) { console.error(e) } }
  const fetchProjects      = async () => { try { const d = await api.get('/projects');      setProjects(Array.isArray(d) ? d : [])         } catch(e) { console.error(e) } }
  const fetchAnnouncements = async () => { try { const d = await api.get('/announcements'); setAnnouncements(Array.isArray(d) ? d : [])    } catch(e) { console.error(e) } }
  const fetchReportFormats = async () => { try { const d = await api.get('/reports');       setReportFormats(Array.isArray(d) ? d : [])    } catch(e) { console.error(e) } }
  const fetchConfig        = async () => { try { const d = await api.get('/config');        setConfig(prev => ({ ...prev, ...(d || {}) })) } catch(e) { console.error(e) } }

  const fetchRequests = async () => {
    try {
      const [pr, pw] = await Promise.all([
        api.get('/requests/profile').catch(() => []),
        api.get('/requests/password').catch(() => [])
      ])
      setProfileRequests(Array.isArray(pr) ? pr : [])
      setPasswordRequests(Array.isArray(pw) ? pw : [])
    } catch (error) {
      console.error('Failed to fetch requests:', error)
    }
  }

  const handleAcceptProfile = async (id) => {
    if (!confirm('Accept this profile request and create user account?')) return
    setProcessingId(id)
    try {
      await api.put(`/requests/profile/${id}/accept`)
      alert('✅ Profile created! Credentials sent to user email.')
      fetchRequests()
      fetchDashboard()
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to accept request')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectProfile = async (id) => {
    if (!confirm('Reject this profile request?')) return
    setProcessingId(id)
    try {
      await api.put(`/requests/profile/${id}/reject`)
      alert('Request rejected.')
      fetchRequests()
    } catch (error) {
      alert('Failed to reject request')
    } finally {
      setProcessingId(null)
    }
  }

  const handleApprovePassword = async (id) => {
    if (!confirm('Reset password and send to user email?')) return
    setProcessingId(id)
    try {
      await api.put(`/requests/password/${id}/approve`)
      alert('✅ Password reset! New password sent to user email.')
      fetchRequests()
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to reset password')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectPassword = async (id) => {
    if (!confirm('Reject this password request?')) return
    setProcessingId(id)
    try {
      await api.put(`/requests/password/${id}/reject`)
      alert('Request rejected.')
      fetchRequests()
    } catch (error) {
      alert('Failed to reject')
    } finally {
      setProcessingId(null)
    }
  }

  const handleGenerateReport = async () => {
    setGeneratingReport(true)
    try {
      const [u, e, p] = await Promise.all([api.get('/users'), api.get('/events'), api.get('/projects')])
      const users = Array.isArray(u) ? u : []
      const events = Array.isArray(e) ? e : []
      const projects = Array.isArray(p) ? p : []
      const reportStats = {
        total_users: users.length, committee_members: users.filter(x => x.is_committee).length,
        active_students: users.filter(x => x.role === 'student').length,
        faculty_count: users.filter(x => x.role === 'faculty').length,
        total_events: events.length, total_projects: projects.length
      }
      await generateStatisticsReport(reportStats, users, events, projects)
      alert('Report generated successfully!')
    } catch (error) {
      alert('Failed to generate report.')
    } finally {
      setGeneratingReport(false)
    }
  }

  const handleAddStudent = async (e) => {
    e.preventDefault()
    try {
      await api.post('/admin/add-student', newStudent)
      alert('Student added successfully')
      setNewStudent({ unique_id: '', name: '', roll_number: '', branch: '', year: 1, address: '', phone: '', email: '', guardian_name: '', guardian_number: '', field_of_interest: '' })
      fetchDashboard()
    } catch (error) { alert(error.response?.data?.message || 'Failed to add student') }
  }

  const handleAddFaculty = async (e) => {
    e.preventDefault()
    try {
      const username = newFaculty.email.split('@')[0]
      await api.post('/admin/add-faculty', { username, email: newFaculty.email, password: newFaculty.employmentid, employment_id: newFaculty.employmentid, department: newFaculty.department })
      alert('Faculty added successfully')
      setNewFaculty({ username: '', email: '', department: '', employmentid: '' })
      fetchDashboard(); fetchAllUsers()
    } catch (error) { alert(error.response?.data?.message || 'Failed to add faculty') }
  }

  const handleChangeRole = async (userId, newRole) => {
    try { await api.put(`/users/${userId}/role`, { role: newRole }); alert('Role updated'); fetchAllUsers() }
    catch (error) { alert('Failed to update role') }
  }

  const handleAssignCommitteePost = async (userId, post) => {
    try { await api.put(`/users/${userId}`, { committee_post: post, is_committee: post !== null && post !== '' }); alert('Committee post assigned'); fetchAllUsers() }
    catch (error) { alert('Failed to assign post') }
  }

  const handleGraduateStudents = async () => {
    if (!confirm('Graduate all students? 1→2, 2→3, 3→4, 4→deleted')) return
    try {
      const students = allUsers.filter(u => u.role === 'student' && u.year)
      for (const student of students) {
        if (student.year === 4) await api.delete(`/users/${student.id}`)
        else await api.put(`/users/${student.id}`, { year: student.year + 1 })
      }
      alert('All students graduated!'); fetchAllUsers(); fetchDashboard()
    } catch (error) { alert('Failed to graduate students') }
  }

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Delete user ${username}?`)) return
    try { await api.delete(`/users/${userId}`); alert('User deleted'); fetchAllUsers(); fetchDashboard() }
    catch (error) { alert('Failed to delete user') }
  }

  const handleUploadStudents = async (e) => {
    const file = e.target.files[0]; if (!file) return
    const formData = new FormData(); formData.append('file', file)
    try {
      const { data } = await api.post('/admin/upload-students', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      alert(`${data.message}\n${data.errors?.length ? 'Errors:\n' + data.errors.join('\n') : ''}`)
      fetchDashboard(); fetchAllUsers(); e.target.value = null
    } catch (error) { alert(error.response?.data?.message || 'Failed to upload students') }
  }

  const handleUploadFaculty = async (e) => {
    const file = e.target.files[0]; if (!file) return
    const formData = new FormData(); formData.append('file', file)
    try {
      const { data } = await api.post('/admin/upload-faculty', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      alert(`${data.message}`); fetchDashboard(); fetchAllUsers(); e.target.value = null
    } catch (error) { alert(error.response?.data?.message || 'Failed to upload faculty') }
  }

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault()
    try { await api.post('/announcements', newAnnouncement); alert('Announcement created'); setNewAnnouncement({ title: '', content: '', target_audience: 'all' }); fetchAnnouncements() }
    catch (error) { alert('Failed to create announcement') }
  }

  const handleDeleteAnnouncement = async (id) => {
    if (!confirm('Delete this announcement?')) return
    try { await api.delete(`/announcements/${id}`); alert('Deleted'); fetchAnnouncements() }
    catch (error) { alert('Failed to delete') }
  }

  const handleApproveEvent = async (eventId) => {
    try { await api.put(`/events/${eventId}/status`, { status: 'approved' }); alert('Event approved'); fetchEvents() }
    catch (error) { alert('Failed to approve event') }
  }

  const handleConfigSubmit = async (e) => {
    e.preventDefault()
    try { await api.put('/config', config); alert('Configuration updated!') }
    catch (error) { alert('Failed to update configuration') }
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
      await api.post('/reports/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      alert('Report format uploaded!'); setReportFormData({ title: '', academic_year: '', file: null }); fetchReportFormats()
    } catch (error) { alert(error.response?.data?.message || 'Failed to upload format') }
    finally { setUploadingReport(false) }
  }

  const handleDeleteReport = async (id) => {
    if (!confirm('Delete this report format?')) return
    try { await api.delete(`/reports/${id}`); alert('Deleted'); fetchReportFormats() }
    catch (error) { alert('Failed to delete format') }
  }

  const handleActivateReport = async (id) => {
    try { await api.put(`/reports/${id}/activate`); alert('Format activated'); fetchReportFormats() }
    catch (error) { alert('Failed to activate format') }
  }

  const downloadCSVTemplate = (type) => {
    let csvContent = ''
    if (type === 'students') {
      csvContent = ['UNIQUE_ID,NAME,ROLL-NO,BRANCH,YEAR,ADDRESS,PHONE NO,EMAIL ID,FATHER/GUARDIAN NAME,FATHER/GUARDIAN NUMBER,FIELD OF INTEREST', '2024CSE001,Ravi Kumar,21R11A0501,CSE,1,Hyderabad,9876543210,ravi@example.com,Suresh Kumar,9123456780,AI & ML'].join('\n')
    } else {
      csvContent = ['email,employment_id,department', 'drsmith@college.edu,EMP12345,CSE'].join('\n')
    }
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${type}_template.csv`; a.click()
    window.URL.revokeObjectURL(url)
  }

  const statusBadge = (status) => {
    const styles = {
      pending:  'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      accepted: 'bg-green-500/20 text-green-400 border border-green-500/30',
      approved: 'bg-green-500/20 text-green-400 border border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border border-red-500/30'
    }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>{status}</span>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview',       label: 'Overview',     icon: Activity },
    { id: 'users',          label: 'Users',        icon: Users },
    { id: 'requests',       label: 'Requests',     icon: ClipboardList, badge: (profileRequests.filter(r => r.status === 'pending').length + passwordRequests.filter(r => r.status === 'pending').length) || null },
    { id: 'announcements',  label: 'Announcements',icon: Bell },
    { id: 'events',         label: 'Events',       icon: Calendar },
    { id: 'projects',       label: 'Projects',     icon: BookOpen },
    { id: 'reports',        label: 'Reports',      icon: FileText },
    { id: 'config',         label: 'Config',       icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          </div>
          <p className="text-gray-400 ml-13">Welcome back, {user?.full_name || user?.username}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-gray-900 p-1 rounded-xl overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition whitespace-nowrap relative ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Total Users',       value: stats?.total_users       || 0, color: 'blue'   },
                { label: 'Students',          value: stats?.active_students   || 0, color: 'green'  },
                { label: 'Faculty',           value: stats?.faculty_count     || 0, color: 'purple' },
                { label: 'Committee',         value: stats?.committee_members || 0, color: 'yellow' },
                { label: 'Events',            value: stats?.total_events      || 0, color: 'pink'   },
                { label: 'Projects',          value: stats?.total_projects    || 0, color: 'indigo' },
              ].map(s => (
                <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-gray-400 text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Database className="w-4 h-4 text-blue-400" /> System Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">API Server</span><span className="text-green-400">● Online</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Database</span><span className="text-green-400">● Connected</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Auth Service</span><span className="text-green-400">● Operational</span></div>
                </div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-green-400" /> Quick Actions</h3>
                <div className="space-y-2">
                  <button onClick={handleGenerateReport} disabled={generatingReport} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-2 rounded-lg text-sm font-medium transition">
                    {generatingReport ? 'Generating...' : '📊 Generate Statistics Report'}
                  </button>
                  <button onClick={() => setActiveTab('requests')} className="w-full bg-gray-800 hover:bg-gray-700 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
                    <ClipboardList className="w-4 h-4 text-yellow-400" /> View Pending Requests
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── REQUESTS TAB ── */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <ClipboardList className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Member Requests</h2>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setRequestsTab('profile')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${requestsTab === 'profile' ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'}`}
              >
                <UserPlus className="w-4 h-4" />
                Profile Requests
                {profileRequests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {profileRequests.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setRequestsTab('password')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${requestsTab === 'password' ? 'bg-purple-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'}`}
              >
                <KeyRound className="w-4 h-4" />
                Password Requests
                {passwordRequests.filter(r => r.status === 'pending').length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {passwordRequests.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </button>
            </div>

            {/* Profile Requests */}
            {requestsTab === 'profile' && (
              <div className="space-y-3">
                {profileRequests.length === 0 ? (
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-400">
                    <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No profile requests yet</p>
                  </div>
                ) : profileRequests.map(req => (
                  <div key={req.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{req.full_name}</h3>
                          {statusBadge(req.status)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-sm text-gray-400 mt-2">
                          <span>📧 {req.email}</span>
                          <span>🎓 {req.roll_number || '—'}</span>
                          <span>🏛️ {req.department || '—'}</span>
                          <span>📅 Year {req.year || '—'}</span>
                          <span>📞 {req.phone || '—'}</span>
                          <span>👨‍👩‍👦 {req.guardian_phone || '—'}</span>
                        </div>
                        {req.reason && (
                          <p className="text-gray-500 text-xs mt-2 italic">"{req.reason}"</p>
                        )}
                        <p className="text-gray-600 text-xs mt-1">
                          Submitted: {new Date(req.created_at).toLocaleString()}
                        </p>
                      </div>
                      {req.status === 'pending' && (
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleAcceptProfile(req.id)}
                            disabled={processingId === req.id}
                            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-sm font-medium transition"
                          >
                            <Check className="w-4 h-4" />
                            {processingId === req.id ? 'Creating...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleRejectProfile(req.id)}
                            disabled={processingId === req.id}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-600/30 disabled:opacity-50 rounded-lg text-sm font-medium text-red-400 transition"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Password Requests */}
            {requestsTab === 'password' && (
              <div className="space-y-3">
                {passwordRequests.length === 0 ? (
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-400">
                    <KeyRound className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No password requests yet</p>
                  </div>
                ) : passwordRequests.map(req => (
                  <div key={req.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">@{req.username}</h3>
                          {statusBadge(req.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-400 mt-2">
                          <span>📧 {req.email}</span>
                        </div>
                        {req.reason && (
                          <p className="text-gray-500 text-xs mt-2 italic">"{req.reason}"</p>
                        )}
                        <p className="text-gray-600 text-xs mt-1">
                          Submitted: {new Date(req.created_at).toLocaleString()}
                        </p>
                      </div>
                      {req.status === 'pending' && (
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleApprovePassword(req.id)}
                            disabled={processingId === req.id}
                            className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-sm font-medium transition"
                          >
                            <KeyRound className="w-4 h-4" />
                            {processingId === req.id ? 'Resetting...' : 'Reset & Send'}
                          </button>
                          <button
                            onClick={() => handleRejectPassword(req.id)}
                            disabled={processingId === req.id}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-600/30 disabled:opacity-50 rounded-lg text-sm font-medium text-red-400 transition"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Bulk Upload */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Upload className="w-4 h-4 text-blue-400" /> Bulk Upload</h3>
              <p className="text-gray-400 text-sm mb-4">Upload students and faculty in bulk using CSV.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-gray-300 text-sm font-medium">Upload Students CSV</p>
                  <p className="text-gray-500 text-xs">Required: UNIQUE_ID, NAME, ROLL-NO, BRANCH, YEAR, ADDRESS, PHONE NO, EMAIL ID, FATHER/GUARDIAN NAME, FATHER/GUARDIAN NUMBER, FIELD OF INTEREST</p>
                  <div className="flex gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium cursor-pointer transition">
                      <Upload className="w-4 h-4" /> Upload Students
                      <input type="file" accept=".csv" onChange={handleUploadStudents} className="hidden" />
                    </label>
                    <button onClick={() => downloadCSVTemplate('students')} className="px-3 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-300 text-sm font-medium">Upload Faculty CSV</p>
                  <p className="text-gray-500 text-xs">Required: email, employment_id, department</p>
                  <div className="flex gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium cursor-pointer transition">
                      <Upload className="w-4 h-4" /> Upload Faculty
                      <input type="file" accept=".csv" onChange={handleUploadFaculty} className="hidden" />
                    </label>
                    <button onClick={() => downloadCSVTemplate('faculty')} className="px-3 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Student */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><UserPlus className="w-4 h-4 text-green-400" /> Add Student</h3>
              <form onSubmit={handleAddStudent} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[['unique_id','Unique ID'],['name','Full Name'],['roll_number','Roll Number'],['email','Email'],['phone','Phone'],['guardian_name','Guardian Name'],['guardian_number','Guardian Phone'],['address','Address'],['field_of_interest','Field of Interest']].map(([field, label]) => (
                  <input key={field} type={field === 'email' ? 'email' : 'text'} placeholder={label} required={['unique_id','name','email'].includes(field)}
                    value={newStudent[field]} onChange={e => setNewStudent({...newStudent, [field]: e.target.value})}
                    className="px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
                ))}
                <select value={newStudent.branch} onChange={e => setNewStudent({...newStudent, branch: e.target.value})}
                  className="px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500">
                  <option value="">Select Branch</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={newStudent.year} onChange={e => setNewStudent({...newStudent, year: parseInt(e.target.value)})}
                  className="px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500">
                  {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
                <button type="submit" className="col-span-2 md:col-span-3 bg-green-600 hover:bg-green-700 py-2.5 rounded-lg text-sm font-medium transition">Add Student</button>
              </form>
            </div>

            {/* Add Faculty */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-purple-400" /> Add Faculty</h3>
              <form onSubmit={handleAddFaculty} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input required type="email" placeholder="Email" value={newFaculty.email} onChange={e => setNewFaculty({...newFaculty, email: e.target.value})}
                  className="px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
                <input required placeholder="Employment ID" value={newFaculty.employmentid} onChange={e => setNewFaculty({...newFaculty, employmentid: e.target.value})}
                  className="px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
                <select value={newFaculty.department} onChange={e => setNewFaculty({...newFaculty, department: e.target.value})}
                  className="px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500">
                  <option value="">Department</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <button type="submit" className="bg-purple-600 hover:bg-purple-700 py-2.5 rounded-lg text-sm font-medium transition">Add Faculty</button>
              </form>
            </div>

            {/* Graduate & Users List */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" /> All Users ({allUsers.length})</h3>
                <button onClick={handleGraduateStudents} className="flex items-center gap-2 px-3 py-2 bg-yellow-600/20 hover:bg-yellow-600/40 border border-yellow-600/30 rounded-lg text-yellow-400 text-sm font-medium transition">
                  <GraduationCap className="w-4 h-4" /> Graduate All
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-gray-400 border-b border-gray-800">
                    <th className="text-left py-2 pr-4">User</th>
                    <th className="text-left py-2 pr-4">Role</th>
                    <th className="text-left py-2 pr-4">Department</th>
                    <th className="text-left py-2 pr-4">Year</th>
                    <th className="text-left py-2">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-800">
                    {allUsers.map(u => (
                      <tr key={u.id} className="hover:bg-gray-800/50">
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-2">
                            {u.profile_photo_url
                              ? <img src={u.profile_photo_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                              : <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">{u.full_name?.[0]?.toUpperCase() || u.username?.[0]?.toUpperCase()}</div>
                            }
                            <div>
                              <p className="text-white font-medium">{u.full_name || u.username}</p>
                              <p className="text-gray-500 text-xs">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 pr-4">
                          <select value={u.role} onChange={e => handleChangeRole(u.id, e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white">
                            <option value="student">Student</option>
                            <option value="faculty">Faculty</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-2.5 pr-4 text-gray-400">{u.department || '—'}</td>
                        <td className="py-2.5 pr-4 text-gray-400">{u.year || '—'}</td>
                        <td className="py-2.5">
                          <button onClick={() => handleDeleteUser(u.id, u.username)} className="p-1.5 hover:bg-red-600/20 rounded-lg text-red-400 transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Committee Posts */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-yellow-400" /> Assign Committee Posts</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-gray-400 border-b border-gray-800">
                    <th className="text-left py-2 pr-4">Username</th>
                    <th className="text-left py-2 pr-4">Current Post</th>
                    <th className="text-left py-2">Assign Post</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-800">
                    {allUsers.map(u => (
                      <tr key={u.id} className="hover:bg-gray-800/50">
                        <td className="py-2.5 pr-4">
                          <p className="text-white">{u.username}</p>
                          <p className="text-gray-500 text-xs">{u.email}</p>
                        </td>
                        <td className="py-2.5 pr-4">
                          {u.committee_post
                            ? <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs">{u.committee_post}</span>
                            : <span className="text-gray-500 text-xs">None</span>}
                        </td>
                        <td className="py-2.5">
                          <select defaultValue="" onChange={e => e.target.value && handleAssignCommitteePost(u.id, e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white">
                            <option value="">Assign post...</option>
                            <option value="">Remove post</option>
                            {committeePosts.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── ANNOUNCEMENTS ── */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-yellow-400" /> Create Announcement</h3>
              <form onSubmit={handleCreateAnnouncement} className="space-y-3">
                <input required placeholder="Title" value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
                <textarea required rows={4} placeholder="Content" value={newAnnouncement.content} onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                  className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-none" />
                <select value={newAnnouncement.target_audience} onChange={e => setNewAnnouncement({...newAnnouncement, target_audience: e.target.value})}
                  className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500">
                  <option value="all">All</option>
                  <option value="students">Students</option>
                  <option value="faculty">Faculty</option>
                  <option value="committee">Committee</option>
                </select>
                <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 py-2.5 rounded-lg text-sm font-medium transition">Post Announcement</button>
              </form>
            </div>
            <div className="space-y-3">
              {announcements.map(ann => (
                <div key={ann.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex justify-between items-start gap-4">
                  <div>
                    <p className="font-medium text-white">{ann.title}</p>
                    <p className="text-gray-400 text-sm mt-1">{ann.content}</p>
                    <p className="text-gray-600 text-xs mt-2">{new Date(ann.created_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => handleDeleteAnnouncement(ann.id)} className="p-1.5 hover:bg-red-600/20 rounded-lg text-red-400 transition shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── EVENTS ── */}
        {activeTab === 'events' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-pink-400" /> Events ({events.length})</h3>
            {events.map(event => (
              <div key={event.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex justify-between items-start gap-4">
                <div>
                  <p className="font-medium text-white">{event.title}</p>
                  <p className="text-gray-400 text-sm mt-1">{event.description}</p>
                  <p className="text-gray-500 text-xs mt-1">{event.date}</p>
                </div>
                {event.status !== 'approved' && (
                  <button onClick={() => handleApproveEvent(event.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-medium transition shrink-0">
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── PROJECTS ── */}
        {activeTab === 'projects' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-white flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-400" /> Projects ({projects.length})</h3>
            {projects.map(proj => (
              <div key={proj.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="font-medium text-white">{proj.title || proj.name}</p>
                <p className="text-gray-400 text-sm mt-1">{proj.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── REPORTS ── */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-400" /> Upload Report Format</h3>
              <form onSubmit={handleUploadReport} className="space-y-3">
                <input required placeholder="Report Title" value={reportFormData.title} onChange={e => setReportFormData({...reportFormData, title: e.target.value})}
                  className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
                <input required placeholder="Academic Year (e.g. 2024-25)" value={reportFormData.academic_year} onChange={e => setReportFormData({...reportFormData, academic_year: e.target.value})}
                  className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
                <input required type="file" accept=".pdf,.doc,.docx" onChange={e => setReportFormData({...reportFormData, file: e.target.files[0]})}
                  className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
                <button type="submit" disabled={uploadingReport} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-2.5 rounded-lg text-sm font-medium transition">
                  {uploadingReport ? 'Uploading...' : 'Upload Format'}
                </button>
              </form>
            </div>
            <div className="space-y-3">
              {reportFormats.map(fmt => (
                <div key={fmt.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex justify-between items-center gap-4">
                  <div>
                    <p className="font-medium text-white">{fmt.title}</p>
                    <p className="text-gray-400 text-xs mt-1">{fmt.academic_year}</p>
                    {fmt.is_active && <span className="text-green-400 text-xs">● Active</span>}
                  </div>
                  <div className="flex gap-2">
                    {!fmt.is_active && (
                      <button onClick={() => handleActivateReport(fmt.id)} className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/40 border border-green-600/30 rounded-lg text-green-400 text-xs transition">Activate</button>
                    )}
                    <button onClick={() => handleDeleteReport(fmt.id)} className="p-1.5 hover:bg-red-600/20 rounded-lg text-red-400 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CONFIG ── */}
        {activeTab === 'config' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-gray-400" /> Site Configuration</h3>
            <form onSubmit={handleConfigSubmit} className="space-y-4">
              {[['site_name','Site Name'],['logo_url','Logo URL'],['mecs_logo_url','MECS Logo URL'],['primary_color','Primary Color'],['watermark_opacity','Watermark Opacity']].map(([field, label]) => (
                <div key={field}>
                  <label className="block text-gray-300 text-sm mb-1">{label}</label>
                  <input type="text" value={config[field] || ''} onChange={e => setConfig({...config, [field]: e.target.value})}
                    className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
                </div>
              ))}
              <div>
                <label className="block text-gray-300 text-sm mb-1">Theme Mode</label>
                <select value={config.theme_mode} onChange={e => setConfig({...config, theme_mode: e.target.value})}
                  className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500">
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-2.5 rounded-lg text-sm font-medium transition">Save Configuration</button>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}

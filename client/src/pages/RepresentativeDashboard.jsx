import { useState, useEffect } from 'react'
import {
  MessageSquare, User, CheckCircle, XCircle, Clock,
  UserPlus, FileText, Upload, Link2, Download, Trash2, Plus
} from 'lucide-react'
import api from '../services/api'

export default function RepresentativeDashboard() {
  const [permissions,         setPermissions]         = useState([])
  const [guides,              setGuides]              = useState([])
  const [templates,           setTemplates]           = useState([])
  const [uploads,             setUploads]             = useState([])
  const [tasks,               setTasks]               = useState([])
  const [selectedPermission,  setSelectedPermission]  = useState(null)
  const [response,            setResponse]            = useState('')
  const [selectedGuide,       setSelectedGuide]       = useState('')
  const [loading,             setLoading]             = useState(true)
  const [activeTab,           setActiveTab]           = useState('queries')
  const [filter,              setFilter]              = useState('pending')
  const [uploadForm,          setUploadForm]          = useState({ title: '', description: '', link: '', category: 'report' })
  const [submitting,          setSubmitting]          = useState(false)

  const user   = JSON.parse(localStorage.getItem('user') || '{}')
  const isHead = ['Representative Head', 'Representative Member'].includes(user?.committee_post)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [perm, users, t, u, tk] = await Promise.all([
        api.get('/permissions').catch(() => []),
        api.get('/friends/users').catch(() => []),
        api.get('/team-templates?team=representative').catch(() => []),
        api.get('/team-uploads?team=representative').catch(() => []),
        api.get('/tasks').catch(() => []),
      ])
      setPermissions(Array.isArray(perm) ? perm : [])
      setGuides((Array.isArray(users) ? users : []).filter(u => u.is_committee || u.role === 'faculty'))
      setTemplates(Array.isArray(t) ? t : [])
      setUploads(Array.isArray(u) ? u : [])
      setTasks(Array.isArray(tk) ? tk : [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleApprove = async (id) => {
    try {
      await api.put(`/permissions/${id}`, { status: 'approved', response: response.trim() || 'Request approved' })
      alert('Request approved!')
      setSelectedPermission(null); setResponse(''); fetchAll()
    } catch { alert('Failed to approve request') }
  }

  const handleReject = async (id) => {
    if (!response.trim()) { alert('Please provide a reason for rejection'); return }
    try {
      await api.put(`/permissions/${id}`, { status: 'rejected', response: response.trim() })
      alert('Request rejected'); setSelectedPermission(null); setResponse(''); fetchAll()
    } catch { alert('Failed to reject request') }
  }

  const handleAssignGuide = async (permissionId) => {
    if (!selectedGuide) { alert('Please select a guide'); return }
    try {
      await api.put(`/permissions/${permissionId}/assign-guide`, { guide_id: selectedGuide })
      alert('Guide assigned successfully!'); setSelectedPermission(null); setSelectedGuide(''); fetchAll()
    } catch { alert('Failed to assign guide') }
  }

  const handleSubmitUpload = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/team-uploads', { ...uploadForm, team: 'representative' })
      setUploadForm({ title: '', description: '', link: '', category: 'report' })
      fetchAll()
    } catch (err) { alert(err.response?.data?.message || 'Failed to submit') }
    finally { setSubmitting(false) }
  }

  const handleDeleteUpload = async (id) => {
    if (!confirm('Delete this upload?')) return
    try { await api.delete(`/team-uploads/${id}`); fetchAll() }
    catch { alert('Failed to delete') }
  }

  const filtered      = permissions.filter(p => filter === 'all' ? true : p.status === filter)
  const pendingCount  = permissions.filter(p => p.status === 'pending').length
  const approvedCount = permissions.filter(p => p.status === 'approved').length
  const rejectedCount = permissions.filter(p => p.status === 'rejected').length

  const tabs = [
    { id: 'queries',   label: 'Queries',      icon: MessageSquare },
    { id: 'tasks',     label: 'My Tasks',     icon: Clock },
    { id: 'templates', label: 'Templates',    icon: FileText },
    { id: 'uploads',   label: 'Team Uploads', icon: Upload },
  ]

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Representative Dashboard</h1>
            <p className="text-gray-400 text-sm">{user?.committee_post} — {user?.full_name || user?.username}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Pending',   value: pendingCount,         color: 'text-yellow-400' },
            { label: 'Approved',  value: approvedCount,        color: 'text-green-400' },
            { label: 'Rejected',  value: rejectedCount,        color: 'text-red-400' },
            { label: 'My Tasks',  value: tasks.length,         color: 'text-indigo-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-400 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900 p-1 rounded-xl overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}>
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            )
          })}
        </div>

        {/* ── QUERIES ── */}
        {activeTab === 'queries' && (
          <div>
            <div className="flex gap-2 mb-4 flex-wrap">
              {[
                { id: 'pending',  label: `Pending (${pendingCount})`,   color: 'bg-yellow-600' },
                { id: 'approved', label: `Approved (${approvedCount})`, color: 'bg-green-600' },
                { id: 'rejected', label: `Rejected (${rejectedCount})`, color: 'bg-red-600' },
                { id: 'all',      label: `All (${permissions.length})`, color: 'bg-blue-600' },
              ].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === f.id ? `${f.color} text-white` : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                  }`}>{f.label}</button>
              ))}
            </div>
            <div className="space-y-4">
              {filtered.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center text-gray-400">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>No {filter !== 'all' ? filter : ''} requests</p>
                </div>
              ) : filtered.map(permission => (
                <div key={permission.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">{permission.subject}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          permission.status === 'pending'  ? 'bg-yellow-500/20 text-yellow-400' :
                          permission.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>{permission.status}</span>
                        {permission.request_type && (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs">{permission.request_type}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <User className="w-4 h-4" />
                        <span>{permission.requester?.full_name || permission.requester?.username || permission.requester?.email}</span>
                        <span className="text-gray-600">·</span>
                        <span>{new Date(permission.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-300 text-sm">{permission.description}</p>
                      {permission.guide && (
                        <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                          <UserPlus className="w-3 h-3" /> Guide: {permission.guide.full_name || permission.guide.username}
                        </p>
                      )}
                      {permission.response && (
                        <p className="text-blue-400 text-xs mt-1">Response: {permission.response}</p>
                      )}
                    </div>
                  </div>
                  {permission.status === 'pending' && (
                    <div className="space-y-3 pt-3 border-t border-gray-800">
                      {permission.request_type === 'project_guide' && (
                        <div className="flex gap-2">
                          <select value={selectedPermission?.id === permission.id ? selectedGuide : ''}
                            onChange={e => { setSelectedPermission(permission); setSelectedGuide(e.target.value) }}
                            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500">
                            <option value="">Select a guide...</option>
                            {guides.map(g => (
                              <option key={g.id} value={g.id}>{g.full_name || g.username} {g.is_committee ? '(Committee)' : ''}</option>
                            ))}
                          </select>
                          <button onClick={() => handleAssignGuide(permission.id)}
                            disabled={!selectedGuide || selectedPermission?.id !== permission.id}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition">
                            Assign Guide
                          </button>
                        </div>
                      )}
                      <textarea value={selectedPermission?.id === permission.id ? response : ''}
                        onChange={e => { setSelectedPermission(permission); setResponse(e.target.value) }}
                        placeholder="Add response or reason..." rows={2}
                        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 resize-none" />
                      <div className="flex gap-3">
                        <button onClick={() => handleApprove(permission.id)}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 py-2.5 rounded-lg text-sm font-medium transition">
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                        <button onClick={() => handleReject(permission.id)}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 py-2.5 rounded-lg text-sm font-medium transition">
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TASKS ── */}
        {activeTab === 'tasks' && (
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center text-gray-400">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No tasks yet</p>
              </div>
            ) : tasks.map(task => (
              <div key={task.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-white mb-1">{task.title}</h3>
                    {task.description && <p className="text-gray-400 text-sm">{task.description}</p>}
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      {task.due_date && <span>📅 {new Date(task.due_date).toLocaleDateString()}</span>}
                      {task.creator  && <span>👤 {task.creator.full_name || task.creator.username}</span>}
                    </div>
                  </div>
                  <span className={`shrink-0 px-2 py-1 rounded-lg text-xs font-medium ${
                    task.status === 'completed'   ? 'bg-green-500/20 text-green-400' :
                    task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400'  :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>{task.status?.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TEMPLATES ── */}
        {activeTab === 'templates' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" /> Report Templates
            </h3>
            {templates.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No templates yet — ask admin to upload one</p>
              </div>
            ) : templates.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3 mb-3 gap-4">
                <div>
                  <p className="text-white font-medium text-sm">{t.title}</p>
                  <p className="text-indigo-400 text-xs mt-0.5">Representative Template</p>
                </div>
                <a href={t.link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-medium transition">
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              </div>
            ))}
          </div>
        )}

        {/* ── UPLOADS ── */}
        {activeTab === 'uploads' && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" /> Submit Document / Report Link
              </h3>
              <form onSubmit={handleSubmitUpload} className="space-y-3">
                <input required placeholder="Title" value={uploadForm.title}
                  onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500" />
                <textarea rows={2} placeholder="Description (optional)" value={uploadForm.description}
                  onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 resize-none" />
                <input required placeholder="Google Drive / Document Link" value={uploadForm.link}
                  onChange={e => setUploadForm({ ...uploadForm, link: e.target.value })}
                  className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500" />
                <select value={uploadForm.category}
                  onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}
                  className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500">
                  <option value="report">Report</option>
                  <option value="minutes">Meeting Minutes</option>
                  <option value="proposal">Proposal</option>
                  <option value="other">Other</option>
                </select>
                <button type="submit" disabled={submitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 py-2.5 rounded-lg text-sm font-medium transition">
                  {submitting ? 'Submitting...' : 'Submit Document'}
                </button>
              </form>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Link2 className="w-4 h-4 text-gray-400" /> Team Submissions ({uploads.length})
              </h3>
              {uploads.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-400">
                  <Upload className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">No submissions yet</p>
                </div>
              ) : uploads.map(u => (
                <div key={u.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-white">{u.title}</p>
                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-xs">{u.category}</span>
                      </div>
                      {u.description && <p className="text-gray-400 text-sm">{u.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>{u.uploader?.full_name || u.uploader?.username}</span>
                        <span>{new Date(u.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a href={u.link} target="_blank" rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-600/30 text-blue-400 rounded-lg text-xs transition">Open</a>
                      {(isHead || u.uploader?.id === user?.id) && (
                        <button onClick={() => handleDeleteUpload(u.id)}
                          className="p-1.5 hover:bg-red-600/20 rounded-lg text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

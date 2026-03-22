import { useState, useEffect } from 'react'
import {
  ClipboardList, Plus, Trash2, Download,
  Link2, Clock, User, ExternalLink,
  UserPlus, X, Check
} from 'lucide-react'
import api from '../services/api'

export default function RepresentativeDashboard() {
  const [uploads,         setUploads]         = useState([])
  const [template,        setTemplate]        = useState(null)
  const [tasks,           setTasks]           = useState([])
  const [students,        setStudents]        = useState([])
  const [representatives, setRepresentatives] = useState([])
  const [activeTab,       setActiveTab]       = useState('uploads')
  const [loading,         setLoading]         = useState(true)
  const [showHireModal,   setShowHireModal]   = useState(false)
  const [searchQ,         setSearchQ]         = useState('')
  const [submitting,      setSubmitting]      = useState(false)
  const [form, setForm] = useState({ title: '', description: '', link: '', category: 'letter' })

  const user   = JSON.parse(localStorage.getItem('user') || '{}')
  const isHead = user?.committee_post === 'Representative Head'

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [u, t, tk, allUsers] = await Promise.all([
        api.get('/team-uploads?team=representative').catch(() => []),
        api.get('/team-templates?team=representative').catch(() => []),
        api.get('/tasks').catch(() => []),
        api.get('/users').catch(() => []),
      ])
      setUploads(Array.isArray(u) ? u : [])
      const tArr = Array.isArray(t) ? t : []
      setTemplate(tArr[0] || null)
      setTasks(Array.isArray(tk) ? tk : [])
      const all = Array.isArray(allUsers) ? allUsers : []
      setStudents(all.filter(u => u.role === 'student' && !u.is_committee))
      setRepresentatives(all.filter(u =>
        u.committee_post === 'Representative Member' || u.committee_post === 'Representative Head'
      ))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/team-uploads', { ...form, team: 'representative' })
      alert('✅ Submitted successfully!')
      setForm({ title: '', description: '', link: '', category: 'letter' })
      fetchAll()
    } catch (err) { alert(err.response?.data?.message || 'Failed') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this upload?')) return
    try { await api.delete(`/team-uploads/${id}`); fetchAll() }
    catch { alert('Failed to delete') }
  }

  const handleHire = async (userId, name) => {
    if (!confirm(`Make ${name} a Representative Member?`)) return
    try {
      await api.put(`/users/${userId}`, { is_committee: true, committee_post: 'Representative Member' })
      alert(`✅ ${name} is now a Representative!`); fetchAll()
    } catch { alert('Failed') }
  }

  const handleFire = async (userId, name) => {
    if (!confirm(`Remove ${name} from Representatives?`)) return
    try {
      await api.put(`/users/${userId}`, { is_committee: false, committee_post: null }); fetchAll()
    } catch { alert('Failed') }
  }

  const taskStats = {
    pending:    tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed:  tasks.filter(t => t.status === 'completed').length,
  }

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(searchQ.toLowerCase()) ||
    s.roll_number?.toLowerCase().includes(searchQ.toLowerCase())
  )

  const categoryColors = {
    letter:  'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    request: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    notice:  'bg-green-500/20 text-green-400 border-green-500/30',
    other:   'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }

  const tabs = [
    { id: 'uploads', label: '📁 Uploads' },
    { id: 'submit',  label: '➕ Submit New' },
    { id: 'tasks',   label: '✅ My Tasks' },
    { id: 'team',    label: '👥 Team' },
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Representative Dashboard</h1>
              <p className="text-gray-400 text-sm">{user?.committee_post} — {user?.full_name || user?.username}</p>
            </div>
          </div>
          {isHead && (
            <button onClick={() => setShowHireModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition">
              <UserPlus className="w-4 h-4" /> Manage Team
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Pending',     value: taskStats.pending,    color: 'text-yellow-400' },
            { label: 'In Progress', value: taskStats.inProgress, color: 'text-blue-400' },
            { label: 'Completed',   value: taskStats.completed,  color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-400 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900 p-1 rounded-xl overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── UPLOADS ── */}
        {activeTab === 'uploads' && (
          <div className="space-y-4">
            {template && (
              <div className="bg-gray-900 border border-indigo-500/30 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-indigo-400 font-medium text-sm">📄 Letter Template</p>
                  <p className="text-gray-400 text-xs mt-0.5">{template.title}</p>
                </div>
                <a href={template.link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition">
                  <Download className="w-4 h-4" /> Download Template
                </a>
              </div>
            )}
            {uploads.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center text-gray-400">
                <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No uploads yet</p>
              </div>
            ) : uploads.map(u => (
              <div key={u.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{u.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${categoryColors[u.category] || categoryColors.other}`}>
                        {u.category}
                      </span>
                    </div>
                    {u.description && <p className="text-gray-400 text-sm mb-2">{u.description}</p>}
                    <p className="text-gray-600 text-xs">
                      By {u.uploader?.full_name || u.uploader?.username} · {new Date(u.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <a href={u.link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-600/30 text-indigo-400 rounded-lg text-sm transition">
                      <ExternalLink className="w-4 h-4" /> Open
                    </a>
                    {(isHead || u.uploaded_by === user?.id) && (
                      <button onClick={() => handleDelete(u.id)}
                        className="p-1.5 hover:bg-red-600/20 rounded-lg text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── SUBMIT NEW ── */}
        {activeTab === 'submit' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-4">Submit Document / Letter</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required placeholder="Title" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500" />
              <textarea rows={2} placeholder="Description (optional)" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 resize-none" />
              <input required placeholder="Google Drive / Docs Link" value={form.link}
                onChange={e => setForm({ ...form, link: e.target.value })}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500" />
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500">
                <option value="letter">Letter</option>
                <option value="request">Request</option>
                <option value="notice">Notice</option>
                <option value="other">Other</option>
              </select>
              <button type="submit" disabled={submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 py-2.5 rounded-lg text-sm font-medium transition">
                {submitting ? 'Submitting...' : 'Submit Document'}
              </button>
            </form>
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

        {/* ── TEAM ── */}
        {activeTab === 'team' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-4">Representatives ({representatives.length})</h3>
            {representatives.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No members yet</p>
            ) : representatives.map(m => (
              <div key={m.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3 mb-2">
                <div>
                  <p className="text-white text-sm font-medium">{m.full_name || m.username}</p>
                  <p className="text-indigo-400 text-xs">{m.committee_post}</p>
                </div>
                {isHead && m.committee_post !== 'Representative Head' && (
                  <button onClick={() => handleFire(m.id, m.full_name || m.username)}
                    className="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 border border-red-600/30 text-red-400 rounded-lg text-xs transition">
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── HIRE MODAL ── */}
      {showHireModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">Add Representative Member</h3>
              <button onClick={() => setShowHireModal(false)}
                className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>
            <input placeholder="Search by name or roll number" value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 mb-4" />
            <div className="max-h-72 overflow-y-auto space-y-2">
              {filtered.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No students found</p>
              ) : filtered.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-white text-sm font-medium">{s.full_name || s.username}</p>
                    <p className="text-gray-400 text-xs">{s.roll_number} · {s.department}</p>
                  </div>
                  <button onClick={() => handleHire(s.id, s.full_name || s.username)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-medium transition">
                    <Check className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import {
  Palette, Plus, Trash2, Download, FileText,
  Link2, Clock, User, ExternalLink,
  UserPlus, X, Check
} from 'lucide-react'
import api from '../services/api'

export default function DesigningDashboard() {
  const [uploads,      setUploads]      = useState([])
  const [templates,    setTemplates]    = useState([])
  const [tasks,        setTasks]        = useState([])
  const [students,     setStudents]     = useState([])
  const [team,         setTeam]         = useState([])
  const [canvaLink,    setCanvaLink]    = useState('')
  const [activeTab,    setActiveTab]    = useState('designs')
  const [loading,      setLoading]      = useState(true)
  const [showHireModal,setShowHireModal]= useState(false)
  const [searchQ,      setSearchQ]      = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [form,         setForm]         = useState({ title: '', description: '', link: '', category: 'poster' })

  // ✅ user read via useEffect so it always gets the fresh verified value
  const [user,   setUser]   = useState({})
  const [isHead, setIsHead] = useState(false)

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user') || '{}')
    setUser(stored)
    const post = stored?.committee_post?.trim().toLowerCase()
    setIsHead(post === 'designing head')
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [u, t, tk, cfg, allUsers] = await Promise.all([
        api.get('/team-uploads?team=design').catch(() => []),
        api.get('/team-templates?team=design').catch(() => []),
        api.get('/tasks').catch(() => []),
        api.get('/config').catch(() => ({})),
        api.get('/users').catch(() => []),
      ])
      setUploads(Array.isArray(u) ? u : [])
      setTemplates(Array.isArray(t) ? t : [])
      setTasks(Array.isArray(tk) ? tk : [])
      setCanvaLink(cfg?.canva_link || '')
      const all = Array.isArray(allUsers) ? allUsers : []
      setStudents(all.filter(u => u.role === 'student' && !u.is_committee))
      setTeam(all.filter(u =>
        u.committee_post === 'Designing Team' || u.committee_post === 'Designing Head'
      ))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/team-uploads', { ...form, team: 'design' })
      alert('✅ Design uploaded!')
      setForm({ title: '', description: '', link: '', category: 'poster' })
      fetchAll()
    } catch (err) { alert(err.response?.data?.message || 'Failed') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this design?')) return
    try { await api.delete(`/team-uploads/${id}`); fetchAll() }
    catch { alert('Failed to delete') }
  }

  const handleHire = async (userId, name) => {
    if (!confirm(`Add ${name} to Designing Team?`)) return
    try {
      await api.put(`/users/${userId}`, { is_committee: true, committee_post: 'Designing Team' })
      alert(`✅ ${name} added to Designing Team!`); fetchAll()
    } catch { alert('Failed') }
  }

  const handleFire = async (userId, name) => {
    if (!confirm(`Remove ${name} from Designing Team?`)) return
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
    poster:   'bg-purple-500/20 text-purple-400 border-purple-500/30',
    banner:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
    social:   'bg-pink-500/20 text-pink-400 border-pink-500/30',
    branding: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    other:    'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }

  const tabs = [
    { id: 'designs',   label: '🎨 Designs' },
    { id: 'upload',    label: '➕ Upload' },
    { id: 'templates', label: '📄 Templates' },
    { id: 'tasks',     label: '✅ My Tasks' },
    { id: 'team',      label: '👥 Team' },
  ]

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Designing Dashboard</h1>
              <p className="text-gray-400 text-sm">{user?.committee_post} — {user?.full_name || user?.username}</p>
            </div>
          </div>
          {isHead && (
            <button onClick={() => setShowHireModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm font-medium transition">
              <UserPlus className="w-4 h-4" /> Manage Team
            </button>
          )}
        </div>

        {/* Canva Quick Access */}
        {canvaLink && (
          <a href={canvaLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-xl p-4 mb-6 hover:from-purple-900/70 transition group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-600 rounded-lg flex items-center justify-center">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-white">Open Canva Team</p>
                <p className="text-gray-400 text-xs">Create and collaborate on designs</p>
              </div>
            </div>
            <ExternalLink className="w-5 h-5 text-purple-400 group-hover:text-white transition" />
          </a>
        )}

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
                activeTab === tab.id ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── DESIGNS ── */}
        {activeTab === 'designs' && (
          <div className="space-y-4">
            {uploads.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center text-gray-400">
                <Palette className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No designs uploaded yet</p>
              </div>
            ) : uploads.map(d => (
              <div key={d.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{d.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${categoryColors[d.category] || categoryColors.other}`}>
                        {d.category}
                      </span>
                    </div>
                    {d.description && <p className="text-gray-400 text-sm mb-2">{d.description}</p>}
                    <p className="text-gray-600 text-xs">
                      By {d.uploader?.full_name || d.uploader?.username} · {new Date(d.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <a href={d.link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/40 border border-violet-600/30 text-violet-400 rounded-lg text-sm transition">
                      <ExternalLink className="w-4 h-4" /> Open
                    </a>
                    {(isHead || d.uploaded_by === user?.id) && (
                      <button onClick={() => handleDelete(d.id)}
                        className="p-1.5 hover:bg-red-600/20 rounded-lg text-red-400 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── UPLOAD ── */}
        {activeTab === 'upload' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-4">Upload Design</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required placeholder="Design Title" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500" />
              <textarea rows={2} placeholder="Description (optional)" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 resize-none" />
              <input required placeholder="Canva / Google Drive / Figma Link" value={form.link}
                onChange={e => setForm({ ...form, link: e.target.value })}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500" />
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500">
                <option value="poster">Event Poster</option>
                <option value="banner">Banner</option>
                <option value="social">Social Media Post</option>
                <option value="branding">Branding</option>
                <option value="other">Other</option>
              </select>
              <button type="submit" disabled={submitting}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 py-2.5 rounded-lg text-sm font-medium transition">
                {submitting ? 'Uploading...' : 'Upload Design'}
              </button>
            </form>
          </div>
        )}

        {/* ── TEMPLATES ── */}
        {activeTab === 'templates' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-400" /> Design Templates & Assets
            </h3>
            {templates.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No templates yet — ask admin to add one</p>
              </div>
            ) : templates.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3 mb-3 gap-4">
                <div>
                  <p className="text-white font-medium text-sm">{t.title}</p>
                  <p className="text-violet-400 text-xs mt-0.5">Design Asset</p>
                </div>
                <a href={t.link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 rounded-lg text-xs font-medium transition">
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              </div>
            ))}
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
            <h3 className="font-semibold text-white mb-4">Designing Team ({team.length})</h3>
            {team.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No members yet</p>
            ) : team.map(m => (
              <div key={m.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3 mb-2">
                <div>
                  <p className="text-white text-sm font-medium">{m.full_name || m.username}</p>
                  <p className="text-violet-400 text-xs">{m.committee_post}</p>
                </div>
                {isHead && m.committee_post !== 'Designing Head' && (
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
              <h3 className="text-lg font-semibold text-white">Add to Designing Team</h3>
              <button onClick={() => setShowHireModal(false)}
                className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>
            <input placeholder="Search by name or roll number" value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 mb-4" />
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
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 rounded-lg text-xs font-medium transition">
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

import { useState, useEffect } from 'react'
import {
  Palette, FileText, Upload, Link2, Download,
  Trash2, Plus, Clock, User, Image
} from 'lucide-react'
import api from '../services/api'

export default function DesignDashboard() {
  const [templates,  setTemplates]  = useState([])
  const [uploads,    setUploads]    = useState([])
  const [tasks,      setTasks]      = useState([])
  const [activeTab,  setActiveTab]  = useState('tasks')
  const [loading,    setLoading]    = useState(true)
  const [uploadForm, setUploadForm] = useState({ title: '', description: '', link: '', category: 'poster' })
  const [submitting, setSubmitting] = useState(false)

  const user   = JSON.parse(localStorage.getItem('user') || '{}')
  const isHead = user?.committee_post === 'Designing Head'

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [t, u, tk] = await Promise.all([
        api.get('/team-templates?team=design').catch(() => []),
        api.get('/team-uploads?team=design').catch(() => []),
        api.get('/tasks').catch(() => []),
      ])
      setTemplates(Array.isArray(t) ? t : [])
      setUploads(Array.isArray(u) ? u : [])
      setTasks(Array.isArray(tk) ? tk : [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleSubmitUpload = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/team-uploads', { ...uploadForm, team: 'design' })
      setUploadForm({ title: '', description: '', link: '', category: 'poster' })
      fetchAll()
    } catch (err) { alert(err.response?.data?.message || 'Failed to submit') }
    finally { setSubmitting(false) }
  }

  const handleDeleteUpload = async (id) => {
    if (!confirm('Delete this upload?')) return
    try { await api.delete(`/team-uploads/${id}`); fetchAll() }
    catch { alert('Failed to delete') }
  }

  const taskStats = {
    pending:    tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed:  tasks.filter(t => t.status === 'completed').length,
  }

  const tabs = [
    { id: 'tasks',     label: 'My Tasks',     icon: Clock },
    { id: 'templates', label: 'Templates',    icon: FileText },
    { id: 'uploads',   label: 'Team Uploads', icon: Upload },
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
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Design Dashboard</h1>
            <p className="text-gray-400 text-sm">{user?.committee_post} — {user?.full_name || user?.username}</p>
          </div>
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
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}>
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            )
          })}
        </div>

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
              <FileText className="w-4 h-4 text-violet-400" /> Design Templates &amp; Assets
            </h3>
            {templates.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Image className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No templates yet — ask admin to upload one</p>
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

        {/* ── UPLOADS ── */}
        {activeTab === 'uploads' && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-violet-400" /> Submit Design / Asset Link
              </h3>
              <form onSubmit={handleSubmitUpload} className="space-y-3">
                <input required placeholder="Title" value={uploadForm.title}
                  onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500" />
                <textarea rows={2} placeholder="Description (optional)" value={uploadForm.description}
                  onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 resize-none" />
                <input required placeholder="Canva / Drive / Figma Link" value={uploadForm.link}
                  onChange={e => setUploadForm({ ...uploadForm, link: e.target.value })}
                  className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500" />
                <select value={uploadForm.category}
                  onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}
                  className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500">
                  <option value="poster">Poster</option>
                  <option value="banner">Banner</option>
                  <option value="social">Social Media</option>
                  <option value="branding">Branding</option>
                  <option value="other">Other</option>
                </select>
                <button type="submit" disabled={submitting}
                  className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 py-2.5 rounded-lg text-sm font-medium transition">
                  {submitting ? 'Submitting...' : 'Submit Design'}
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
                        <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded-full text-xs">{u.category}</span>
                      </div>
                      {u.description && <p className="text-gray-400 text-sm">{u.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{u.uploader?.full_name || u.uploader?.username}</span>
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

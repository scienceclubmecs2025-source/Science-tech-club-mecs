import { useState, useEffect } from 'react'
import {
  Calendar, Plus, Edit2, Trash2, FileText,
  Upload, Download, Link2, Clock, User,
  ExternalLink, UserPlus, X, Check
} from 'lucide-react'
import api from '../services/api'

export default function ExecutiveDashboard() {
  const [events,        setEvents]        = useState([])
  const [uploads,       setUploads]       = useState([])
  const [templates,     setTemplates]     = useState([])
  const [tasks,         setTasks]         = useState([])
  const [students,      setStudents]      = useState([])
  const [team,          setTeam]          = useState([])
  const [activeTab,     setActiveTab]     = useState('events')
  const [loading,       setLoading]       = useState(true)
  const [showModal,     setShowModal]     = useState(false)
  const [showHireModal, setShowHireModal] = useState(false)
  const [editingEvent,  setEditingEvent]  = useState(null)
  const [searchQ,       setSearchQ]       = useState('')
  const [submitting,    setSubmitting]    = useState(false)
  const [uploadForm,    setUploadForm]    = useState({ title: '', description: '', link: '', category: 'report' })
  const [formData,      setFormData]      = useState({
    title: '', description: '', event_date: '', location: '',
    poster_url: '', banner_url: '', report_url: ''
  })

  // ✅ Read from state so it reflects the fresh verified user
  const [user, setUser] = useState({})
  const [isHead, setIsHead] = useState(false)

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user') || '{}')
    setUser(stored)
    const post = stored?.committee_post?.trim().toLowerCase()
    setIsHead(post === 'executive head')
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [ev, u, t, tk, allUsers] = await Promise.all([
        api.get('/events').catch(() => []),
        api.get('/team-uploads?team=executive').catch(() => []),
        api.get('/team-templates?team=executive').catch(() => []),
        api.get('/tasks').catch(() => []),
        api.get('/users').catch(() => []),
      ])
      setEvents(Array.isArray(ev) ? ev : [])
      setUploads(Array.isArray(u) ? u : [])
      setTemplates(Array.isArray(t) ? t : [])
      setTasks(Array.isArray(tk) ? tk : [])
      const all = Array.isArray(allUsers) ? allUsers : []
      setStudents(all.filter(u => u.role === 'student' && !u.is_committee))
      setTeam(all.filter(u =>
        u.committee_post === 'Executive Member' || u.committee_post === 'Executive Head'
      ))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleSubmitEvent = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingEvent) {
        await api.put(`/events/${editingEvent.id}`, formData)
        alert('✅ Event updated!')
      } else {
        await api.post('/events', formData)
        alert('✅ Event created!')
      }
      setShowModal(false); setEditingEvent(null)
      setFormData({ title: '', description: '', event_date: '', location: '', poster_url: '', banner_url: '', report_url: '' })
      fetchAll()
    } catch (err) { alert(err.response?.data?.message || 'Failed to save event') }
    finally { setSubmitting(false) }
  }

  const handleEdit = (event) => {
    setEditingEvent(event)
    setFormData({
      title: event.title, description: event.description || '',
      event_date: event.event_date || '', location: event.location || '',
      poster_url: event.poster_url || '', banner_url: event.banner_url || '',
      report_url: event.report_url || ''
    })
    setShowModal(true)
  }

  const handleDeleteEvent = async (id) => {
    if (!confirm('Delete this event?')) return
    try { await api.delete(`/events/${id}`); fetchAll() }
    catch { alert('Failed to delete event') }
  }

  const handleSubmitUpload = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/team-uploads', { ...uploadForm, team: 'executive' })
      setUploadForm({ title: '', description: '', link: '', category: 'report' })
      fetchAll()
    } catch (err) { alert(err.response?.data?.message || 'Failed') }
    finally { setSubmitting(false) }
  }

  const handleDeleteUpload = async (id) => {
    if (!confirm('Delete this upload?')) return
    try { await api.delete(`/team-uploads/${id}`); fetchAll() }
    catch { alert('Failed to delete') }
  }

  const handleHire = async (userId, name) => {
    if (!confirm(`Add ${name} to Executive Team?`)) return
    try {
      await api.put(`/users/${userId}`, { is_committee: true, committee_post: 'Executive Member' })
      alert(`✅ ${name} added to Executive Team!`); fetchAll()
    } catch { alert('Failed') }
  }

  const handleFire = async (userId, name) => {
    if (!confirm(`Remove ${name} from Executive Team?`)) return
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

  const tabs = [
    { id: 'events',    label: '📅 Events' },
    { id: 'uploads',   label: '📁 Uploads' },
    { id: 'templates', label: '📄 Templates' },
    { id: 'tasks',     label: '✅ My Tasks' },
    { id: 'team',      label: '👥 Team' },
  ]

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Executive Dashboard</h1>
              <p className="text-gray-400 text-sm">{user?.committee_post} — {user?.full_name || user?.username}</p>
            </div>
          </div>
          {isHead && (
            <button onClick={() => setShowHireModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg text-sm font-medium transition">
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
                activeTab === tab.id ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── EVENTS ── */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            {isHead && (
              <button onClick={() => { setEditingEvent(null); setShowModal(true) }}
                className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg text-sm font-medium transition mb-2">
                <Plus className="w-4 h-4" /> Create Event
              </button>
            )}
            {events.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No events yet</p>
              </div>
            ) : events.map(ev => (
              <div key={ev.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{ev.title}</h3>
                    {ev.description && <p className="text-gray-400 text-sm mb-2">{ev.description}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      {ev.event_date && <span>📅 {new Date(ev.event_date).toLocaleDateString()}</span>}
                      {ev.location   && <span>📍 {ev.location}</span>}
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {ev.poster_url && <a href={ev.poster_url} target="_blank" rel="noopener noreferrer" className="text-xs text-pink-400 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Poster</a>}
                      {ev.banner_url && <a href={ev.banner_url} target="_blank" rel="noopener noreferrer" className="text-xs text-pink-400 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Banner</a>}
                      {ev.report_url && <a href={ev.report_url} target="_blank" rel="noopener noreferrer" className="text-xs text-pink-400 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Report</a>}
                    </div>
                  </div>
                  {isHead && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleEdit(ev)} className="p-1.5 hover:bg-blue-600/20 rounded-lg text-blue-400 transition"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteEvent(ev.id)} className="p-1.5 hover:bg-red-600/20 rounded-lg text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── UPLOADS ── */}
        {activeTab === 'uploads' && (
          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-4">Upload Document</h3>
              <form onSubmit={handleSubmitUpload} className="space-y-3">
                <input required placeholder="Title" value={uploadForm.title}
                  onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500" />
                <textarea rows={2} placeholder="Description (optional)" value={uploadForm.description}
                  onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500 resize-none" />
                <input required placeholder="Google Drive / Link" value={uploadForm.link}
                  onChange={e => setUploadForm({ ...uploadForm, link: e.target.value })}
                  className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500" />
                <select value={uploadForm.category} onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}
                  className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500">
                  <option value="report">Report</option>
                  <option value="minutes">Meeting Minutes</option>
                  <option value="proposal">Proposal</option>
                  <option value="other">Other</option>
                </select>
                <button type="submit" disabled={submitting}
                  className="w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-50 py-2.5 rounded-lg text-sm font-medium transition">
                  {submitting ? 'Uploading...' : 'Upload'}
                </button>
              </form>
            </div>
            {uploads.map(d => (
              <div key={d.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-white text-sm">{d.title}</p>
                  {d.description && <p className="text-gray-400 text-xs mt-0.5">{d.description}</p>}
                  <p className="text-gray-600 text-xs mt-1">{new Date(d.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <a href={d.link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600/20 hover:bg-pink-600/40 border border-pink-600/30 text-pink-400 rounded-lg text-xs transition">
                    <ExternalLink className="w-3.5 h-3.5" /> Open
                  </a>
                  {(isHead || d.uploaded_by === user?.id) && (
                    <button onClick={() => handleDeleteUpload(d.id)}
                      className="p-1.5 hover:bg-red-600/20 rounded-lg text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TEMPLATES ── */}
        {activeTab === 'templates' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-pink-400" /> Templates & Resources
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
                  <p className="text-pink-400 text-xs mt-0.5">Template</p>
                </div>
                <a href={t.link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 rounded-lg text-xs font-medium transition">
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
            <h3 className="font-semibold text-white mb-4">Executive Team ({team.length})</h3>
            {team.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No members yet</p>
            ) : team.map(m => (
              <div key={m.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3 mb-2">
                <div>
                  <p className="text-white text-sm font-medium">{m.full_name || m.username}</p>
                  <p className="text-pink-400 text-xs">{m.committee_post}</p>
                </div>
                {isHead && m.committee_post !== 'Executive Head' && (
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

      {/* ── EVENT MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">{editingEvent ? 'Edit Event' : 'Create Event'}</h3>
              <button onClick={() => { setShowModal(false); setEditingEvent(null) }}
                className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmitEvent} className="space-y-3">
              <input required placeholder="Event Title" value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500" />
              <textarea rows={2} placeholder="Description" value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500 resize-none" />
              <input type="datetime-local" value={formData.event_date}
                onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500" />
              <input placeholder="Location" value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500" />
              <input placeholder="Poster URL (optional)" value={formData.poster_url}
                onChange={e => setFormData({ ...formData, poster_url: e.target.value })}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500" />
              <input placeholder="Banner URL (optional)" value={formData.banner_url}
                onChange={e => setFormData({ ...formData, banner_url: e.target.value })}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500" />
              <input placeholder="Report URL (optional)" value={formData.report_url}
                onChange={e => setFormData({ ...formData, report_url: e.target.value })}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500" />
              <button type="submit" disabled={submitting}
                className="w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-50 py-2.5 rounded-lg text-sm font-medium transition">
                {submitting ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── HIRE MODAL ── */}
      {showHireModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">Add to Executive Team</h3>
              <button onClick={() => setShowHireModal(false)}
                className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>
            <input placeholder="Search by name or roll number" value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500 mb-4" />
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
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 rounded-lg text-xs font-medium transition">
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

import { useState, useEffect } from 'react'
import {
  Calendar, Plus, Edit2, Trash2, Image, FileText,
  CheckCircle, ClipboardList, Upload, Link2, Download, User
} from 'lucide-react'
import api from '../services/api'

export default function ExecutiveDashboard() {
  const [events,       setEvents]       = useState([])
  const [templates,    setTemplates]    = useState([])
  const [uploads,      setUploads]      = useState([])
  const [tasks,        setTasks]        = useState([])
  const [showModal,    setShowModal]    = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [activeTab,    setActiveTab]    = useState('events')
  const [uploadForm,   setUploadForm]   = useState({ title: '', description: '', link: '', category: 'report' })
  const [submitting,   setSubmitting]   = useState(false)
  const [formData,     setFormData]     = useState({
    title: '', description: '', event_date: '',
    location: '', poster_url: '', banner_url: '', report_url: ''
  })

  const user   = JSON.parse(localStorage.getItem('user') || '{}')
  const isHead = user?.committee_post === 'Executive Head'

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [ev, t, u, tk] = await Promise.all([
        api.get('/events').catch(() => []),
        api.get('/team-templates?team=executive').catch(() => []),
        api.get('/team-uploads?team=executive').catch(() => []),
        api.get('/tasks').catch(() => []),
      ])
      setEvents(Array.isArray(ev) ? ev : [])
      setTemplates(Array.isArray(t) ? t : [])
      setUploads(Array.isArray(u) ? u : [])
      setTasks(Array.isArray(tk) ? tk : [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingEvent) {
        await api.put(`/events/${editingEvent.id}`, formData)
        alert('Event updated!')
      } else {
        await api.post('/events', formData)
        alert('Event created!')
      }
      setShowModal(false)
      setEditingEvent(null)
      setFormData({ title: '', description: '', event_date: '', location: '', poster_url: '', banner_url: '', report_url: '' })
      fetchAll()
    } catch (err) { alert('Failed to save event: ' + (err.response?.data?.message || 'Unknown error')) }
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

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return
    try { await api.delete(`/events/${id}`); fetchAll() }
    catch { alert('Failed to delete event') }
  }

  const handleStatusChange = async (id, status) => {
    try { await api.put(`/events/${id}`, { status }); fetchAll() }
    catch { alert('Failed to update status') }
  }

  const handleSubmitUpload = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/team-uploads', { ...uploadForm, team: 'executive' })
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

  const upcoming  = events.filter(e => e.status === 'upcoming')
  const ongoing   = events.filter(e => e.status === 'ongoing')
  const completed = events.filter(e => e.status === 'completed')

  const taskStats = {
    pending:    tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed:  tasks.filter(t => t.status === 'completed').length,
  }

  const priorityColor = {
    high:   'text-red-400 bg-red-500/10 border-red-500/30',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    low:    'text-green-400 bg-green-500/10 border-green-500/30',
  }

  const tabs = [
    { id: 'events',    label: 'Events',       icon: Calendar },
    { id: 'tasks',     label: 'My Tasks',     icon: ClipboardList },
    { id: 'templates', label: 'Templates',    icon: FileText },
    { id: 'uploads',   label: 'Team Uploads', icon: Upload },
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
          {activeTab === 'events' && (
            <button onClick={() => { setEditingEvent(null); setFormData({ title: '', description: '', event_date: '', location: '', poster_url: '', banner_url: '', report_url: '' }); setShowModal(true) }}
              className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-lg text-sm font-medium transition">
              <Plus className="w-4 h-4" /> New Event
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Upcoming',    value: upcoming.length,       color: 'text-blue-400' },
            { label: 'Ongoing',     value: ongoing.length,        color: 'text-yellow-400' },
            { label: 'Completed',   value: completed.length,      color: 'text-green-400' },
            { label: 'My Tasks',    value: tasks.length,          color: 'text-pink-400' },
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
                  activeTab === tab.id ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}>
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            )
          })}
        </div>

        {/* ── EVENTS ── */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No events yet — create one!</p>
              </div>
            ) : events.map(event => (
              <div key={event.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{event.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        event.status === 'upcoming'  ? 'bg-blue-500/20 text-blue-400' :
                        event.status === 'ongoing'   ? 'bg-yellow-500/20 text-yellow-400' :
                        event.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>{event.status}</span>
                    </div>
                    {event.description && <p className="text-gray-400 text-sm mb-2">{event.description}</p>}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      {event.event_date && <span>📅 {new Date(event.event_date).toLocaleDateString()}</span>}
                      {event.location   && <span>📍 {event.location}</span>}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {event.poster_url && <a href={event.poster_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-xs"><Image className="w-3 h-3" />Poster</a>}
                      {event.banner_url && <a href={event.banner_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs"><Image className="w-3 h-3" />Banner</a>}
                      {event.report_url && <a href={event.report_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs"><FileText className="w-3 h-3" />Report</a>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleEdit(event)} className="p-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg text-blue-400 transition"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(event.id)} className="p-2 hover:bg-red-600/20 rounded-lg text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-800">
                  {['upcoming', 'ongoing', 'completed'].map(s => (
                    <button key={s} onClick={() => handleStatusChange(event.id, s)}
                      disabled={event.status === s}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
                        s === 'upcoming'  ? 'bg-blue-600/20 hover:bg-blue-600/40 text-blue-400' :
                        s === 'ongoing'   ? 'bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400' :
                        'bg-green-600/20 hover:bg-green-600/40 text-green-400'
                      }`}>Mark {s}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TASKS ── */}
        {activeTab === 'tasks' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Pending',     value: taskStats.pending,    color: 'text-yellow-400' },
                { label: 'In Progress', value: taskStats.inProgress, color: 'text-blue-400' },
                { label: 'Completed',   value: taskStats.completed,  color: 'text-green-400' },
              ].map(s => (
                <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            {tasks.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center text-gray-400">
                <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No tasks yet</p>
              </div>
            ) : tasks.map(task => (
              <div key={task.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-white">{task.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${priorityColor[task.priority] || priorityColor.medium}`}>{task.priority}</span>
                    </div>
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
              <FileText className="w-4 h-4 text-pink-400" /> Report Templates
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
                  <p className="text-pink-400 text-xs mt-0.5">Executive Template</p>
                </div>
                <a href={t.link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 rounded-lg text-xs font-medium transition">
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
                <Plus className="w-4 h-4 text-pink-400" /> Submit Document / Report Link
              </h3>
              <form onSubmit={handleSubmitUpload} className="space-y-3">
                <input required placeholder="Title" value={uploadForm.title}
                  onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500" />
                <textarea rows={2} placeholder="Description (optional)" value={uploadForm.description}
                  onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500 resize-none" />
                <input required placeholder="Google Drive / Document Link" value={uploadForm.link}
                  onChange={e => setUploadForm({ ...uploadForm, link: e.target.value })}
                  className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500" />
                <select value={uploadForm.category}
                  onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}
                  className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500">
                  <option value="report">Report</option>
                  <option value="minutes">Meeting Minutes</option>
                  <option value="proposal">Proposal</option>
                  <option value="other">Other</option>
                </select>
                <button type="submit" disabled={submitting}
                  className="w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-50 py-2.5 rounded-lg text-sm font-medium transition">
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
                        <span className="px-2 py-0.5 bg-pink-500/20 text-pink-400 border border-pink-500/30 rounded-full text-xs">{u.category}</span>
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
                          className="p-1.5 hover:bg-red-600/20 rounded-lg text-red-400 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Create/Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required placeholder="Title" value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500" />
              <textarea rows={3} placeholder="Description" value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500 resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={formData.event_date}
                  onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                  className="px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500" />
                <input placeholder="Location" value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500" />
              </div>
              <input placeholder="Poster URL" value={formData.poster_url}
                onChange={e => setFormData({ ...formData, poster_url: e.target.value })}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500" />
              <input placeholder="Banner URL" value={formData.banner_url}
                onChange={e => setFormData({ ...formData, banner_url: e.target.value })}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500" />
              <input placeholder="Report URL" value={formData.report_url}
                onChange={e => setFormData({ ...formData, report_url: e.target.value })}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500" />
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-pink-600 hover:bg-pink-700 py-2.5 rounded-lg text-sm font-medium transition">
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 py-2.5 rounded-lg text-sm font-medium transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

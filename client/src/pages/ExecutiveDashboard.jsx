import { useState, useEffect } from 'react'
import { FileText, Upload, Download, Plus, Trash2, ExternalLink, Users, UserPlus, X, Check } from 'lucide-react'
import api from '../services/api'

export default function ExecutiveWindow() {
  const user = JSON.parse(localStorage.getItem('user'))
  const isHead = user?.committee_post === 'Executive Head'

  const [activeTab, setActiveTab]       = useState('uploads')
  const [uploads, setUploads]           = useState([])
  const [template, setTemplate]         = useState(null)
  const [students, setStudents]         = useState([])
  const [executives, setExecutives]     = useState([])
  const [loading, setLoading]           = useState(true)
  const [showHireModal, setShowHireModal] = useState(false)
  const [searchQ, setSearchQ]           = useState('')

  const [form, setForm] = useState({ title: '', description: '', link: '', category: 'report' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [u, t, allUsers] = await Promise.all([
        api.get('/team-uploads?team=executive').catch(() => []),
        api.get('/team-templates?team=executive').catch(() => null),
        api.get('/users').catch(() => [])
      ])
      setUploads(Array.isArray(u) ? u : [])
      setTemplate(Array.isArray(t) ? t[0] : t)
      const all = Array.isArray(allUsers) ? allUsers : []
      setStudents(all.filter(u => u.role === 'student' && !u.is_committee))
      setExecutives(all.filter(u => u.committee_post === 'Executive Member' || u.committee_post === 'Executive Head'))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.link.trim()) { alert('Please enter a link'); return }
    setSubmitting(true)
    try {
      await api.post('/team-uploads', { ...form, team: 'executive' })
      alert('✅ Uploaded successfully!')
      setForm({ title: '', description: '', link: '', category: 'report' })
      fetchAll()
    } catch (err) { alert(err.response?.data?.message || 'Failed to upload') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this upload?')) return
    try { await api.delete(`/team-uploads/${id}`); fetchAll() }
    catch (e) { alert('Failed to delete') }
  }

  const handleHire = async (userId, name) => {
    if (!confirm(`Make ${name} an Executive Member?`)) return
    try {
      await api.put(`/users/${userId}`, {
        is_committee: true,
        committee_post: 'Executive Member'
      })
      alert(`✅ ${name} is now an Executive Member!`)
      fetchAll()
    } catch (e) { alert('Failed to hire') }
  }

  const handleFire = async (userId, name) => {
    if (!confirm(`Remove ${name} from Executives?`)) return
    try {
      await api.put(`/users/${userId}`, {
        is_committee: false,
        committee_post: null
      })
      alert(`${name} removed from Executives.`)
      fetchAll()
    } catch (e) { alert('Failed to remove') }
  }

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(searchQ.toLowerCase()) ||
    s.roll_number?.toLowerCase().includes(searchQ.toLowerCase())
  )

  const categoryColors = {
    report:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
    event:   'bg-pink-500/20 text-pink-400 border-pink-500/30',
    plan:    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    other:   'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 pb-12">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-pink-600 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Executive Window</h1>
              <p className="text-gray-400 text-sm">{isHead ? '🎖️ Executive Head' : 'Executive Member'}</p>
            </div>
          </div>
          {isHead && (
            <button
              onClick={() => setShowHireModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg text-sm font-medium transition"
            >
              <UserPlus className="w-4 h-4" /> Manage Team
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900 p-1 rounded-xl">
          {[
            { id: 'uploads', label: '📁 Uploads' },
            { id: 'submit',  label: '➕ Submit New' },
            { id: 'team',    label: '👥 Team' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${activeTab === t.id ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── UPLOADS TAB ── */}
        {activeTab === 'uploads' && (
          <div className="space-y-4">
            {/* Template download */}
            {template && (
              <div className="bg-gray-900 border border-pink-500/30 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-pink-400 font-medium text-sm">📄 Report Template</p>
                  <p className="text-gray-400 text-xs mt-0.5">{template.title}</p>
                </div>
                <a href={template.link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg text-sm font-medium transition">
                  <Download className="w-4 h-4" /> Download Template
                </a>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : uploads.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No uploads yet. Submit your first report or event plan.</p>
              </div>
            ) : (
              uploads.map(u => (
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
                    <div className="flex gap-2">
                      <a href={u.link} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-600/30 text-blue-400 rounded-lg text-sm transition">
                        <ExternalLink className="w-4 h-4" /> Open
                      </a>
                      {(isHead || u.uploaded_by === user?.id) && (
                        <button onClick={() => handleDelete(u.id)}
                          className="p-1.5 hover:bg-red-600/20 rounded-lg text-red-400 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── SUBMIT TAB ── */}
        {activeTab === 'submit' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold text-white mb-4">Submit Report / Event Plan / Other</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required placeholder="Title" value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500" />
              <textarea rows={3} placeholder="Description (optional)" value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500 resize-none" />
              <div>
                <label className="text-gray-400 text-xs mb-1 block">
                  PDF / Google Drive / Canva link — must be publicly accessible
                </label>
                <input required placeholder="https://drive.google.com/..." value={form.link}
                  onChange={e => setForm({...form, link: e.target.value})}
                  className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500" />
              </div>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500">
                <option value="report">Event Report</option>
                <option value="event">Event Plan</option>
                <option value="plan">Activity Plan</option>
                <option value="other">Other</option>
              </select>
              <button type="submit" disabled={submitting}
                className="w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-50 py-2.5 rounded-lg text-sm font-medium transition">
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </div>
        )}

        {/* ── TEAM TAB ── */}
        {activeTab === 'team' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-white">Current Executive Team ({executives.length})</h2>
            {executives.map(ex => (
              <div key={ex.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-pink-600 rounded-full flex items-center justify-center text-sm font-bold">
                    {ex.full_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{ex.full_name || ex.username}</p>
                    <p className="text-gray-400 text-xs">{ex.committee_post} · {ex.department}</p>
                  </div>
                </div>
                {isHead && ex.committee_post !== 'Executive Head' && (
                  <button onClick={() => handleFire(ex.id, ex.full_name || ex.username)}
                    className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 border border-red-600/30 text-red-400 rounded-lg text-xs transition">
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-pink-400" /> Hire Executive Member
              </h3>
              <button onClick={() => setShowHireModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input placeholder="Search by name or roll number..." value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500 mb-4" />
            <div className="max-h-80 overflow-y-auto space-y-2">
              {filtered.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No students found</p>
              ) : filtered.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-white text-sm font-medium">{s.full_name || s.username}</p>
                    <p className="text-gray-400 text-xs">{s.roll_number} · {s.department} · Year {s.year}</p>
                  </div>
                  <button onClick={() => handleHire(s.id, s.full_name || s.username)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 rounded-lg text-xs font-medium transition">
                    <Check className="w-3.5 h-3.5" /> Hire
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

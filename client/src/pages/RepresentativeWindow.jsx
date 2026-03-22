import { useState, useEffect } from 'react'
import { FileText, Download, ExternalLink, Trash2, UserPlus, X, Check, ClipboardList } from 'lucide-react'
import api from '../services/api'

export default function RepresentativeWindow() {
  const user = JSON.parse(localStorage.getItem('user'))
  const isHead = user?.committee_post === 'Representative Head'

  const [activeTab, setActiveTab]         = useState('uploads')
  const [uploads, setUploads]             = useState([])
  const [template, setTemplate]           = useState(null)
  const [students, setStudents]           = useState([])
  const [representatives, setRepresentatives] = useState([])
  const [loading, setLoading]             = useState(true)
  const [showHireModal, setShowHireModal] = useState(false)
  const [searchQ, setSearchQ]             = useState('')
  const [form, setForm] = useState({ title: '', description: '', link: '', category: 'letter' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [u, t, allUsers] = await Promise.all([
        api.get('/team-uploads?team=representative').catch(() => []),
        api.get('/team-templates?team=representative').catch(() => null),
        api.get('/users').catch(() => [])
      ])
      setUploads(Array.isArray(u) ? u : [])
      setTemplate(Array.isArray(t) ? t[0] : t)
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
    } catch (err) { alert(err.response?.data?.message || 'Failed to submit') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this upload?')) return
    try { await api.delete(`/team-uploads/${id}`); fetchAll() }
    catch (e) { alert('Failed to delete') }
  }

  const handleHire = async (userId, name) => {
    if (!confirm(`Make ${name} a Representative Member?`)) return
    try {
      await api.put(`/users/${userId}`, { is_committee: true, committee_post: 'Representative Member' })
      alert(`✅ ${name} is now a Representative!`)
      fetchAll()
    } catch (e) { alert('Failed to hire') }
  }

  const handleFire = async (userId, name) => {
    if (!confirm(`Remove ${name} from Representatives?`)) return
    try {
      await api.put(`/users/${userId}`, { is_committee: false, committee_post: null })
      fetchAll()
    } catch (e) { alert('Failed to remove') }
  }

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(searchQ.toLowerCase()) ||
    s.roll_number?.toLowerCase().includes(searchQ.toLowerCase())
  )

  const categoryColors = {
    letter:   'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    request:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    notice:   'bg-green-500/20 text-green-400 border-green-500/30',
    other:    'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 pb-12">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Representative Window</h1>
              <p className="text-gray-400 text-sm">{isHead ? '🎖️ Representative Head' : 'Representative Member'}</p>
            </div>
          </div>
          {isHead && (
            <button onClick={() => setShowHireModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition">
              <UserPlus className="w-4 h-4" /> Manage Team
            </button>
          )}
        </div>

        <div className="flex gap-1 mb-6 bg-gray-900 p-1 rounded-xl">
          {[
            { id: 'uploads', label: '📁 Uploads' },
            { id: 'submit',  label: '➕ Submit New' },
            { id: 'team',    label: '👥 Team' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${activeTab === t.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

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
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : uploads.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-400">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No uploads yet.</p>
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
                  <div className="flex gap-2">
                    <a href={u.link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-600/30 text-indigo-400 rounded-lg text-sm transition">
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
            ))}
          </div>
        )}

        {activeTab === 'submit' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold text-white mb-4">Submit Letter / Notice / Request</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required placeholder="Title" value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500" />
              <textarea rows={3} placeholder="Description (optional)" value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 resize-none" />
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Google Drive / PDF link (publicly viewable)</label>
                <input required placeholder="https://drive.google.com/..." value={form.link}
                  onChange={e => setForm({...form, link: e.target.value})}
                  className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500" />
              </div>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500">
                <option value="letter">Official Letter</option>
                <option value="request">Permission Request</option>
                <option value="notice">Notice</option>
                <option value="other">Other</option>
              </select>
              <button type="submit" disabled={submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 py-2.5 rounded-lg text-sm font-medium transition">
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-white">Current Representatives ({representatives.length})</h2>
            {representatives.map(r => (
              <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
                    {r.full_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{r.full_name || r.username}</p>
                    <p className="text-gray-400 text-xs">{r.committee_post} · {r.department}</p>
                  </div>
                </div>
                {isHead && r.committee_post !== 'Representative Head' && (
                  <button onClick={() => handleFire(r.id, r.full_name || r.username)}
                    className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 border border-red-600/30 text-red-400 rounded-lg text-xs transition">
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showHireModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" /> Hire Representative
              </h3>
              <button onClick={() => setShowHireModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input placeholder="Search by name or roll number..." value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 mb-4" />
            <div className="max-h-80 overflow-y-auto space-y-2">
              {filtered.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-white text-sm font-medium">{s.full_name || s.username}</p>
                    <p className="text-gray-400 text-xs">{s.roll_number} · {s.department} · Year {s.year}</p>
                  </div>
                  <button onClick={() => handleHire(s.id, s.full_name || s.username)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-medium transition">
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

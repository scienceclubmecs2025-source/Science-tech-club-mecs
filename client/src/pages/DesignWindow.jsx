import { useState, useEffect } from 'react'
import { Palette, ExternalLink, Upload, Trash2, UserPlus, X, Check, Link2 } from 'lucide-react'
import api from '../services/api'

export default function DesignWindow() {
  const user = JSON.parse(localStorage.getItem('user'))
  const isHead = user?.committee_post === 'Designing Head'

  const [activeTab, setActiveTab]       = useState('designs')
  const [designs, setDesigns]           = useState([])
  const [canvaLink, setCanvaLink]       = useState('')
  const [students, setStudents]         = useState([])
  const [team, setTeam]                 = useState([])
  const [loading, setLoading]           = useState(true)
  const [showHireModal, setShowHireModal] = useState(false)
  const [searchQ, setSearchQ]           = useState('')
  const [form, setForm] = useState({ title: '', description: '', link: '', category: 'poster' })
  const [submitting, setSubmitting]     = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [u, cfg, allUsers] = await Promise.all([
        api.get('/team-uploads?team=design').catch(() => []),
        api.get('/config').catch(() => ({})),
        api.get('/users').catch(() => [])
      ])
      setDesigns(Array.isArray(u) ? u : [])
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
    catch (e) { alert('Failed to delete') }
  }

  const handleHire = async (userId, name) => {
    if (!confirm(`Add ${name} to the Designing Team?`)) return
    try {
      await api.put(`/users/${userId}`, { is_committee: true, committee_post: 'Designing Team' })
      alert(`✅ ${name} added to Designing Team!`)
      fetchAll()
    } catch (e) { alert('Failed') }
  }

  const handleFire = async (userId, name) => {
    if (!confirm(`Remove ${name} from Designing Team?`)) return
    try {
      await api.put(`/users/${userId}`, { is_committee: false, committee_post: null })
      fetchAll()
    } catch (e) { alert('Failed') }
  }

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(searchQ.toLowerCase()) ||
    s.roll_number?.toLowerCase().includes(searchQ.toLowerCase())
  )

  const categoryColors = {
    poster:    'bg-purple-500/20 text-purple-400 border-purple-500/30',
    banner:    'bg-blue-500/20 text-blue-400 border-blue-500/30',
    social:    'bg-pink-500/20 text-pink-400 border-pink-500/30',
    branding:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    other:     'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 pb-12">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Design Window</h1>
              <p className="text-gray-400 text-sm">{isHead ? '🎖️ Designing Head' : 'Designing Team'}</p>
            </div>
          </div>
          {isHead && (
            <button onClick={() => setShowHireModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition">
              <UserPlus className="w-4 h-4" /> Manage Team
            </button>
          )}
        </div>

        {/* Canva Quick Access */}
        {canvaLink && (
          <a href={canvaLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-xl p-4 mb-6 hover:from-purple-900/70 transition group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
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

        <div className="flex gap-1 mb-6 bg-gray-900 p-1 rounded-xl">
          {[
            { id: 'designs', label: '🎨 Designs' },
            { id: 'upload',  label: '➕ Upload' },
            { id: 'team',    label: '👥 Team' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${activeTab === t.id ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'designs' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : designs.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-400">
                <Palette className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No designs uploaded yet.</p>
              </div>
            ) : designs.map(d => (
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
                  <div className="flex gap-2">
                    <a href={d.link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-600/30 text-purple-400 rounded-lg text-sm transition">
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

        {activeTab === 'upload' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold text-white mb-4">Upload Design</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required placeholder="Design Title" value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500" />
              <textarea rows={2} placeholder="Description (optional)" value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 resize-none" />
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Canva / Google Drive / Image link</label>
                <input required placeholder="https://www.canva.com/design/..." value={form.link}
                  onChange={e => setForm({...form, link: e.target.value})}
                  className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500" />
              </div>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500">
                <option value="poster">Event Poster</option>
                <option value="banner">Banner</option>
                <option value="social">Social Media Post</option>
                <option value="branding">Branding</option>
                <option value="other">Other</option>
              </select>
              <button type="submit" disabled={submitting}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 py-2.5 rounded-lg text-sm font-medium transition">
                {submitting ? 'Uploading...' : 'Upload Design'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-white">Designing Team ({team.length})</h2>
            {team.map(m => (
              <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                    {m.full_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{m.full_name || m.username}</p>
                    <p className="text-gray-400 text-xs">{m.committee_post} · {m.department}</p>
                  </div>
                </div>
                {isHead && m.committee_post !== 'Designing Head' && (
                  <button onClick={() => handleFire(m.id, m.full_name || m.username)}
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
                <UserPlus className="w-5 h-5 text-purple-400" /> Add to Design Team
              </h3>
              <button onClick={() => setShowHireModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input placeholder="Search by name or roll number..." value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 mb-4" />
            <div className="max-h-80 overflow-y-auto space-y-2">
              {filtered.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-white text-sm font-medium">{s.full_name || s.username}</p>
                    <p className="text-gray-400 text-xs">{s.roll_number} · {s.department} · Year {s.year}</p>
                  </div>
                  <button onClick={() => handleHire(s.id, s.full_name || s.username)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-medium transition">
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

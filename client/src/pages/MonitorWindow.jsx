import { useState, useEffect } from 'react'
import { Eye, FileText, ClipboardList, Palette, ExternalLink, Filter } from 'lucide-react'
import api from '../services/api'

export default function MonitorWindow() {
  const [uploads, setUploads]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [teamFilter, setTeamFilter] = useState('all')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const data = await api.get('/team-uploads').catch(() => [])
      setUploads(Array.isArray(data) ? data : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const filtered = teamFilter === 'all'
    ? uploads
    : uploads.filter(u => u.team === teamFilter)

  const teamMeta = {
    executive:     { label: 'Executive',     color: 'bg-pink-500/20 text-pink-400 border-pink-500/30',     icon: FileText },
    representative:{ label: 'Representative', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', icon: ClipboardList },
    design:        { label: 'Design',         color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Palette },
  }

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 pb-12">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Monitor Window</h1>
            <p className="text-gray-400 text-sm">View all team uploads — Reports, Letters & Designs</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { id: 'all',            label: `All (${uploads.length})` },
            { id: 'executive',      label: `Executive (${uploads.filter(u=>u.team==='executive').length})` },
            { id: 'representative', label: `Representative (${uploads.filter(u=>u.team==='representative').length})` },
            { id: 'design',         label: `Design (${uploads.filter(u=>u.team==='design').length})` },
          ].map(f => (
            <button key={f.id} onClick={() => setTeamFilter(f.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                teamFilter === f.id ? 'bg-blue-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-400">
            <Eye className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No uploads found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(u => {
              const meta = teamMeta[u.team] || teamMeta.executive
              const Icon = meta.icon
              return (
                <div key={u.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-white">{u.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${meta.color}`}>
                          <Icon className="w-3 h-3 inline mr-1" />{meta.label}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-800 text-gray-400 border border-gray-700">
                          {u.category}
                        </span>
                      </div>
                      {u.description && <p className="text-gray-400 text-sm mb-2">{u.description}</p>}
                      <p className="text-gray-600 text-xs">
                        By {u.uploader?.full_name || u.uploader?.username} · {new Date(u.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <a href={u.link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-600/30 text-blue-400 rounded-lg text-sm transition shrink-0">
                      <ExternalLink className="w-4 h-4" /> Open
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

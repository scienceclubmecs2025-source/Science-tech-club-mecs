import { useState, useEffect } from 'react'
import {
  MessageSquare, CheckCircle, XCircle, Clock,
  UserPlus, X, Check, Users, FileText, Download,
  ExternalLink, Trash2
} from 'lucide-react'
import api from '../services/api'

export default function RepresentativeDashboard() {
  const [permissions,  setPermissions]  = useState([])
  const [templates,    setTemplates]    = useState([])
  const [tasks,        setTasks]        = useState([])
  const [students,     setStudents]     = useState([])
  const [team,         setTeam]         = useState([])
  const [activeTab,    setActiveTab]    = useState('requests')
  const [loading,      setLoading]      = useState(true)
  const [filter,       setFilter]       = useState('pending')
  const [selectedPerm, setSelectedPerm] = useState(null)
  const [response,     setResponse]     = useState('')
  const [showHireModal,setShowHireModal]= useState(false)
  const [searchQ,      setSearchQ]      = useState('')

  // ✅ user read via useEffect so it always gets fresh localStorage value
  const [user,   setUser]   = useState({})
  const [isHead, setIsHead] = useState(false)

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user') || '{}')
    setUser(stored)
    const post = stored?.committee_post?.trim().toLowerCase()
    setIsHead(post === 'representative head')
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [perms, tk, allUsers, tmpl] = await Promise.all([
        api.get('/permissions').catch(() => []),
        api.get('/tasks').catch(() => []),
        api.get('/users').catch(() => []),
        api.get('/team-templates?team=representative').catch(() => []),
      ])
      setPermissions(Array.isArray(perms) ? perms : [])
      setTasks(Array.isArray(tk) ? tk : [])
      setTemplates(Array.isArray(tmpl) ? tmpl : [])
      const all = Array.isArray(allUsers) ? allUsers : []
      setStudents(all.filter(u => u.role === 'student' && !u.is_committee))
      setTeam(all.filter(u =>
        u.committee_post === 'Representative Member' ||
        u.committee_post === 'Representative Head'
      ))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleApprove = async (id) => {
    try {
      await api.put(`/permissions/${id}`, {
        status: 'approved',
        response: response.trim() || 'Request approved'
      })
      alert('✅ Request approved!')
      setSelectedPerm(null); setResponse('')
      fetchData()
    } catch { alert('Failed to approve request') }
  }

  const handleReject = async (id) => {
    if (!response.trim()) return alert('Please provide a reason for rejection')
    try {
      await api.put(`/permissions/${id}`, { status: 'rejected', response: response.trim() })
      alert('Request rejected')
      setSelectedPerm(null); setResponse('')
      fetchData()
    } catch { alert('Failed to reject request') }
  }

  const handleHire = async (userId, name) => {
    if (!confirm(`Add ${name} to Representative Team?`)) return
    try {
      await api.put(`/users/${userId}`, { is_committee: true, committee_post: 'Representative Member' })
      alert(`✅ ${name} added to Representative Team!`); fetchData()
    } catch { alert('Failed') }
  }

  const handleFire = async (userId, name) => {
    if (!confirm(`Remove ${name} from Representative Team?`)) return
    try {
      await api.put(`/users/${userId}`, { is_committee: false, committee_post: null }); fetchData()
    } catch { alert('Failed') }
  }

  const filteredPerms = permissions.filter(p =>
    filter === 'all' ? true : p.status === filter
  )

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(searchQ.toLowerCase()) ||
    s.roll_number?.toLowerCase().includes(searchQ.toLowerCase())
  )

  const taskStats = {
    pending:    tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed:  tasks.filter(t => t.status === 'completed').length,
  }

  const tabs = [
    { id: 'requests',  label: '📋 Requests' },
    { id: 'templates', label: '📄 Templates' },
    { id: 'tasks',     label: '✅ My Tasks' },
    { id: 'team',      label: '👥 Team' },
  ]

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Representative Dashboard</h1>
              <p className="text-gray-400 text-sm">{user?.committee_post} — {user?.full_name || user?.username}</p>
            </div>
          </div>
          {isHead && (
            <button onClick={() => setShowHireModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition">
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
                activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── REQUESTS ── */}
        {activeTab === 'requests' && (
          <div>
            {/* Filter bar */}
            <div className="flex gap-2 mb-4">
              {['pending', 'approved', 'rejected', 'all'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                    filter === f ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}>{f}</button>
              ))}
            </div>

            {filteredPerms.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center text-gray-400">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No {filter !== 'all' ? filter : ''} requests</p>
              </div>
            ) : filteredPerms.map(perm => (
              <div key={perm.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-white">{perm.title || perm.subject || 'Request'}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        perm.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        perm.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>{perm.status}</span>
                    </div>
                    {perm.description && <p className="text-gray-400 text-sm mb-2">{perm.description}</p>}
                    <p className="text-gray-600 text-xs">
                      By {perm.requester?.full_name || perm.requester?.username || 'Unknown'} · {new Date(perm.created_at).toLocaleDateString()}
                    </p>
                    {perm.response && (
                      <p className="text-gray-400 text-xs mt-1 italic">Response: {perm.response}</p>
                    )}
                  </div>
                  {isHead && perm.status === 'pending' && (
                    <button onClick={() => setSelectedPerm(selectedPerm?.id === perm.id ? null : perm)}
                      className="shrink-0 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-600/30 text-blue-400 rounded-lg text-xs transition">
                      Respond
                    </button>
                  )}
                </div>

                {/* Inline response panel */}
                {isHead && selectedPerm?.id === perm.id && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <textarea rows={2} placeholder="Response message (required for rejection)"
                      value={response} onChange={e => setResponse(e.target.value)}
                      className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-none mb-3" />
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(perm.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-medium transition">
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => handleReject(perm.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-medium transition">
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── TEMPLATES ── */}
        {activeTab === 'templates' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" /> Templates & Resources
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
                  <p className="text-blue-400 text-xs mt-0.5">Resource</p>
                </div>
                <a href={t.link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium transition">
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
            <h3 className="font-semibold text-white mb-4">Representative Team ({team.length})</h3>
            {team.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No members yet</p>
            ) : team.map(m => (
              <div key={m.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3 mb-2">
                <div>
                  <p className="text-white text-sm font-medium">{m.full_name || m.username}</p>
                  <p className="text-blue-400 text-xs">{m.committee_post}</p>
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
              <h3 className="text-lg font-semibold text-white">Add to Representative Team</h3>
              <button onClick={() => setShowHireModal(false)}
                className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>
            <input placeholder="Search by name or roll number" value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 mb-4" />
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
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium transition">
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

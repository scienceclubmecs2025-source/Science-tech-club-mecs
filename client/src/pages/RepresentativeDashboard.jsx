import { useState, useEffect } from 'react'
import { MessageSquare, User, CheckCircle, XCircle, Clock, UserPlus, Send } from 'lucide-react'
import api from '../services/api'

export default function RepresentativeDashboard() {
  const [permissions, setPermissions] = useState([])
  const [guides, setGuides] = useState([])
  const [selectedPermission, setSelectedPermission] = useState(null)
  const [response, setResponse] = useState('')
  const [selectedGuide, setSelectedGuide] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending') // pending, approved, rejected, all

  const user = JSON.parse(localStorage.getItem('user'))
  const isHead = user.committee_role === 'representative' || user.committee_role === 'chair' || user.committee_role === 'secretary'

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [permissionsRes, usersRes] = await Promise.all([
        api.get('/permissions'),
        api.get('/friends/users').catch(() => ({ data: [] }))
      ])

      setPermissions(permissionsRes.data || [])
      // Filter for potential guides (committee members, faculty)
      setGuides(usersRes.data.filter(u => u.is_committee || u.role === 'faculty') || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      await api.put(`/permissions/${id}`, {
        status: 'approved',
        response: response.trim() || 'Request approved'
      })
      alert('✅ Request approved!')
      setSelectedPermission(null)
      setResponse('')
      fetchData()
    } catch (error) {
      alert('Failed to approve request')
    }
  }

  const handleReject = async (id) => {
    if (!response.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    try {
      await api.put(`/permissions/${id}`, {
        status: 'rejected',
        response: response.trim()
      })
      alert('Request rejected')
      setSelectedPermission(null)
      setResponse('')
      fetchData()
    } catch (error) {
      alert('Failed to reject request')
    }
  }

  const handleAssignGuide = async (permissionId) => {
    if (!selectedGuide) {
      alert('Please select a guide')
      return
    }

    try {
      await api.put(`/permissions/${permissionId}/assign-guide`, {
        guide_id: selectedGuide
      })
      alert('✅ Guide assigned successfully!')
      setSelectedPermission(null)
      setSelectedGuide('')
      fetchData()
    } catch (error) {
      alert('Failed to assign guide')
    }
  }

  const promoteToRepresentative = async (userId) => {
    if (!isHead) {
      alert('Only Representative Head or Chair can promote members')
      return
    }

    try {
      await api.put(`/users/${userId}`, {
        is_committee: true,
        committee_role: 'representative'
      })
      alert('✅ User promoted to Representative!')
    } catch (error) {
      alert('Failed to promote user')
    }
  }

  const filteredPermissions = permissions.filter(p => {
    if (filter === 'all') return true
    return p.status === filter
  })

  const pendingCount = permissions.filter(p => p.status === 'pending').length
  const approvedCount = permissions.filter(p => p.status === 'approved').length
  const rejectedCount = permissions.filter(p => p.status === 'rejected').length

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Representative Dashboard</h1>
              <p className="text-gray-400">
                {isHead ? '🎖️ Representative Head' : 'Representative'} - Query Management
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-yellow-900 to-yellow-800 border border-yellow-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-300" />
              <span className="text-3xl font-bold">{pendingCount}</span>
            </div>
            <h3 className="text-yellow-200 font-medium">Pending Requests</h3>
          </div>

          <div className="bg-gradient-to-br from-green-900 to-green-800 border border-green-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-300" />
              <span className="text-3xl font-bold">{approvedCount}</span>
            </div>
            <h3 className="text-green-200 font-medium">Approved</h3>
          </div>

          <div className="bg-gradient-to-br from-red-900 to-red-800 border border-red-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-8 h-8 text-red-300" />
              <span className="text-3xl font-bold">{rejectedCount}</span>
            </div>
            <h3 className="text-red-200 font-medium">Rejected</h3>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Approved ({approvedCount})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Rejected ({rejectedCount})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              All ({permissions.length})
            </button>
          </div>
        </div>

        {/* Permissions List */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Requests & Queries</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            </div>
          ) : filteredPermissions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p>No {filter !== 'all' ? filter : ''} requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPermissions.map((permission) => (
                <div key={permission.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{permission.subject}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          permission.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                          permission.status === 'approved' ? 'bg-green-900/50 text-green-400' :
                          'bg-red-900/50 text-red-400'
                        }`}>
                          {permission.status}
                        </span>
                        <span className="px-3 py-1 bg-purple-900/50 text-purple-400 rounded-full text-xs font-medium">
                          {permission.request_type}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                        <User className="w-4 h-4" />
                        <span>
                          {permission.requester?.full_name || permission.requester?.username} 
                          ({permission.requester?.email})
                        </span>
                        <span className="text-gray-600">•</span>
                        <span>{new Date(permission.created_at).toLocaleString()}</span>
                      </div>

                      <p className="text-gray-300 mb-4">{permission.description}</p>

                      {/* Assigned Guide */}
                      {permission.assigned_guide && permission.guide && (
                        <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 mb-4">
                          <p className="text-sm text-green-400 flex items-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            Guide Assigned: {permission.guide.full_name || permission.guide.username}
                          </p>
                        </div>
                      )}

                      {/* Response */}
                      {permission.response && (
                        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 mb-4">
                          <p className="text-sm text-blue-400 font-medium mb-1">Response:</p>
                          <p className="text-sm text-gray-300">{permission.response}</p>
                          {permission.handler && (
                            <p className="text-xs text-gray-400 mt-2">
                              By: {permission.handler.full_name || permission.handler.username}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Action Buttons for Pending */}
                      {permission.status === 'pending' && (
                        <div className="space-y-3 pt-4 border-t border-gray-700">
                          {/* Assign Guide for project_guide requests */}
                          {permission.request_type === 'project_guide' && (
                            <div className="flex gap-3">
                              <select
                                value={selectedPermission?.id === permission.id ? selectedGuide : ''}
                                onChange={(e) => {
                                  setSelectedPermission(permission)
                                  setSelectedGuide(e.target.value)
                                }}
                                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select a guide...</option>
                                {guides.map((guide) => (
                                  <option key={guide.id} value={guide.id}>
                                    {guide.full_name || guide.username} 
                                    {guide.is_committee && ' (Committee)'}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleAssignGuide(permission.id)}
                                disabled={!selectedGuide || selectedPermission?.id !== permission.id}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium"
                              >
                                Assign Guide
                              </button>
                            </div>
                          )}

                          {/* Response Text Area */}
                          <textarea
                            value={selectedPermission?.id === permission.id ? response : ''}
                            onChange={(e) => {
                              setSelectedPermission(permission)
                              setResponse(e.target.value)
                            }}
                            placeholder="Add response or reason..."
                            rows="3"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white resize-none"
                          />

                          {/* Approve/Reject Buttons */}
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleApprove(permission.id)}
                              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 py-3 rounded-lg font-medium"
                            >
                              <CheckCircle className="w-5 h-5" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(permission.id)}
                              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 py-3 rounded-lg font-medium"
                            >
                              <XCircle className="w-5 h-5" />
                              Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Student Features */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-6">My Activities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => window.location.href = '/projects'}
              className="bg-gray-800 hover:bg-gray-750 p-4 rounded-xl text-left border border-gray-700"
            >
              <h3 className="font-bold mb-1">My Projects</h3>
              <p className="text-sm text-gray-400">View your projects</p>
            </button>
            <button
              onClick={() => window.location.href = '/tasks'}
              className="bg-gray-800 hover:bg-gray-750 p-4 rounded-xl text-left border border-gray-700"
            >
              <h3 className="font-bold mb-1">My Tasks</h3>
              <p className="text-sm text-gray-400">Track assignments</p>
            </button>
            <button
              onClick={() => window.location.href = '/messages'}
              className="bg-gray-800 hover:bg-gray-750 p-4 rounded-xl text-left border border-gray-700"
            >
              <h3 className="font-bold mb-1">Messages</h3>
              <p className="text-sm text-gray-400">Team chat</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

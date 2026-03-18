import { useState, useEffect } from 'react'
import { Crown, Users, Calendar, MessageSquare, Settings, TrendingUp, Award } from 'lucide-react'
import api from '../services/api'

export default function ChairDashboard() {
  const [stats, setStats] = useState(null)
  const [recentActivities, setRecentActivities] = useState([])
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [loading, setLoading] = useState(true)

  const user = JSON.parse(localStorage.getItem('user'))

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [statsRes, permissionsRes, eventsRes] = await Promise.all([
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/permissions').catch(() => ({ data: [] })),
        api.get('/events').catch(() => ({ data: [] }))
      ])

      const users = statsRes.data || []
      const permissions = permissionsRes.data || []
      const events = eventsRes.data || []

      setStats({
        total_members: users.length,
        committee_members: users.filter(u => u.is_committee).length,
        pending_requests: permissions.filter(p => p.status === 'pending').length,
        upcoming_events: events.filter(e => e.status === 'upcoming').length
      })

      setPendingApprovals(permissions.filter(p => p.status === 'pending').slice(0, 5))
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const promoteToCommittee = async (userId, role, department = null) => {
    try {
      await api.put(`/users/${userId}`, {
        is_committee: true,
        committee_role: role,
        managed_department: department
      })
      alert('✅ User promoted successfully!')
      fetchDashboardData()
    } catch (error) {
      alert('Failed to promote user')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
              <Crown className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Chair Dashboard</h1>
              <p className="text-gray-400">Welcome back, {user.full_name || user.username}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 border border-blue-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-300" />
              <span className="text-3xl font-bold">{stats?.total_members || 0}</span>
            </div>
            <h3 className="text-blue-200 font-medium">Total Members</h3>
          </div>

          <div className="bg-gradient-to-br from-purple-900 to-purple-800 border border-purple-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-purple-300" />
              <span className="text-3xl font-bold">{stats?.committee_members || 0}</span>
            </div>
            <h3 className="text-purple-200 font-medium">Committee</h3>
          </div>

          <div className="bg-gradient-to-br from-yellow-900 to-yellow-800 border border-yellow-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-8 h-8 text-yellow-300" />
              <span className="text-3xl font-bold">{stats?.pending_requests || 0}</span>
            </div>
            <h3 className="text-yellow-200 font-medium">Pending Requests</h3>
          </div>

          <div className="bg-gradient-to-br from-green-900 to-green-800 border border-green-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-green-300" />
              <span className="text-3xl font-bold">{stats?.upcoming_events || 0}</span>
            </div>
            <h3 className="text-green-200 font-medium">Upcoming Events</h3>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Approvals */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <MessageSquare className="w-6 h-6" />
              Pending Approvals
            </h2>

            {pendingApprovals.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p>No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.map((request) => (
                  <div key={request.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold">{request.subject}</h3>
                        <p className="text-sm text-gray-400">
                          From: {request.requester?.full_name || request.requester?.username}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-900/50 text-yellow-400 rounded-full text-xs font-medium">
                        {request.request_type}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-4">{request.description}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.location.href = '/permissions'}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg text-sm font-medium"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>

            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/users'}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 p-4 rounded-xl text-left transition"
              >
                <Users className="w-5 h-5 mb-2" />
                <h3 className="font-bold">Manage Users</h3>
                <p className="text-sm text-blue-200">View and manage all members</p>
              </button>

              <button
                onClick={() => window.location.href = '/events'}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 p-4 rounded-xl text-left transition"
              >
                <Calendar className="w-5 h-5 mb-2" />
                <h3 className="font-bold">Events</h3>
                <p className="text-sm text-purple-200">Create and manage events</p>
              </button>

              <button
                onClick={() => window.location.href = '/permissions'}
                className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 p-4 rounded-xl text-left transition"
              >
                <MessageSquare className="w-5 h-5 mb-2" />
                <h3 className="font-bold">Permissions</h3>
                <p className="text-sm text-yellow-200">Handle student requests</p>
              </button>

              <button
                onClick={() => window.location.href = '/settings'}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 p-4 rounded-xl text-left transition"
              >
                <Settings className="w-5 h-5 mb-2" />
                <h3 className="font-bold">Settings</h3>
                <p className="text-sm text-gray-200">Club configuration</p>
              </button>
            </div>
          </div>
        </div>

        {/* Student Dashboard Features */}
        <div className="mt-8 bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-6">My Activities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => window.location.href = '/projects'}
              className="bg-gray-800 hover:bg-gray-750 p-6 rounded-xl text-left transition border border-gray-700"
            >
              <TrendingUp className="w-8 h-8 mb-3 text-blue-400" />
              <h3 className="font-bold text-lg mb-2">My Projects</h3>
              <p className="text-gray-400 text-sm">View and manage your projects</p>
            </button>

            <button
              onClick={() => window.location.href = '/tasks'}
              className="bg-gray-800 hover:bg-gray-750 p-6 rounded-xl text-left transition border border-gray-700"
            >
              <Calendar className="w-8 h-8 mb-3 text-green-400" />
              <h3 className="font-bold text-lg mb-2">My Tasks</h3>
              <p className="text-gray-400 text-sm">Track your assignments</p>
            </button>

            <button
              onClick={() => window.location.href = '/messages'}
              className="bg-gray-800 hover:bg-gray-750 p-6 rounded-xl text-left transition border border-gray-700"
            >
              <MessageSquare className="w-8 h-8 mb-3 text-purple-400" />
              <h3 className="font-bold text-lg mb-2">Messages</h3>
              <p className="text-gray-400 text-sm">Chat with team members</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

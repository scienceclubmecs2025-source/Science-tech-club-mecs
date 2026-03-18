import { useState, useEffect } from 'react'
import { Shield, Users, Calendar, MessageSquare, Eye, FileText } from 'lucide-react'
import api from '../services/api'

export default function ViceSecretaryDashboard() {
  const [stats, setStats] = useState(null)
  const [recentActivities, setRecentActivities] = useState([])
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

      setRecentActivities(permissions.slice(0, 5))
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
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
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Vice Secretary Dashboard</h1>
              <p className="text-gray-400">Welcome back, {user.full_name || user.username}</p>
            </div>
          </div>
          
          <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4 flex items-start gap-3">
            <Eye className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-blue-400 mb-1">View-Only Access</h3>
              <p className="text-sm text-blue-200">
                You have view access to all club activities. Contact Secretary or Chair for edit permissions.
              </p>
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
              <Shield className="w-8 h-8 text-purple-300" />
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

        {/* Quick Access */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => window.location.href = '/users'}
              className="bg-gray-800 hover:bg-gray-750 p-6 rounded-xl text-left border border-gray-700 transition"
            >
              <Users className="w-8 h-8 mb-3 text-blue-400" />
              <h3 className="font-bold text-lg mb-2">View Users</h3>
              <p className="text-gray-400 text-sm">Browse all members</p>
            </button>

            <button
              onClick={() => window.location.href = '/events'}
              className="bg-gray-800 hover:bg-gray-750 p-6 rounded-xl text-left border border-gray-700 transition"
            >
              <Calendar className="w-8 h-8 mb-3 text-purple-400" />
              <h3 className="font-bold text-lg mb-2">View Events</h3>
              <p className="text-gray-400 text-sm">Browse club events</p>
            </button>

            <button
              onClick={() => window.location.href = '/permissions'}
              className="bg-gray-800 hover:bg-gray-750 p-6 rounded-xl text-left border border-gray-700 transition"
            >
              <MessageSquare className="w-8 h-8 mb-3 text-yellow-400" />
              <h3 className="font-bold text-lg mb-2">View Requests</h3>
              <p className="text-gray-400 text-sm">Monitor permissions</p>
            </button>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Recent Activities</h2>
          {recentActivities.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p>No recent activities</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold mb-1">{activity.subject}</h3>
                      <p className="text-sm text-gray-400">
                        {activity.requester?.full_name || activity.requester?.username}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      activity.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                      activity.status === 'approved' ? 'bg-green-900/50 text-green-400' :
                      'bg-red-900/50 text-red-400'
                    }`}>
                      {activity.status}
                    </span>
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
              className="bg-gray-800 hover:bg-gray-750 p-4 rounded-xl text-left border border-gray-700 transition"
            >
              <h3 className="font-bold mb-1">My Projects</h3>
              <p className="text-sm text-gray-400">View your projects</p>
            </button>
            <button
              onClick={() => window.location.href = '/tasks'}
              className="bg-gray-800 hover:bg-gray-750 p-4 rounded-xl text-left border border-gray-700 transition"
            >
              <h3 className="font-bold mb-1">My Tasks</h3>
              <p className="text-sm text-gray-400">Track assignments</p>
            </button>
            <button
              onClick={() => window.location.href = '/messages'}
              className="bg-gray-800 hover:bg-gray-750 p-4 rounded-xl text-left border border-gray-700 transition"
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

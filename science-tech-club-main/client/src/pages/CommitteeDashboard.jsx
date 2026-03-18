import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { 
  Users, Calendar, MessageSquare, Bell, CheckCircle, Award, Shield, Settings
} from 'lucide-react'
import Loading from '../components/Loading'

export default function CommitteeDashboard() {
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [events, setEvents] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [queries, setQueries] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [profileRes, eventsRes, announcementsRes, queriesRes, usersRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/events'),
        api.get('/announcements'),
        api.get('/queries'),
        api.get('/users')
      ])
      
      setProfile(profileRes.data)
      setEvents(eventsRes.data)
      setAnnouncements(announcementsRes.data)
      setQueries(queriesRes.data.filter(q => q.status === 'pending'))
      setTeamMembers(usersRes.data.filter(u => u.is_committee))
      
      // Calculate stats
      setStats({
        totalEvents: eventsRes.data.length,
        pendingEvents: eventsRes.data.filter(e => e.status === 'draft').length,
        totalQueries: queriesRes.data.length,
        pendingQueries: queriesRes.data.filter(q => q.status === 'pending').length
      })
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCommitteeRole = (post) => {
    if (!post) return null
    
    const roles = {
      'Chair': { power: 'full', icon: '👑', color: 'from-yellow-600 to-yellow-800' },
      'Vice Chair': { power: 'view', icon: '⭐', color: 'from-yellow-500 to-yellow-700' },
      'Secretary': { power: 'full', icon: '📋', color: 'from-blue-600 to-blue-800' },
      'Vice Secretary': { power: 'view', icon: '📝', color: 'from-blue-500 to-blue-700' },
      'Executive Head': { power: 'events', icon: '🎯', color: 'from-purple-600 to-purple-800' },
      'Executive Member': { power: 'tasks', icon: '⚡', color: 'from-purple-500 to-purple-700' },
      'Representative Head': { power: 'queries', icon: '💬', color: 'from-green-600 to-green-800' },
      'Representative Member': { power: 'support', icon: '🤝', color: 'from-green-500 to-green-700' },
      'Developer': { power: 'tech', icon: '💻', color: 'from-indigo-600 to-indigo-800' }
    }
    
    // Check for department heads
    if (post.includes('Head')) {
      return { power: 'dept', icon: '🏢', color: 'from-orange-600 to-orange-800' }
    }
    
    return roles[post] || { power: 'member', icon: '👤', color: 'from-gray-600 to-gray-800' }
  }

  const canCreateEvent = () => {
    const post = profile?.committee_post
    return post === 'Executive Head' || post === 'Chair' || post === 'Secretary' || profile?.role === 'admin'
  }

  const canManageAnnouncements = () => {
    const post = profile?.committee_post
    return post?.includes('Representative') || post === 'Chair' || post === 'Secretary' || profile?.role === 'admin'
  }

  const canPromoteMembers = () => {
    const post = profile?.committee_post
    return post === 'Executive Head' || post === 'Representative Head' || post === 'Chair' || profile?.role === 'admin'
  }

  if (loading) return <Loading />

  const roleInfo = getCommitteeRole(profile?.committee_post)

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${roleInfo.color} mb-4`}>
            <span className="text-2xl mr-2">{roleInfo.icon}</span>
            <span className="font-semibold">{profile?.committee_post}</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome, {profile?.username}!
          </h1>
          <p className="text-gray-400">
            Committee Member • {profile?.department}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-xl">
            <Calendar className="w-8 h-8 mb-4" />
            <h3 className="text-2xl font-bold">{stats?.totalEvents || 0}</h3>
            <p className="text-blue-100">Total Events</p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-xl">
            <Bell className="w-8 h-8 mb-4" />
            <h3 className="text-2xl font-bold">{announcements.length || 0}</h3>
            <p className="text-green-100">Announcements</p>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-xl">
            <MessageSquare className="w-8 h-8 mb-4" />
            <h3 className="text-2xl font-bold">{stats?.pendingQueries || 0}</h3>
            <p className="text-purple-100">Pending Queries</p>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-orange-800 p-6 rounded-xl">
            <Users className="w-8 h-8 mb-4" />
            <h3 className="text-2xl font-bold">{teamMembers.length || 0}</h3>
            <p className="text-orange-100">Team Members</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {canCreateEvent() && (
                  <Link
                    to="/events/create"
                    className="flex flex-col items-center gap-3 p-4 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg transition"
                  >
                    <Calendar className="w-8 h-8" />
                    <span className="text-sm text-center">Create Event</span>
                  </Link>
                )}

                {canManageAnnouncements() && (
                  <Link
                    to="/announcements/create"
                    className="flex flex-col items-center gap-3 p-4 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg transition"
                  >
                    <Bell className="w-8 h-8" />
                    <span className="text-sm text-center">Post Announcement</span>
                  </Link>
                )}

                <Link
                  to="/committee/chat"
                  className="flex flex-col items-center gap-3 p-4 bg-gray-800 hover:bg-gray-750 rounded-lg transition"
                >
                  <MessageSquare className="w-8 h-8 text-blue-400" />
                  <span className="text-sm text-center">Committee Chat</span>
                </Link>

                <Link
                  to="/committee/team"
                  className="flex flex-col items-center gap-3 p-4 bg-gray-800 hover:bg-gray-750 rounded-lg transition"
                >
                  <Users className="w-8 h-8 text-orange-400" />
                  <span className="text-sm text-center">View Team</span>
                </Link>

                {(profile?.committee_post?.includes('Representative') || profile?.role === 'admin') && (
                  <Link
                    to="/queries"
                    className="flex flex-col items-center gap-3 p-4 bg-gray-800 hover:bg-gray-750 rounded-lg transition"
                  >
                    <MessageSquare className="w-8 h-8 text-purple-400" />
                    <span className="text-sm text-center">Manage Queries</span>
                  </Link>
                )}

                {profile?.committee_post === 'Developer' && (
                  <Link
                    to="/developer"
                    className="flex flex-col items-center gap-3 p-4 bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-lg transition"
                  >
                    <Settings className="w-8 h-8" />
                    <span className="text-sm text-center">Dev Panel</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Events Section */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Events</h2>
                {canCreateEvent() && (
                  <Link to="/events/create" className="text-blue-400 hover:text-blue-300 text-sm">
                    + Create New Event
                  </Link>
                )}
              </div>
              
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                  <p className="text-gray-500">No events yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.slice(0, 5).map(event => (
                    <div key={event.id} className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{event.title}</h3>
                          <p className="text-sm text-gray-400 mt-1">{event.description}</p>
                          <div className="flex items-center gap-3 mt-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              event.status === 'approved' ? 'bg-green-600' :
                              event.status === 'draft' ? 'bg-yellow-600' :
                              event.status === 'ongoing' ? 'bg-blue-600' :
                              'bg-gray-600'
                            }`}>
                              {event.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(event.event_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Link
                          to={`/events/${event.id}`}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Queries (for Representatives) */}
            {profile?.committee_post?.includes('Representative') && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Pending Queries ({queries.length})</h2>
                
                {queries.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                    <p className="text-gray-500">All queries resolved!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {queries.slice(0, 5).map(query => (
                      <div key={query.id} className="bg-gray-800 p-4 rounded-lg">
                        <p className="text-sm">{query.query}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <Link
                            to={`/queries/${query.id}`}
                            className="bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded text-sm transition"
                          >
                            Respond
                          </Link>
                          <span className="text-xs text-gray-500">
                            {new Date(query.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Permissions Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-bold">Your Permissions</h2>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Create Events</span>
                  <span className={canCreateEvent() ? "text-green-400" : "text-red-400"}>
                    {canCreateEvent() ? "✓" : "✗"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Manage Announcements</span>
                  <span className={canManageAnnouncements() ? "text-green-400" : "text-red-400"}>
                    {canManageAnnouncements() ? "✓" : "✗"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Promote Members</span>
                  <span className={canPromoteMembers() ? "text-green-400" : "text-red-400"}>
                    {canPromoteMembers() ? "✓" : "✗"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Committee Chat</span>
                  <span className="text-green-400">✓</span>
                </div>
              </div>
            </div>

            {/* Recent Announcements */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-bold">Recent Announcements</h2>
              </div>
              
              {announcements.length === 0 ? (
                <p className="text-gray-500 text-sm">No announcements yet.</p>
              ) : (
                <div className="space-y-4">
                  {announcements.slice(0, 3).map(announcement => (
                    <div key={announcement.id} className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="font-semibold text-sm">{announcement.title}</h3>
                      <p className="text-xs text-gray-400 mt-2 line-clamp-2">{announcement.content}</p>
                      <span className="text-xs text-gray-600 mt-2 block">
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Team Members Preview */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Committee Team</h2>
                <Link to="/committee/team" className="text-blue-400 hover:text-blue-300 text-sm">
                  View All →
                </Link>
              </div>
              
              <div className="space-y-2">
                {teamMembers.slice(0, 5).map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold">
                      {member.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.username}</p>
                      <p className="text-xs text-gray-500 truncate">{member.committee_post}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

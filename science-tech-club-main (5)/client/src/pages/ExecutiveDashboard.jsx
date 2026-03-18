import { useState, useEffect } from 'react'
import { Calendar, Plus, Edit2, Trash2, Image, FileText, Users, CheckCircle } from 'lucide-react'
import api from '../services/api'

export default function ExecutiveDashboard() {
  const [events, setEvents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    poster_url: '',
    banner_url: '',
    report_url: ''
  })

  const user = JSON.parse(localStorage.getItem('user'))
  const isHead = user.committee_role === 'executive' || user.committee_role === 'chair'

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const data = await api.get('/events')
      setEvents(data || [])
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingEvent) {
        await api.put(`/events/${editingEvent.id}`, formData)
        alert('✅ Event updated!')
      } else {
        await api.post('/events', formData)
        alert('✅ Event created!')
      }

      setShowModal(false)
      setEditingEvent(null)
      setFormData({
        title: '',
        description: '',
        event_date: '',
        location: '',
        poster_url: '',
        banner_url: '',
        report_url: ''
      })
      fetchEvents()
    } catch (error) {
      alert('Failed to save event: ' + (error.response?.data?.message || 'Unknown error'))
    }
  }

  const handleEdit = (event) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: event.event_date || '',
      location: event.location || '',
      poster_url: event.poster_url || '',
      banner_url: event.banner_url || '',
      report_url: event.report_url || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return

    try {
      await api.delete(`/events/${id}`)
      alert('Event deleted')
      fetchEvents()
    } catch (error) {
      alert('Failed to delete event')
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/events/${id}`, { status })
      alert('Status updated')
      fetchEvents()
    } catch (error) {
      alert('Failed to update status')
    }
  }

  const promoteToExecutive = async (userId) => {
    if (!isHead) {
      alert('Only Executive Head or Chair can promote members')
      return
    }

    try {
      await api.put(`/users/${userId}`, {
        is_committee: true,
        committee_role: 'executive'
      })
      alert('✅ User promoted to Executive!')
    } catch (error) {
      alert('Failed to promote user')
    }
  }

  const upcomingEvents = events.filter(e => e.status === 'upcoming')
  const ongoingEvents = events.filter(e => e.status === 'ongoing')
  const completedEvents = events.filter(e => e.status === 'completed')

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Executive Dashboard</h1>
              <p className="text-gray-400">
                {isHead ? '🎖️ Executive Head' : 'Executive Member'} - Event Management
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingEvent(null)
              setFormData({
                title: '',
                description: '',
                event_date: '',
                location: '',
                poster_url: '',
                banner_url: '',
                report_url: ''
              })
              setShowModal(true)
            }}
            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 px-6 py-3 rounded-lg font-medium"
          >
            <Plus className="w-5 h-5" />
            Create Event
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 border border-blue-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-blue-300" />
              <span className="text-3xl font-bold">{upcomingEvents.length}</span>
            </div>
            <h3 className="text-blue-200 font-medium">Upcoming Events</h3>
          </div>

          <div className="bg-gradient-to-br from-yellow-900 to-yellow-800 border border-yellow-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-yellow-300" />
              <span className="text-3xl font-bold">{ongoingEvents.length}</span>
            </div>
            <h3 className="text-yellow-200 font-medium">Ongoing Events</h3>
          </div>

          <div className="bg-gradient-to-br from-green-900 to-green-800 border border-green-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-300" />
              <span className="text-3xl font-bold">{completedEvents.length}</span>
            </div>
            <h3 className="text-green-200 font-medium">Completed Events</h3>
          </div>
        </div>

        {/* Events List */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">All Events</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p>No events created yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{event.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          event.status === 'upcoming' ? 'bg-blue-900/50 text-blue-400' :
                          event.status === 'ongoing' ? 'bg-yellow-900/50 text-yellow-400' :
                          event.status === 'completed' ? 'bg-green-900/50 text-green-400' :
                          'bg-red-900/50 text-red-400'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                      
                      {event.description && (
                        <p className="text-gray-400 mb-3">{event.description}</p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        {event.event_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(event.event_date).toLocaleDateString()}
                          </span>
                        )}
                        {event.location && (
                          <span>📍 {event.location}</span>
                        )}
                      </div>

                      {/* Assets */}
                      <div className="flex flex-wrap gap-3 mt-4">
                        {event.poster_url && (
                          <a
                            href={event.poster_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 bg-purple-900/50 text-purple-400 px-3 py-1 rounded-lg text-sm hover:bg-purple-800/50"
                          >
                            <Image className="w-4 h-4" />
                            Poster
                          </a>
                        )}
                        {event.banner_url && (
                          <a
                            href={event.banner_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 bg-blue-900/50 text-blue-400 px-3 py-1 rounded-lg text-sm hover:bg-blue-800/50"
                          >
                            <Image className="w-4 h-4" />
                            Banner
                          </a>
                        )}
                        {event.report_url && (
                          <a
                            href={event.report_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 bg-green-900/50 text-green-400 px-3 py-1 rounded-lg text-sm hover:bg-green-800/50"
                          >
                            <FileText className="w-4 h-4" />
                            Report
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(event)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Status Change */}
                  <div className="flex gap-2 pt-4 border-t border-gray-700">
                    <button
                      onClick={() => handleStatusChange(event.id, 'upcoming')}
                      disabled={event.status === 'upcoming'}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm"
                    >
                      Mark Upcoming
                    </button>
                    <button
                      onClick={() => handleStatusChange(event.id, 'ongoing')}
                      disabled={event.status === 'ongoing'}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm"
                    >
                      Mark Ongoing
                    </button>
                    <button
                      onClick={() => handleStatusChange(event.id, 'completed')}
                      disabled={event.status === 'completed'}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm"
                    >
                      Mark Completed
                    </button>
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Event Date</label>
                  <input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Event venue"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Poster URL</label>
                <input
                  type="url"
                  value={formData.poster_url}
                  onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Banner URL</label>
                <input
                  type="url"
                  value={formData.banner_url}
                  onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Report URL</label>
                <input
                  type="url"
                  value={formData.report_url}
                  onChange={(e) => setFormData({ ...formData, report_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-pink-600 hover:bg-pink-700 py-3 rounded-lg font-medium"
                >
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

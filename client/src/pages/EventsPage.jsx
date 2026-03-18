import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users, Plus } from 'lucide-react'
import api from '../services/api'

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const user = JSON.parse(localStorage.getItem('user'))

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const data = await api.get('/events')
      setEvents(data)
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-20 px-4 flex items-center justify-center">
        <div className="text-white">Loading events...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-20 px-4 pb-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">Events</h1>
            <p className="text-gray-400">Upcoming tech events and workshops</p>
          </div>
          {user?.is_committee && (
            <Link to="/events/create" className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg flex items-center gap-2 transition">
              <Plus className="w-5 h-5" />
              Create Event
            </Link>
          )}
        </div>

        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">No upcoming events</p>
          </div>
        )}
      </div>
    </div>
  )
}

function EventCard({ event }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-600 transition">
      <div className="flex items-start justify-between mb-4">
        <Calendar className="w-8 h-8 text-blue-500" />
        <span className="text-xs bg-blue-600 px-3 py-1 rounded-full">{event.event_type}</span>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
      <p className="text-gray-400 text-sm mb-4">{event.description}</p>
      <div className="space-y-2 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {new Date(event.event_date).toLocaleDateString()}
        </div>
        {event.location && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {event.location}
          </div>
        )}
        {event.max_participants && (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Max {event.max_participants} participants
          </div>
        )}
      </div>
    </div>
  )
}

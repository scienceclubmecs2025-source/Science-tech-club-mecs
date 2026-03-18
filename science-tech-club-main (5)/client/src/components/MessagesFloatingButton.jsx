import { useState, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function MessagesFloatingButton() {
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchUnreadCount()
    
    // Poll for new messages every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const data = await api.get('/messages/unread-count')
      setUnreadCount(data.count || 0)
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }

  return (
    <button
      onClick={() => navigate('/messages')}
      className="fixed bottom-44 right-6 z-40 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 group"
      title="Messages"
    >
      <MessageCircle className="w-6 h-6 text-white" />
      
      {/* Only show badge if there are unread messages */}
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold px-1.5 animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
      
      {/* Tooltip */}
      <span className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none">
        Messages {unreadCount > 0 && `(${unreadCount} unread)`}
      </span>
    </button>
  )
}

import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import socket from '../services/socket'
import { Send, Trash2 } from 'lucide-react'

export default function Chat() {
  const { user } = useAuthStore()
  const [room, setRoom] = useState('general')
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    socket.connect()
    socket.emit('join-room', room)
    fetchMessages()

    socket.on('new-message', (message) => {
      setMessages((prev) => [...prev, message])
    })

    socket.on('message-deleted', (messageId) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
    })

    return () => {
      socket.emit('leave-room', room)
      socket.off('new-message')
      socket.off('message-deleted')
    }
  }, [room])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const data = await api.get(`/chat/${room}`)
      setMessages(data)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      await api.post('/chat', { room, message: newMessage })
      setNewMessage('')
    } catch (error) {
      alert('Failed to send message')
    }
  }

  const handleDeleteMessage = async (messageId) => {
    try {
      await api.delete(`/chat/${messageId}`)
    } catch (error) {
      alert('Failed to delete message')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="bg-black p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Chat Room: {room}</h2>
            <select
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-slate-600 rounded-lg text-white"
            >
              <option value="general">General</option>
              <option value="technical">Technical</option>
              <option value="projects">Projects</option>
              <option value="events">Events</option>
            </select>
          </div>
        </div>

        <div className="h-full overflow-y-auto p-6 space-y-4" style={{ maxHeight: 'calc(100% - 140px)' }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.user_id === user.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md px-4 py-3 rounded-lg ${
                  msg.user_id === user.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{msg.username}</span>
                  {(user.id === msg.user_id || user.role === 'admin') && (
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="ml-2 p-1 hover:bg-red-500 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-sm break-words">{msg.message}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-800">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 bg-gray-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

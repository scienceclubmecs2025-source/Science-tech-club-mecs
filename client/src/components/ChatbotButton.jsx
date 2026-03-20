import { useState } from 'react'
import { X, Send, Loader2, Sparkles } from 'lucide-react'
import api from '../services/api'

export default function ChatbotButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I\'m ST Club Assistant. Ask me anything!' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const botAvatar = "https://i.ibb.co/jPY2Q8zn/bot.png"

  const handleSend = async (e) => {
    e?.preventDefault()
    const userMessage = input.trim()
    if (!userMessage || loading) return

    setMessages(prev => [...prev, { role: 'user', text: userMessage }])
    setInput('')
    setLoading(true)

    try {
      const res = await api.post('/chatbot', { message: userMessage })
      setMessages(prev => [...prev, {
        role: 'bot',
        text: res.reply || 'How else can I help you?'
      }])
    } catch (error) {
      console.error('Chatbot error:', error)
      setMessages(prev => [...prev, {
        role: 'bot',
        text: 'Sorry, I encountered an error. Please try again or contact scienceclubmecs@gmail.com'
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white w-14 h-14 rounded-full shadow-2xl transition-all transform hover:scale-110 z-50 flex items-center justify-center group"
        aria-label="Open ST Club Assistant"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <img src={botAvatar} alt="ST Club Assistant" className="w-10 h-10 rounded-full" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black animate-pulse"></span>
          </>
        )}
        {!isOpen && (
          <span className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none">
            ST Club Assistant
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-teal-600 p-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={botAvatar} alt="Bot" className="w-10 h-10 rounded-full border-2 border-white" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-green-600"></span>
                </div>
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    ST Club Assistant <Sparkles className="w-4 h-4" />
                  </h3>
                  <p className="text-xs text-green-100">
                    {loading ? 'Typing...' : 'Online • S&T Guide'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 p-1.5 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'bot' && (
                  <img src={botAvatar} alt="Bot" className="w-8 h-8 rounded-full flex-shrink-0" />
                )}
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-semibold">
                      {JSON.parse(localStorage.getItem('user'))?.username?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <div className={`max-w-[75%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <img src={botAvatar} alt="Bot" className="w-8 h-8 rounded-full" />
                <div className="bg-gray-800 border border-gray-700 p-3 rounded-2xl rounded-bl-none">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-gray-800 bg-gray-900 rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed p-2 rounded-lg transition flex items-center justify-center min-w-[40px]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">S&T Club Guide + Gemini AI</p>
          </form>
        </div>
      )}
    </>
  )
}

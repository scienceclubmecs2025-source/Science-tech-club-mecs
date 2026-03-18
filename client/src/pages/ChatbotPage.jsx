import { useState } from 'react'
import api from '../services/api'
import { MessageCircle, Send, Loader2 } from 'lucide-react'

export default function Chatbot() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAsk = async (e) => {
    e.preventDefault()
    if (!question.trim()) return
    setLoading(true)
    setError('')
    setAnswer('')

    try {
      const res = await api.post('/chatbot', { message: question })
      setAnswer(res.data.reply || 'No answer returned.')
    } catch (err) {
      setError(err.response?.data?.message || 'Chatbot request failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl border border-neutral-800 rounded-2xl bg-neutral-950/70 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 via-cyan-400 to-purple-500 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Science & Tech Club Chatbot</h1>
            <p className="text-xs text-neutral-400">
              Ask about club events, courses, or general tech questions.
            </p>
          </div>
        </div>

        <form onSubmit={handleAsk} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 rounded-xl bg-black border border-neutral-800 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-white text-black px-3 py-2 text-sm font-medium hover:bg-neutral-200 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-3 text-xs text-red-400 bg-red-500/10 border border-red-500/40 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {answer && (
          <div className="mt-3 text-sm text-neutral-200 border border-neutral-800 rounded-xl bg-black px-3 py-3 whitespace-pre-wrap">
            {answer}
          </div>
        )}
      </div>
    </div>
  )
}

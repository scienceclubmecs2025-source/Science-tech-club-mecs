import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, KeyRound, Send } from 'lucide-react'
import api from '../services/api'

export default function RequestPasswordPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', reason: '' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/requests/password', form)
      setSubmitted(true)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit request')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-purple-500/20 border border-purple-500/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Request Sent!</h2>
          <p className="text-gray-400 mb-6">
            Your password reset request has been sent. Admin/Chair will reset your password and you'll receive it via email.
          </p>
          <button onClick={() => navigate('/login')} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-medium transition">
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition">
          <ArrowLeft className="w-5 h-5" /> Back to Login
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-purple-600/20 border border-purple-600/40 rounded-xl flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Forgot Password</h1>
            <p className="text-gray-400 text-sm">Admin or Chair will reset your password</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div>
            <label className="block text-gray-300 text-sm mb-1">Username *</label>
            <input required value={form.username} onChange={e => setForm({...form, username: e.target.value})}
              className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm"
              placeholder="Your username" />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-1">Registered Email *</label>
            <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm"
              placeholder="your@email.com" />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-1">Reason (optional)</label>
            <textarea rows={3} value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}
              className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm resize-none"
              placeholder="Why do you need a password reset?" />
          </div>
          <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400">
            💡 Your new password will be: <span className="text-purple-400 font-mono">UniqueID@GuardianPhone</span>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition">
            <Send className="w-4 h-4" />
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  )
}

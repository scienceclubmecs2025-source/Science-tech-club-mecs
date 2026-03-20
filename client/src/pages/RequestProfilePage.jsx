import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, UserPlus, Send } from 'lucide-react'
import api from '../services/api'

export default function RequestProfilePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '', email: '', roll_number: '',
    department: '', year: '', phone: '',
    guardian_phone: '', reason: ''
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/requests/profile', form)
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
          <div className="w-16 h-16 bg-green-500/20 border border-green-500/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Request Submitted!</h2>
          <p className="text-gray-400 mb-6">
            Your profile request has been sent to the admin. You'll receive an email once it's approved.
          </p>
          <button onClick={() => navigate('/login')} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-medium transition">
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-8 px-4 pb-12">
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition">
          <ArrowLeft className="w-5 h-5" /> Back to Login
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600/20 border border-blue-600/40 rounded-xl flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Request Profile</h1>
            <p className="text-gray-400 text-sm">Fill all details — admin will review and create your account</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-gray-300 text-sm mb-1">Full Name *</label>
              <input required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                placeholder="Your full name" />
            </div>
            <div className="col-span-2">
              <label className="block text-gray-300 text-sm mb-1">Email *</label>
              <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-1">Roll Number</label>
              <input value={form.roll_number} onChange={e => setForm({...form, roll_number: e.target.value})}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                placeholder="e.g. 22A91A0501" />
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-1">Year</label>
              <select value={form.year} onChange={e => setForm({...form, year: e.target.value})}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm">
                <option value="">Select year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-gray-300 text-sm mb-1">Department</label>
              <input value={form.department} onChange={e => setForm({...form, department: e.target.value})}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                placeholder="e.g. CSE, ECE, EEE" />
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                placeholder="Your phone number" />
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-1">Father/Guardian Phone</label>
              <input value={form.guardian_phone} onChange={e => setForm({...form, guardian_phone: e.target.value})}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
                placeholder="Guardian phone" />
            </div>
            <div className="col-span-2">
              <label className="block text-gray-300 text-sm mb-1">Reason for joining</label>
              <textarea rows={3} value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}
                className="w-full px-3 py-2.5 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm resize-none"
                placeholder="Why do you want to join the club?" />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition mt-2">
            <Send className="w-4 h-4" />
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  )
}

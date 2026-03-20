import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogIn, User, Lock, Home, UserPlus, KeyRound } from 'lucide-react'
import api from '../services/api'

export default function Login({ setUser }) {
  const navigate = useNavigate()
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await api.post('/auth/login', credentials)
      const token = response.token
      const user = response.user
      if (!token || !user) throw new Error('Invalid response from server')
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      navigate('/dashboard')
    } catch (error) {
      alert(error.response?.data?.message || error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">S</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Science & Tech Club</h1>
          <p className="text-gray-400 mt-1">MECS — Member Portal</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-4">
          <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Username"
                required
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                placeholder="Password"
                required
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition"
            >
              <LogIn className="w-5 h-5" />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Request Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Link
            to="/request-profile"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 border border-gray-700 hover:border-blue-500 rounded-xl text-gray-300 hover:text-white text-sm font-medium transition"
          >
            <UserPlus className="w-4 h-4 text-blue-400" />
            Request Profile
          </Link>
          <Link
            to="/request-password"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 border border-gray-700 hover:border-purple-500 rounded-xl text-gray-300 hover:text-white text-sm font-medium transition"
          >
            <KeyRound className="w-4 h-4 text-purple-400" />
            Forgot Password
          </Link>
        </div>

        {/* Home */}
        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mx-auto transition text-sm"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">Science & Tech Club, MECS</p>
      </div>
    </div>
  )
}

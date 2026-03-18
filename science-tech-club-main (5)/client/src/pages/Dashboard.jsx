import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import { BookOpen, Users, MessageCircle, TrendingUp } from 'lucide-react'
import Loading from '../components/Loading'

export default function Dashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      if (user.role === 'admin') {
        const data = await api.get('/admin/dashboard')
        setStats(data)
      } else {
        const data = await api.get('/courses')
        setStats({ totalCourses: data.length })
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user.username}!</h1>
        <p className="text-gray-400">Here's what's happening with your club</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {user.role === 'admin' && (
          <>
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</h3>
              <p className="text-gray-400">Total Users</p>
            </div>

            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <BookOpen className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">{stats?.totalCourses || 0}</h3>
              <p className="text-gray-400">Total Courses</p>
            </div>
          </>
        )}

        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <BookOpen className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">{stats?.totalCourses || 0}</h3>
          <p className="text-gray-400">Available Courses</p>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <MessageCircle className="w-8 h-8 text-yellow-400" />
          </div>
          <h3 className="text-2xl font-bold text-white">Active</h3>
          <p className="text-gray-400">Chat Rooms</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Link to="/courses" className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-xl hover:scale-105 transition transform">
          <BookOpen className="w-12 h-12 text-white mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Browse Courses</h2>
          <p className="text-blue-100">Explore our video courses and start learning</p>
        </Link>

        <Link to="/chat" className="bg-gradient-to-br from-purple-600 to-purple-800 p-8 rounded-xl hover:scale-105 transition transform">
          <MessageCircle className="w-12 h-12 text-white mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Join Chat</h2>
          <p className="text-purple-100">Connect with committee members and peers</p>
        </Link>
      </div>
    </div>
  )
}

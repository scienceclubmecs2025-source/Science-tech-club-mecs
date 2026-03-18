import { useState, useEffect } from 'react'
import { Users, TrendingUp, BookOpen, Eye, AlertCircle } from 'lucide-react'
import api from '../services/api'

export default function DeptViceHeadDashboard() {
  const [students, setStudents] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const user = JSON.parse(localStorage.getItem('user'))
  const department = user.managed_department

  useEffect(() => {
    if (department) {
      fetchDepartmentData()
    }
  }, [department])

  const fetchDepartmentData = async () => {
    setLoading(true)
    try {
      const [studentsRes, statsRes] = await Promise.all([
        api.get(`/departments/${department}/students`),
        api.get(`/departments/${department}/stats`)
      ])

      setStudents(studentsRes.data || [])
      setStats(statsRes.data || null)
    } catch (error) {
      console.error('Failed to fetch department data:', error)
    } finally {
      setLoading(false)
    }
  }

  const yearBreakdown = stats?.year_breakdown || {}
  const years = Object.keys(yearBreakdown).sort()

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">{department} Department</h1>
              <p className="text-gray-400">Department Vice Head - View Only Access</p>
            </div>
          </div>

          {/* View Only Notice */}
          <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4 flex items-start gap-3">
            <Eye className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-blue-400 mb-1">View-Only Access</h3>
              <p className="text-sm text-blue-200">
                You can view all department students but cannot edit their information. Contact Department Head or Chair for edit permissions.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 border border-blue-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-300" />
              <span className="text-3xl font-bold">{stats?.total_students || 0}</span>
            </div>
            <h3 className="text-blue-200 font-medium">Total Students</h3>
          </div>

          {years.slice(0, 3).map((year) => (
            <div key={year} className="bg-gradient-to-br from-purple-900 to-purple-800 border border-purple-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-purple-300" />
                <span className="text-3xl font-bold">{yearBreakdown[year]}</span>
              </div>
              <h3 className="text-purple-200 font-medium">Year {year}</h3>
            </div>
          ))}
        </div>

        {/* Students Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Department Students</h2>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg">
              <Eye className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-400 font-medium">View Only</span>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p>No students in {department} department</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4">Student</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Year</th>
                    <th className="text-left py-3 px-4">Roll Number</th>
                    <th className="text-left py-3 px-4">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {student.profile_photo_url ? (
                            <img 
                              src={student.profile_photo_url} 
                              className="w-10 h-10 rounded-full object-cover" 
                              alt=""
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold">
                              {student.full_name?.[0]?.toUpperCase() || student.username?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{student.full_name || student.username}</p>
                            <p className="text-sm text-gray-400">@{student.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-400">{student.email}</td>
                      <td className="py-3 px-4">
                        {student.year ? (
                          <span className="px-3 py-1 bg-blue-900/50 text-blue-400 rounded-full text-sm font-medium">
                            Year {student.year}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {student.roll_number || <span className="text-gray-500">-</span>}
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {new Date(student.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Year-wise Breakdown */}
        {Object.keys(yearBreakdown).length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6">Year-wise Distribution</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {years.map((year) => (
                <div key={year} className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {yearBreakdown[year]}
                  </div>
                  <div className="text-sm text-gray-400">Year {year}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {((yearBreakdown[year] / stats.total_students) * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Department Head */}
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-yellow-400 text-lg mb-2">Need to Edit Student Information?</h3>
              <p className="text-yellow-200 text-sm mb-3">
                As Vice Head, you have view-only access. To edit student details, please contact:
              </p>
              <ul className="text-sm text-yellow-100 space-y-1 list-disc list-inside">
                <li>Department Head of {department}</li>
                <li>Club Chair</li>
                <li>Club Secretary</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Student Features */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-6">My Activities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => window.location.href = '/projects'}
              className="bg-gray-800 hover:bg-gray-750 p-4 rounded-xl text-left border border-gray-700 transition"
            >
              <h3 className="font-bold mb-1">My Projects</h3>
              <p className="text-sm text-gray-400">View your projects</p>
            </button>
            <button
              onClick={() => window.location.href = '/tasks'}
              className="bg-gray-800 hover:bg-gray-750 p-4 rounded-xl text-left border border-gray-700 transition"
            >
              <h3 className="font-bold mb-1">My Tasks</h3>
              <p className="text-sm text-gray-400">Track assignments</p>
            </button>
            <button
              onClick={() => window.location.href = '/messages'}
              className="bg-gray-800 hover:bg-gray-750 p-4 rounded-xl text-left border border-gray-700 transition"
            >
              <h3 className="font-bold mb-1">Messages</h3>
              <p className="text-sm text-gray-400">Team chat</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Users, TrendingUp, BookOpen, Edit2, Eye } from 'lucide-react'
import api from '../services/api'

export default function DeptHeadDashboard() {
  const [students, setStudents] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingStudent, setEditingStudent] = useState(null)
  const [formData, setFormData] = useState({ year: '', roll_number: '' })

  const user = JSON.parse(localStorage.getItem('user'))
  const department = user.managed_department
  const canEdit = user.committee_role === 'dept_head' || user.committee_role === 'chair'

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

  const handleUpdateStudent = async (studentId) => {
    try {
      await api.put(`/departments/${department}/students/${studentId}`, formData)
      alert('✅ Student updated!')
      setEditingStudent(null)
      setFormData({ year: '', roll_number: '' })
      fetchDepartmentData()
    } catch (error) {
      alert('Failed to update student')
    }
  }

  const startEdit = (student) => {
    setEditingStudent(student)
    setFormData({
      year: student.year || '',
      roll_number: student.roll_number || ''
    })
  }

  const yearBreakdown = stats?.year_breakdown || {}
  const years = Object.keys(yearBreakdown).sort()

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">{department} Department</h1>
              <p className="text-gray-400">
                {canEdit ? '🎖️ Department Head' : 'Department Vice Head'} - Student Management
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

          {years.map((year) => (
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
          <h2 className="text-2xl font-bold mb-6">Department Students</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            </div>
          ) : students.length === 0 ? (
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
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b border-gray-800 hover:bg-gray-800">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {student.profile_photo_url ? (
                            <img 
                              src={student.profile_photo_url} 
                              className="w-10 h-10 rounded-full object-cover" 
                              alt=""
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
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
                        {editingStudent?.id === student.id && canEdit ? (
                          <input
                            type="number"
                            value={formData.year}
                            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                            className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded"
                            min="1"
                            max="4"
                          />
                        ) : (
                          <span className="text-gray-300">{student.year || '-'}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingStudent?.id === student.id && canEdit ? (
                          <input
                            type="text"
                            value={formData.roll_number}
                            onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                            className="w-32 px-2 py-1 bg-gray-700 border border-gray-600 rounded"
                            placeholder="Roll No"
                          />
                        ) : (
                          <span className="text-gray-300">{student.roll_number || '-'}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {new Date(student.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {editingStudent?.id === student.id && canEdit ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateStudent(student.id)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingStudent(null)
                                setFormData({ year: '', roll_number: '' })
                              }}
                              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => canEdit ? startEdit(student) : null}
                            className={`p-2 rounded ${
                              canEdit 
                                ? 'bg-blue-600 hover:bg-blue-700' 
                                : 'bg-gray-700 cursor-default'
                            }`}
                            title={canEdit ? 'Edit student' : 'View only'}
                          >
                            {canEdit ? <Edit2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Student Features */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-6">My Activities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => window.location.href = '/projects'}
              className="bg-gray-800 hover:bg-gray-750 p-4 rounded-xl text-left border border-gray-700"
            >
              <h3 className="font-bold mb-1">My Projects</h3>
              <p className="text-sm text-gray-400">View your projects</p>
            </button>
            <button
              onClick={() => window.location.href = '/tasks'}
              className="bg-gray-800 hover:bg-gray-750 p-4 rounded-xl text-left border border-gray-700"
            >
              <h3 className="font-bold mb-1">My Tasks</h3>
              <p className="text-sm text-gray-400">Track assignments</p>
            </button>
            <button
              onClick={() => window.location.href = '/messages'}
              className="bg-gray-800 hover:bg-gray-750 p-4 rounded-xl text-left border border-gray-700"
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

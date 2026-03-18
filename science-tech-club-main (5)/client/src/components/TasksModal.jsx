import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Clock, AlertCircle, CheckCircle, User } from 'lucide-react'
import api from '../services/api'

export default function TasksModal({ isOpen, onClose }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    assigned_to: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchTasks()
    }
  }, [isOpen])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const data = await api.get('/tasks')
      setTasks(data || [])
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    setCreating(true)

    try {
      // Build task data - only include non-empty fields
      const taskData = {
        title: formData.title.trim()
      }

      // Only add optional fields if they have values
      if (formData.description && formData.description.trim()) {
        taskData.description = formData.description.trim()
      }
      
      if (formData.due_date && formData.due_date !== '') {
        taskData.due_date = formData.due_date
      }
      
      if (formData.priority) {
        taskData.priority = formData.priority
      }
      
      if (formData.assigned_to && formData.assigned_to !== '') {
        taskData.assigned_to = formData.assigned_to
      }

      console.log('📤 Creating task with data:', taskData)

      await api.post('/tasks', taskData)

      alert('✅ Task created successfully!')
      setShowCreateModal(false)
      setFormData({
        title: '',
        description: '',
        due_date: '',
        priority: 'medium',
        assigned_to: ''
      })
      fetchTasks()
    } catch (error) {
      console.error('Create task error:', error)
      alert(error.response?.data?.message || 'Failed to create task')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteTask = async (id) => {
    if (!confirm('Delete this task?')) return

    try {
      await api.delete(`/tasks/${id}`)
      alert('Task deleted successfully')
      fetchTasks()
    } catch (error) {
      console.error('Delete task error:', error)
      alert('Failed to delete task')
    }
  }

  const handleToggleStatus = async (task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed'
      await api.put(`/tasks/${task.id}`, { status: newStatus })
      fetchTasks()
    } catch (error) {
      console.error('Update task error:', error)
      alert('Failed to update task')
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Main Tasks Modal */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <h2 className="text-2xl font-bold">My Tasks</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                New Task
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Tasks List */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-gray-400">Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No tasks yet</h3>
                <p className="text-gray-400 mb-6">Create your first task to get started!</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create First Task
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`bg-gray-800 border rounded-xl p-6 hover:border-gray-700 transition ${
                      task.status === 'completed' ? 'border-green-800' : 'border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <button
                          onClick={() => handleToggleStatus(task)}
                          className={`mt-1 rounded-full p-1 transition ${
                            task.status === 'completed'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          }`}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <div className="flex-1">
                          <h3
                            className={`text-lg font-bold mb-2 ${
                              task.status === 'completed' ? 'line-through text-gray-500' : ''
                            }`}
                          >
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-gray-400 text-sm mb-3">{task.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <span
                              className={`px-3 py-1 rounded-full font-medium ${
                                task.priority === 'high'
                                  ? 'bg-red-900/50 text-red-400'
                                  : task.priority === 'medium'
                                  ? 'bg-yellow-900/50 text-yellow-400'
                                  : 'bg-blue-900/50 text-blue-400'
                              }`}
                            >
                              {task.priority}
                            </span>
                            {task.due_date && (
                              <span className="flex items-center gap-1 text-gray-400">
                                <Clock className="w-4 h-4" />
                                {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                            {task.assigned_to && (
                              <span className="flex items-center gap-1 text-gray-400">
                                <User className="w-4 h-4" />
                                Assigned
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-900/20"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Create New Task</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Task Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  placeholder="Enter task title..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white resize-vertical"
                  placeholder="Task description (optional)..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Due Date (Optional)</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                  min={new Date().toISOString().split('T')[0]}
                />
                {formData.due_date && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, due_date: '' })}
                    className="text-xs text-gray-400 hover:text-white mt-1"
                  >
                    Clear date
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-6 rounded-lg font-medium"
                >
                  {creating ? 'Creating...' : 'Create Task'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

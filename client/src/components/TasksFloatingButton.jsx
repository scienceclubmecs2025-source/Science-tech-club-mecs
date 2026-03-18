import { useState, useEffect } from 'react'
import { CheckSquare } from 'lucide-react'
import TasksModal from './TasksModal'
import api from '../services/api'

export default function TasksFloatingButton() {
  const [showModal, setShowModal] = useState(false)
  const [taskCount, setTaskCount] = useState(0)

  useEffect(() => {
    fetchTaskCount()
  }, [])

  const fetchTaskCount = async () => {
    try {
      const response = await api.get('/tasks')
      const tasks = response.data || []
      const pendingTasks = tasks.filter(task => !task.completed)
      setTaskCount(pendingTasks.length)
    } catch (error) {
      console.error('Failed to fetch task count:', error)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-6 z-40 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 group"
        title="My Tasks"
      >
        <CheckSquare className="w-6 h-6 text-white" />
        {taskCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
            {taskCount}
          </div>
        )}
        <span className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none">
          My Tasks {taskCount > 0 && `(${taskCount})`}
        </span>
      </button>

      <TasksModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          fetchTaskCount()
        }}
      />
    </>
  )
}

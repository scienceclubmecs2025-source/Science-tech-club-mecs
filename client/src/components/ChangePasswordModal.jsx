import { useState } from 'react'
import { X, Lock, Save } from 'lucide-react'
import api from '../services/api'

export default function ChangePasswordModal({ isOpen, onClose, userId, isAdmin }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isAdmin && formData.newPassword !== formData.confirmPassword) {
      alert('New passwords do not match')
      return
    }

    if (formData.newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      if (isAdmin && userId) {
        // Admin resetting someone's password
        await api.put(`/users/${userId}/reset-password`, {
          newPassword: formData.newPassword
        })
        alert('Password reset successfully!')
      } else {
        // User changing own password
        await api.put('/users/change-password', {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
        alert('Password changed successfully!')
      }
      
      onClose()
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestReset = async () => {
    setLoading(true)
    try {
      await api.post('/users/request-password-reset', {
        reason: 'Forgot password'
      })
      alert('Password reset request submitted! Admin/Committee will process it soon.')
      onClose()
    } catch (error) {
      alert('Failed to submit request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {isAdmin ? 'Reset User Password' : 'Change Password'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Password
              </label>
              <input
                type="password"
                required
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>
            <input
              type="password"
              required
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
              placeholder="At least 6 characters"
            />
          </div>

          {!isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-600"
              />
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 py-2 rounded-lg transition"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : isAdmin ? 'Reset Password' : 'Change Password'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>

        {!isAdmin && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-sm text-gray-400 mb-3">Forgot your current password?</p>
            <button
              onClick={handleRequestReset}
              disabled={loading}
              className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 py-2 rounded-lg transition text-sm"
            >
              Request Password Reset from Admin
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

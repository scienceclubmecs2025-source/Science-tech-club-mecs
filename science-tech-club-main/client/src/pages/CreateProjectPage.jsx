import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api from '../services/api'

export default function CreateProjectPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tech_stack: '',
    status: 'active'
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/projects', formData)
      navigate('/projects')
    } catch (error) {
      console.error('Failed to create project:', error)
      alert('Failed to create project')
    }
  }

  return (
    <div className="min-h-screen bg-black pt-20 px-4 pb-12">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition">
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <h1 className="text-4xl font-bold text-white mb-8">Create New Project</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white mb-2">Project Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-600"
              placeholder="Enter project title"
            />
          </div>

          <div>
            <label className="block text-white mb-2">Description</label>
            <textarea
              required
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-600"
              placeholder="Describe your project"
            />
          </div>

          <div>
            <label className="block text-white mb-2">Tech Stack</label>
            <input
              type="text"
              value={formData.tech_stack}
              onChange={(e) => setFormData({...formData, tech_stack: e.target.value})}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-600"
              placeholder="e.g., React, Node.js, MongoDB"
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-medium transition">
            Create Project
          </button>
        </form>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, X } from 'lucide-react'
import api from '../services/api'

// ✅ Must match DB constraint exactly
const VALID_STATUSES = [
  { value: 'active',      label: 'Active — looking for members' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
  { value: 'cancelled',   label: 'Cancelled' },
  { value: 'paused',      label: 'Paused' },
]

export default function CreateProjectPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title:      '',
    description:'',
    github_url: '',
    vacancies:  0,
    status:     'active'
  })
  const [techInput, setTechInput]   = useState('')
  const [techStack, setTechStack]   = useState([])
  const [loading,   setLoading]     = useState(false)
  const [error,     setError]       = useState('')

  const addTech = () => {
    const trimmed = techInput.trim()
    if (trimmed && !techStack.includes(trimmed)) {
      setTechStack(prev => [...prev, trimmed])
    }
    setTechInput('')
  }

  const removeTech = (tech) => setTechStack(prev => prev.filter(t => t !== tech))

  const handleTechKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTech()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/projects', {
        ...formData,
        vacancies:  Number(formData.vacancies) || 0,
        tech_stack: techStack   // ✅ always a proper array
      })
      navigate('/projects')
    } catch (err) {
      console.error('Failed to create project:', err)
      setError(err?.response?.data?.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black pt-20 px-4 pb-12">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <h1 className="text-4xl font-bold text-white mb-8">Create New Project</h1>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Title */}
          <div>
            <label className="block text-white mb-2">Project Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-600"
              placeholder="Enter project title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-white mb-2">Description *</label>
            <textarea
              required
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-600"
              placeholder="Describe your project, goals, and what you're building"
            />
          </div>

          {/* Tech Stack */}
          <div>
            <label className="block text-white mb-2">Tech Stack</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={handleTechKeyDown}
                className="flex-1 px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-600"
                placeholder="Type a technology, press Enter or comma to add"
              />
              <button
                type="button"
                onClick={addTech}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {techStack.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {techStack.map(tech => (
                  <span
                    key={tech}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600/20 border border-blue-600/40 rounded-full text-blue-400 text-sm"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => removeTech(tech)}
                      className="hover:text-white transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* GitHub URL */}
          <div>
            <label className="block text-white mb-2">GitHub URL</label>
            <input
              type="url"
              value={formData.github_url}
              onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-600"
              placeholder="https://github.com/username/repo"
            />
          </div>

          {/* Vacancies */}
          <div>
            <label className="block text-white mb-2">Open Vacancies</label>
            <input
              type="number"
              min={0}
              max={50}
              value={formData.vacancies}
              onChange={(e) => setFormData({ ...formData, vacancies: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-white mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-600"
            >
              {VALID_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-lg font-medium text-white transition"
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>

        </form>
      </div>
    </div>
  )
}

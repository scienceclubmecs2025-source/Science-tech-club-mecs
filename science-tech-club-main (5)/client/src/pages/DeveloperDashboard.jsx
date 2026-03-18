import { useState, useEffect } from 'react'
import { Code, GitBranch, Upload, Eye, Save, FileCode, Trash2, AlertCircle } from 'lucide-react'
import api from '../services/api'

export default function DeveloperDashboard() {
  const [components, setComponents] = useState([])
  const [selectedComponent, setSelectedComponent] = useState(null)
  const [code, setCode] = useState('')
  const [componentName, setComponentName] = useState('')
  const [componentPath, setComponentPath] = useState('')
  const [componentType, setComponentType] = useState('component')
  const [deployments, setDeployments] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const user = JSON.parse(localStorage.getItem('user'))
  const isHead = user.committee_role === 'chair' || user.managed_department === 'CSE'

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Note: These endpoints need to be created
      const [componentsRes, deploymentsRes] = await Promise.all([
        api.get('/website/components').catch(() => ({ data: [] })),
        api.get('/website/deployments').catch(() => ({ data: [] }))
      ])

      setComponents(componentsRes.data || [])
      setDeployments(deploymentsRes.data || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveComponent = async () => {
    if (!componentName || !code) {
      alert('Component name and code required')
      return
    }

    setSaving(true)
    try {
      if (selectedComponent) {
        await api.put(`/website/components/${selectedComponent.id}`, {
          component_name: componentName,
          component_path: componentPath,
          component_code: code,
          component_type: componentType
        })
        alert('✅ Component updated!')
      } else {
        await api.post('/website/components', {
          component_name: componentName,
          component_path: componentPath,
          component_code: code,
          component_type: componentType
        })
        alert('✅ Component created!')
      }

      setComponentName('')
      setComponentPath('')
      setCode('')
      setSelectedComponent(null)
      fetchData()
    } catch (error) {
      alert('Failed to save component')
    } finally {
      setSaving(false)
    }
  }

  const handleDeploy = async () => {
    if (!confirm('Deploy changes to production?')) return

    try {
      await api.post('/website/deploy', {
        commit_message: `Deploy by ${user.username} - ${new Date().toLocaleString()}`
      })
      alert('✅ Deployment initiated! Check status in deployments.')
      fetchData()
    } catch (error) {
      alert('Deployment failed: ' + (error.response?.data?.message || 'Unknown error'))
    }
  }

  const loadComponent = (component) => {
    setSelectedComponent(component)
    setComponentName(component.component_name)
    setComponentPath(component.component_path)
    setCode(component.component_code || '')
    setComponentType(component.component_type)
  }

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
              <Code className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Developer Dashboard</h1>
              <p className="text-gray-400">
                {isHead ? '🎖️ Development Team Head' : 'Developer'}
              </p>
            </div>
          </div>

          <button
            onClick={handleDeploy}
            disabled={!isHead}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition"
            title={!isHead ? 'Only CSE Head or Chair can deploy' : 'Deploy to production'}
          >
            <Upload className="w-5 h-5" />
            Deploy to Production
          </button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Components List */}
          <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Components</h2>
              <button
                onClick={() => {
                  setSelectedComponent(null)
                  setComponentName('')
                  setComponentPath('')
                  setCode('')
                }}
                className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg"
              >
                <FileCode className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {components.map((comp) => (
                <button
                  key={comp.id}
                  onClick={() => loadComponent(comp)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    selectedComponent?.id === comp.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{comp.component_name}</span>
                    <span className="text-xs px-2 py-1 bg-gray-700 rounded">
                      {comp.component_type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-1">{comp.component_path}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Code Editor */}
          <div className="lg:col-span-3 bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6">Code Editor</h2>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Component Name</label>
                  <input
                    type="text"
                    value={componentName}
                    onChange={(e) => setComponentName(e.target.value)}
                    placeholder="e.g., Navbar"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Component Path</label>
                  <input
                    type="text"
                    value={componentPath}
                    onChange={(e) => setComponentPath(e.target.value)}
                    placeholder="e.g., /components/Navbar.jsx"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={componentType}
                  onChange={(e) => setComponentType(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="page">Page</option>
                  <option value="component">Component</option>
                  <option value="layout">Layout</option>
                  <option value="style">Style</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Code</label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Write your component code here..."
                className="w-full h-96 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                spellCheck={false}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveComponent}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 px-6 py-3 rounded-lg font-medium"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : selectedComponent ? 'Update Component' : 'Save Component'}
              </button>

              {selectedComponent && (
                <button
                  onClick={() => {
                    if (confirm('Delete this component?')) {
                      api.delete(`/website/components/${selectedComponent.id}`)
                        .then(() => {
                          alert('Component deleted')
                          setSelectedComponent(null)
                          setComponentName('')
                          setCode('')
                          fetchData()
                        })
                    }
                  }}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-medium"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete
                </button>
              )}
            </div>

            {/* Warning for non-heads */}
            {!isHead && (
              <div className="mt-6 bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-yellow-400 mb-1">Limited Access</h3>
                  <p className="text-sm text-yellow-200">
                    You can create and edit components, but only CSE Head or Chair can deploy to production.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Deployment History */}
        <div className="mt-8 bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <GitBranch className="w-6 h-6" />
            Recent Deployments
          </h2>

          {deployments.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No deployments yet</p>
          ) : (
            <div className="space-y-3">
              {deployments.slice(0, 5).map((deploy) => (
                <div key={deploy.id} className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{deploy.commit_message}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(deploy.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    deploy.status === 'success' ? 'bg-green-900/50 text-green-400' :
                    deploy.status === 'failed' ? 'bg-red-900/50 text-red-400' :
                    'bg-yellow-900/50 text-yellow-400'
                  }`}>
                    {deploy.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Student Features */}
        <div className="mt-8 bg-gray-900 border border-gray-800 rounded-2xl p-6">
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

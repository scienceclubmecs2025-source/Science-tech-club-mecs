import { useState } from 'react'
import { Code, Github, Globe, Database, Settings } from 'lucide-react'

export default function DeveloperPanel() {
  const [gitUrl] = useState('https://github.com/scienceclubmecs/science-tech-club')

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 rounded-full mb-4">
            <Code className="w-6 h-6" />
            <span className="font-bold">Developer Panel</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Site Customization & Management</h1>
          <p className="text-gray-400">Full control over the platform</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <Github className="w-8 h-8 mb-4 text-indigo-400" />
            <h3 className="text-xl font-bold">Connected</h3>
            <p className="text-gray-400 text-sm">GitHub Repository</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <Database className="w-8 h-8 mb-4 text-green-400" />
            <h3 className="text-xl font-bold">Active</h3>
            <p className="text-gray-400 text-sm">Database Status</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <Globe className="w-8 h-8 mb-4 text-blue-400" />
            <h3 className="text-xl font-bold">Live</h3>
            <p className="text-gray-400 text-sm">Deployment Status</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <Settings className="w-8 h-8 mb-4 text-purple-400" />
            <h3 className="text-xl font-bold">v2.0.0</h3>
            <p className="text-gray-400 text-sm">Current Version</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* GitHub Integration */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Github className="w-5 h-5" />
              GitHub Repository
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Repository URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={gitUrl}
                    readOnly
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                  <a
                    href={gitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
                  >
                    Open
                  </a>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-2">Latest Commit:</p>
                <p className="font-mono text-xs text-green-400">feat: Add developer panel and team management</p>
                <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
              </div>

              <button className="w-full bg-indigo-600 hover:bg-indigo-700 py-2 rounded-lg transition">
                Sync with Repository
              </button>
            </div>
          </div>

          {/* Component Customization */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Component Settings
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Theme Color</label>
                <div className="flex gap-2">
                  <button className="w-8 h-8 rounded bg-blue-600 border-2 border-white"></button>
                  <button className="w-8 h-8 rounded bg-purple-600"></button>
                  <button className="w-8 h-8 rounded bg-green-600"></button>
                  <button className="w-8 h-8 rounded bg-orange-600"></button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Layout Mode</label>
                <select className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                  <option>Dark Mode</option>
                  <option>Light Mode</option>
                  <option>Auto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Features</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Chatbot</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Real-time Chat</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Notifications</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Database Management */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database
            </h2>
            
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Connection Status</span>
                  <span className="px-2 py-1 bg-green-600 rounded text-xs">Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Supabase Project</span>
                  <span className="text-sm font-mono">science-tech-club</span>
                </div>
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg transition">
                View Database
              </button>
              
              <button className="w-full bg-yellow-600 hover:bg-yellow-700 py-2 rounded-lg transition">
                Backup Database
              </button>
            </div>
          </div>

          {/* Deployment */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Deployment
            </h2>
            
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Status</span>
                  <span className="px-2 py-1 bg-green-600 rounded text-xs">Live</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Platform</span>
                  <span className="text-sm">Render + Vercel</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Last Deploy</span>
                  <span className="text-sm">2 hours ago</span>
                </div>
              </div>

              <button className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-lg transition">
                Deploy Changes
              </button>
              
              <button className="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded-lg transition">
                View Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

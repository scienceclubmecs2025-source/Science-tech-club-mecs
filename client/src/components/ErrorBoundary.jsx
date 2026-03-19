import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('💥 Render error:', error.message, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
          <h2 className="text-2xl font-bold text-red-400">Something went wrong</h2>
          <p className="text-gray-400 text-sm max-w-md text-center">
            {this.state.error.message}
          </p>
          <button
            onClick={() => {
              this.setState({ error: null })
              window.location.reload()
            }}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Reload Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

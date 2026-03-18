import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const ThemeContext = createContext()

const DEFAULT_CONFIG = {
  theme_mode: 'dark',
  primary_color: '#3b82f6',
  logo_url: '',
  mecs_logo_url: '',
  watermark_opacity: '0.25',
  site_name: 'Science & Tech Club'
}

export function ThemeProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      // ✅ api.get() returns data directly now — no destructuring
      const response = await api.get('/config'); const data = response.data
      const merged = { ...DEFAULT_CONFIG, ...(data || {}) }
      setConfig(merged)
      applyTheme(merged)
    } catch (error) {
      console.error('Failed to fetch config:', error)
      applyTheme(DEFAULT_CONFIG) // ✅ Always apply theme even on error
    }
  }

  const applyTheme = (cfg) => {
    if (!cfg) return
    const root = document.documentElement

    if (cfg.theme_mode === 'light') {
      root.classList.remove('dark')
      root.classList.add('light')
    } else {
      root.classList.remove('light')
      root.classList.add('dark')
    }

    root.style.setProperty('--primary-color', cfg.primary_color || '#3b82f6')
    root.style.setProperty('--watermark-opacity', cfg.watermark_opacity || '0.25')

    if (cfg.logo_url) {
      root.style.setProperty('--watermark-image', `url(${cfg.logo_url})`)
    }
  }

  return (
    <ThemeContext.Provider value={{ config, refreshConfig: fetchConfig }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

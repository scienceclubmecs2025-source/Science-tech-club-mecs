import { useTheme } from './ThemeProvider'

export default function Logo({ size = 'md', showText = true, showMECS = false }) {
  const { config } = useTheme()
  
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  return (
    <div className="flex items-center gap-3">
      {/* Club Logo or MECS Logo */}
      {showMECS && config.mecs_logo_url ? (
        <img 
          src={config.mecs_logo_url} 
          alt="MECS Logo" 
          className={`${sizes[size]} rounded-lg object-contain`}
        />
      ) : config.logo_url ? (
        <img 
          src={config.logo_url} 
          alt={config.site_name} 
          className={`${sizes[size]} rounded-lg object-contain`}
        />
      ) : (
        <div className={`${sizes[size]} rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-2xl font-bold`}>
          S
        </div>
      )}
      
      {showText && (
        <div>
          <div className={`${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-lg'} font-bold text-white`}>
            {config.site_name}
          </div>
          <div className="text-xs text-gray-500">MECS</div>
        </div>
      )}
    </div>
  )
}

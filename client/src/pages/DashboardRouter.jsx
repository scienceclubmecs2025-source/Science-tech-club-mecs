import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

const POST_ROUTES = {
  'Chair':                  '/chair',
  'Vice Chair':             '/vice-chair',
  'Secretary':              '/secretary',
  'Vice Secretary':         '/vice-secretary',
  'Executive Head':         '/executive-window',
  'Executive Member':       '/executive-window',
  'Representative Head':    '/representative-window',
  'Representative Member':  '/representative-window',
  'Designing Head':         '/design-window',
  'Designing Team':         '/design-window',
  'Social Media Team':      '/social-media',
  'Developer':              '/developer',
}

// Dept heads → /committee
const DEPT_PATTERN = /(Head|Vice Head)$/

export default function DashboardRouter() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user'))

  useEffect(() => {
    if (!user?.is_committee) { navigate('/dashboard'); return }

    const post = user.committee_post || ''
    const route = POST_ROUTES[post]

    if (route) {
      navigate(route, { replace: true })
    } else if (DEPT_PATTERN.test(post)) {
      navigate('/committee', { replace: true })
    } else {
      navigate('/dashboard', { replace: true })
    }
  }, [])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

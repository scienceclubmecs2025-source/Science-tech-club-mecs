import { Navigate } from 'react-router-dom'
import StudentDashboard from '../pages/StudentDashboard'
import ChairDashboard from '../pages/ChairDashboard'
import SecretaryDashboard from '../pages/SecretaryDashboard'
import ViceChairDashboard from '../pages/ViceChairDashboard'
import ViceSecretaryDashboard from '../pages/ViceSecretaryDashboard'
import DeptHeadDashboard from '../pages/DeptHeadDashboard'
import DeptViceHeadDashboard from '../pages/DeptViceHeadDashboard'
import DeveloperDashboard from '../pages/DeveloperDashboard'
import ExecutiveDashboard from '../pages/ExecutiveDashboard'
import RepresentativeDashboard from '../pages/RepresentativeDashboard'
import AdminPanel from '../pages/AdminPanel'

export default function DashboardRouter() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  if (!user || !user.id) {
    return <Navigate to="/login" replace />
  }

  // Admin gets admin dashboard
  if (user.role === 'admin') {
    return <AdminPanel />
  }

  // Committee members get role-specific dashboards
  if (user.is_committee) {
    switch (user.committee_role) {
      case 'chair':
        return <ChairDashboard />
      case 'secretary':
        return <SecretaryDashboard />
      case 'vice_chair':
        return <ViceChairDashboard />
      case 'vice_secretary':
        return <ViceSecretaryDashboard />
      case 'dept_head':
        return <DeptHeadDashboard />
      case 'dept_vice_head':
        return <DeptViceHeadDashboard />
      case 'developer':
        return <DeveloperDashboard />
      case 'executive':
        return <ExecutiveDashboard />
      case 'representative':
        return <RepresentativeDashboard />
      default:
        return <StudentDashboard />
    }
  }

  // Regular students get student dashboard
  return <StudentDashboard />
}

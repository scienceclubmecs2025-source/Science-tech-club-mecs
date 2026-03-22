import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import StudentDashboard from './pages/StudentDashboard'
import FacultyDashboard from './pages/FacultyDashboard'
import AdminPanel from './pages/AdminPanel'
import CommitteeDashboard from './pages/CommitteeDashboard'
import CoursesPage from './pages/CoursesPage'
import ProjectsPage from './pages/ProjectsPage'
import CreateProjectPage from './pages/CreateProjectPage'
import QuizzesPage from './pages/QuizzesPage'
import TakeQuizPage from './pages/TakeQuizPage'
import EventsPage from './pages/EventsPage'
import CreateEventPage from './pages/CreateEventPage'
import TeamViewPage from './pages/TeamViewPage'
import DeveloperPanel from './pages/DeveloperPanel'
import DashboardRouter from './components/DashboardRouter'
import ProfilePage from './pages/ProfilePage'
import ChatbotButton from './components/ChatbotButton'
import { ThemeProvider } from './components/ThemeProvider'
import api from './services/api'
import TasksPage from './pages/TasksPage'
import MessagesPage from './pages/MessagesPage'
import TasksFloatingButton from './components/TasksFloatingButton'
import MyProjectsPage from './pages/MyProjectsPage'
import ChairDashboard from './pages/ChairDashboard'
import SecretaryDashboard from './pages/SecretaryDashboard'
import ViceChairDashboard from './pages/ViceChairDashboard'
import ViceSecretaryDashboard from './pages/ViceSecretaryDashboard'
import DeptHeadDashboard from './pages/DeptHeadDashboard'
import DeptViceHeadDashboard from './pages/DeptViceHeadDashboard'
import DeveloperDashboard from './pages/DeveloperDashboard'
import ExecutiveDashboard from './pages/ExecutiveDashboard'
import RepresentativeDashboard from './pages/RepresentativeDashboard'
import DesignDashboard from './pages/DesignDashboard'
import RequestProfilePage from './pages/RequestProfilePage'
import RequestPasswordPage from './pages/RequestPasswordPage'

const CLUB_LOGO = 'https://i.ibb.co/xqbbmPZw/2.jpg'
const SITE_NAME = 'Science & Tech Club'

// ── Page title map ───────────────────────────────────────────────
const PAGE_TITLES = {
  '/':                        'Home',
  '/login':                   'Login',
  '/dashboard':               'Dashboard',
  '/admin':                   'Admin Panel',
  '/faculty':                 'Faculty Dashboard',
  '/committee':               'Committee Dashboard',
  '/committee/team':          'Team View',
  '/developer':               'Developer Dashboard',
  '/profile':                 'My Profile',
  '/courses':                 'Courses',
  '/projects':                'Projects',
  '/projects/create':         'Create Project',
  '/my-projects':             'My Projects',
  '/quizzes':                 'Quizzes',
  '/events':                  'Events',
  '/events/create':           'Create Event',
  '/tasks':                   'Tasks',
  '/messages':                'Messages',
  '/request-profile':         'Request Profile',
  '/request-password':        'Request Password',
  '/executive-dashboard':     'Executive Dashboard',
  '/representative-dashboard':'Representative Dashboard',
  '/design-dashboard':        'Design Dashboard',
  '/chair-dashboard':         'Chair Dashboard',
  '/secretary-dashboard':     'Secretary Dashboard',
  '/vice-chair-dashboard':    'Vice Chair Dashboard',
  '/vice-secretary-dashboard':'Vice Secretary Dashboard',
  '/dept-head-dashboard':     'Department Head Dashboard',
  '/dept-vice-head-dashboard':'Department Vice Head Dashboard',
}

// ── Sets favicon dynamically ─────────────────────────────────────
function setFavicon(url) {
  let link = document.querySelector("link[rel~='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.href = url
}

// ── Hook: update title + favicon on every route change ──────────
function usePageMeta(location) {
  useEffect(() => {
    setFavicon(CLUB_LOGO)
    const matched = Object.keys(PAGE_TITLES).find(path =>
      location.pathname === path ||
      (path !== '/' && location.pathname.startsWith(path))
    )
    const pageLabel = matched ? PAGE_TITLES[matched] : null
    document.title = pageLabel ? `${pageLabel} | ${SITE_NAME}` : SITE_NAME
  }, [location.pathname])
}

// ── Helper: check if user's committee_post matches a set ─────────
function hasPost(user, ...posts) {
  return posts.includes(user?.committee_post)
}

function AppContent() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  usePageMeta(location)

  useEffect(() => {
    const token      = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (token && storedUser) {
      api.get('/auth/verify')
        .then((response) => {
          const userData = response?.user
          if (userData) {
            setUser(userData)
            localStorage.setItem('user', JSON.stringify(userData))
          } else {
            setUser(JSON.parse(storedUser))
          }
        })
        .catch(() => { setUser(JSON.parse(storedUser)) })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
            <img src={CLUB_LOGO} alt="Science & Tech Club" className="w-full h-full rounded-full object-cover p-1" />
          </div>
          <div className="text-white text-base font-medium tracking-wide">{SITE_NAME}</div>
          <div className="text-gray-500 text-sm">Loading...</div>
        </div>
      </div>
    )
  }

  const hideNavbar = location.pathname === '/' || location.pathname === '/login'

  // ── Guard helpers ────────────────────────────────────────────
  const PrivateRoute   = ({ element }) => user ? element : <Navigate to="/login" replace />
  const CommitteeRoute = ({ element }) => user?.is_committee ? element : <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen bg-black">
      {user && !hideNavbar && <Navbar user={user} setUser={setUser} />}

      <Routes>
        {/* ── Public ────────────────────────────────────────── */}
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Home />} />
        <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/dashboard" />} />
        <Route path="/request-profile"  element={<RequestProfilePage />} />
        <Route path="/request-password" element={<RequestPasswordPage />} />

        {/* ── Dashboard router ──────────────────────────────── */}
        <Route path="/dashboard" element={
          user ? (
            user.role === 'admin'   ? <Navigate to="/admin"   replace /> :
            user.role === 'faculty' ? <Navigate to="/faculty" replace /> :
            user.is_committee       ? <DashboardRouter />                :
            <StudentDashboard />
          ) : <Navigate to="/login" replace />
        } />

        {/* ── Admin ─────────────────────────────────────────── */}
        <Route path="/admin" element={
          user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/dashboard" replace />
        } />

        {/* ── Faculty ───────────────────────────────────────── */}
        <Route path="/faculty" element={
          user?.role === 'faculty' ? <FacultyDashboard /> : <Navigate to="/dashboard" replace />
        } />

        {/* ── Committee shared ──────────────────────────────── */}
        <Route path="/committee"      element={<CommitteeRoute element={<CommitteeDashboard />} />} />
        <Route path="/committee/team" element={<CommitteeRoute element={<TeamViewPage />} />} />

        {/* ── Role-specific committee dashboards ────────────── */}
        <Route path="/chair-dashboard" element={
          <CommitteeRoute element={
            hasPost(user, 'Chair') ? <ChairDashboard /> : <Navigate to="/dashboard" replace />
          } />
        } />
        <Route path="/vice-chair-dashboard" element={
          <CommitteeRoute element={
            hasPost(user, 'Vice Chair') ? <ViceChairDashboard /> : <Navigate to="/dashboard" replace />
          } />
        } />
        <Route path="/secretary-dashboard" element={
          <CommitteeRoute element={
            hasPost(user, 'Secretary') ? <SecretaryDashboard /> : <Navigate to="/dashboard" replace />
          } />
        } />
        <Route path="/vice-secretary-dashboard" element={
          <CommitteeRoute element={
            hasPost(user, 'Vice Secretary') ? <ViceSecretaryDashboard /> : <Navigate to="/dashboard" replace />
          } />
        } />
        <Route path="/dept-head-dashboard" element={
          <CommitteeRoute element={
            user?.committee_post?.includes('Head') && !user?.committee_post?.includes('Vice')
              ? <DeptHeadDashboard />
              : <Navigate to="/dashboard" replace />
          } />
        } />
        <Route path="/dept-vice-head-dashboard" element={
          <CommitteeRoute element={
            user?.committee_post?.includes('Vice Head')
              ? <DeptViceHeadDashboard />
              : <Navigate to="/dashboard" replace />
          } />
        } />

        {/* ── Executive ─────────────────────────────────────── */}
        <Route path="/executive-dashboard" element={
          <CommitteeRoute element={
            hasPost(user, 'Executive Head', 'Executive Member')
              ? <ExecutiveDashboard />
              : <Navigate to="/dashboard" replace />
          } />
        } />

        {/* ── Representative ────────────────────────────────── */}
        <Route path="/representative-dashboard" element={
          <CommitteeRoute element={
            hasPost(user, 'Representative Head', 'Representative Member')
              ? <RepresentativeDashboard />
              : <Navigate to="/dashboard" replace />
          } />
        } />

        {/* ── Design ────────────────────────────────────────── */}
        <Route path="/design-dashboard" element={
          <CommitteeRoute element={
            hasPost(user, 'Designing Head', 'Designing Team')
              ? <DesignDashboard />
              : <Navigate to="/dashboard" replace />
          } />
        } />

        {/* ── Developer ─────────────────────────────────────── */}
        <Route path="/developer" element={
          hasPost(user, 'Developer') || user?.committee_role === 'developer'
            ? <DeveloperDashboard />
            : <Navigate to="/dashboard" replace />
        } />

        {/* ── General protected ─────────────────────────────── */}
        <Route path="/profile"             element={<PrivateRoute element={<ProfilePage />} />} />
        <Route path="/courses"             element={<PrivateRoute element={<CoursesPage />} />} />
        <Route path="/projects"            element={<PrivateRoute element={<ProjectsPage />} />} />
        <Route path="/projects/create"     element={<PrivateRoute element={<CreateProjectPage />} />} />
        <Route path="/my-projects"         element={<PrivateRoute element={<MyProjectsPage />} />} />
        <Route path="/quizzes"             element={<PrivateRoute element={<QuizzesPage />} />} />
        <Route path="/quizzes/:id"         element={<PrivateRoute element={<TakeQuizPage />} />} />
        <Route path="/events"              element={<PrivateRoute element={<EventsPage />} />} />
        <Route path="/events/create"       element={<PrivateRoute element={<CreateEventPage />} />} />
        <Route path="/tasks"               element={<PrivateRoute element={<TasksPage />} />} />
        <Route path="/messages"            element={<PrivateRoute element={<MessagesPage />} />} />
        <Route path="/messages/:channelId" element={<PrivateRoute element={<MessagesPage />} />} />

        {/* ── Catch all ─────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {user && (
        <>
          <TasksFloatingButton />
          <ChatbotButton />
        </>
      )}
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App

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

function AppContent() {
  // ✅ Initialize from localStorage — prevents logout on reload
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (token && storedUser) {
      api.get('/auth/verify')
        .then((response) => {
          // ✅ interceptor already unwraps .data — response IS the data
          const userData = response?.user
          if (userData) {
            setUser(userData)
            localStorage.setItem('user', JSON.stringify(userData))
          } else {
            // verify returned no user but token exists
            // keep localStorage user rather than logging out
            const parsed = JSON.parse(storedUser)
            setUser(parsed)
          }
        })
        .catch(() => {
          // Only clear if token is truly invalid (401)
          // Network errors should not log out the user
          const parsed = JSON.parse(storedUser)
          setUser(parsed)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  const hideNavbar = location.pathname === '/' || location.pathname === '/login'

  return (
    <div className="min-h-screen bg-black">
      {user && !hideNavbar && <Navbar user={user} setUser={setUser} />}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Home />} />
        <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/dashboard" />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={
          user ? (
            user.role === 'admin' ? <Navigate to="/admin" replace /> :
            user.role === 'faculty' ? <Navigate to="/faculty" replace /> :
            user.is_committee ? <DashboardRouter /> :
            <StudentDashboard />
          ) : <Navigate to="/login" replace />
        } />

        {/* Admin */}
        <Route path="/admin" element={user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/dashboard" replace />} />

        {/* Faculty */}
        <Route path="/faculty" element={user?.role === 'faculty' ? <FacultyDashboard /> : <Navigate to="/dashboard" replace />} />

        {/* Committee */}
        <Route path="/committee" element={user?.is_committee ? <CommitteeDashboard /> : <Navigate to="/dashboard" replace />} />
        <Route path="/committee/team" element={user?.is_committee ? <TeamViewPage /> : <Navigate to="/dashboard" replace />} />

        {/* Developer */}
        <Route path="/developer" element={
          user?.committee_role === 'developer' || user?.committee_post === 'Developer'
            ? <DeveloperDashboard />
            : <Navigate to="/dashboard" replace />
        } />

        {/* Protected Routes */}
        <Route path="/profile"             element={user ? <ProfilePage />       : <Navigate to="/login" replace />} />
        <Route path="/courses"             element={user ? <CoursesPage />        : <Navigate to="/login" replace />} />
        <Route path="/projects"            element={user ? <ProjectsPage />       : <Navigate to="/login" replace />} />
        <Route path="/projects/create"     element={user ? <CreateProjectPage />  : <Navigate to="/login" replace />} />
        <Route path="/my-projects"         element={user ? <MyProjectsPage />     : <Navigate to="/login" replace />} />
        <Route path="/quizzes"             element={user ? <QuizzesPage />        : <Navigate to="/login" replace />} />
        <Route path="/quizzes/:id"         element={user ? <TakeQuizPage />       : <Navigate to="/login" replace />} />
        <Route path="/events"              element={user ? <EventsPage />         : <Navigate to="/login" replace />} />
        <Route path="/events/create"       element={user ? <CreateEventPage />    : <Navigate to="/login" replace />} />
        <Route path="/tasks"               element={user ? <TasksPage />          : <Navigate to="/login" replace />} />
        <Route path="/messages"            element={user ? <MessagesPage />       : <Navigate to="/login" replace />} />
        <Route path="/messages/:channelId" element={user ? <MessagesPage />       : <Navigate to="/login" replace />} />

        {/* Catch all */}
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

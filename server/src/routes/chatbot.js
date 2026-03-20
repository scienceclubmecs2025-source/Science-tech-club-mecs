const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const responses = {
  // Greetings
  greetings: {
    patterns: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon', 'howdy'],
    response: (user) => `👋 Hello ${user.username}! I'm the S&T Club assistant. How can I help you today?\n\nYou can ask me about:\n• 📅 Events\n• 🚀 Projects\n• 📚 Courses\n• 👥 Committee\n• ⚙️ Your dashboard\n• 🔐 Account help`
  },

  // Events
  events: {
    patterns: ['event', 'events', 'workshop', 'hackathon', 'seminar', 'upcoming', 'schedule'],
    response: () => `📅 **Events & Workshops**\n\nTo view events:\n1. Click **Events** in the navigation bar\n2. Browse upcoming workshops, hackathons, and seminars\n3. Click on any event to see full details\n\n**Creating Events** (Executive/Chair/Admin only):\n• Go to your dashboard\n• Click "Create Event"\n• Fill in title, date, location, and description\n\nEvents are shown on the home page calendar too! 🗓️`
  },

  // Projects
  projects: {
    patterns: ['project', 'projects', 'create project', 'join project', 'my project', 'team'],
    response: () => `🚀 **Projects**\n\nTo **browse projects**:\n• Click **Projects** in the navbar\n• Filter by domain, branch, or status\n• Click any project to see details and team members\n\nTo **create a project**:\n• Go to your Student Dashboard\n• Click "Create Project" button\n• Fill in title, description, domain, and technologies\n\nTo **join a project**:\n• Open the project page\n• Click "Request to Join"\n• Wait for the project creator to accept\n\nView your projects under **My Projects** in the navbar 📁`
  },

  // Courses
  courses: {
    patterns: ['course', 'courses', 'video', 'videos', 'learn', 'tutorial', 'lecture'],
    response: () => `📚 **Courses & Videos**\n\nTo **watch videos**:\n• Click **Courses** in the navbar\n• Browse or search for videos\n• Click any video to watch it\n\nTo **upload a video** (Faculty/Admin/Committee only):\n• Click "Add YouTube Video"\n• Paste a YouTube URL\n• Add a title and description\n\nYou can also like, dislike, and comment on videos! 💬`
  },

  // Dashboard
  dashboard: {
    patterns: ['dashboard', 'home page', 'my page', 'profile page', 'where', 'navigate', 'navigation', 'menu'],
    response: (user) => {
      const role = user.role
      const post = user.committee_post
      let dashInfo = ''

      if (role === 'admin') {
        dashInfo = '🛡️ **Admin Panel** — Manage users, events, projects, announcements, and site config'
      } else if (role === 'faculty') {
        dashInfo = '👨‍🏫 **Faculty Dashboard** — View announcements, approve projects, manage quizzes'
      } else if (post === 'Chair') {
        dashInfo = '👑 **Chair Dashboard** — Full club overview, approve requests, promote members'
      } else if (post === 'Vice Chair') {
        dashInfo = '⭐ **Vice Chair Dashboard** — Support chair, view club stats'
      } else if (post === 'Secretary' || post === 'Vice Secretary') {
        dashInfo = '📋 **Secretary Dashboard** — Manage announcements, handle queries'
      } else if (post?.includes('Executive')) {
        dashInfo = '🎯 **Executive Dashboard** — Create and manage events'
      } else if (post?.includes('Representative')) {
        dashInfo = '💬 **Representative Dashboard** — Handle student queries and permissions'
      } else if (post === 'Developer') {
        dashInfo = '💻 **Developer Dashboard** — Manage website components'
      } else if (post?.includes('Head') || post?.includes('Vice Head')) {
        dashInfo = '🏢 **Department Head Dashboard** — Manage department members and activities'
      } else {
        dashInfo = '🎓 **Student Dashboard** — View announcements, browse projects, track your activity'
      }

      return `⚙️ **Your Dashboard**\n\n${dashInfo}\n\nAccess your dashboard by clicking your name or the dashboard link in the navbar.`
    }
  },

  // Profile
  profile: {
    patterns: ['profile', 'photo', 'picture', 'avatar', 'bio', 'edit profile', 'change name', 'update profile'],
    response: () => `👤 **Profile Settings**\n\nTo **edit your profile**:\n1. Click your avatar/name in the navbar\n2. Select **My Profile**\n3. Click **Edit Profile**\n4. Update your name, bio, department, year\n5. Click **Save Changes**\n\nTo **change your photo**:\n1. Go to **My Profile**\n2. Click the 📷 camera icon on your avatar\n3. Upload a JPG, PNG, or GIF (max 5MB)\n\nYour profile photo appears across the platform! ✨`
  },

  // Messages
  messages: {
    patterns: ['message', 'messages', 'chat', 'dm', 'direct message', 'send message', 'inbox'],
    response: () => `💬 **Messages**\n\nTo **send a message**:\n1. Click **Messages** in the navbar\n2. Find a friend in your list\n3. Click their name to open chat\n4. Type and press Send\n\nTo **add a friend**:\n1. Go to Messages → Find People tab\n2. Search by name or username\n3. Click "Add Friend"\n4. Wait for them to accept\n\nYou can also join **group channels** from the Messages page! 📡`
  },

  // Committee
  committee: {
    patterns: ['committee', 'member', 'members', 'team', 'roles', 'posts', 'positions', 'who is', 'chair', 'secretary', 'executive', 'representative', 'developer'],
    response: () => `👥 **Committee Structure**\n\n**Leadership:**\n• 👑 Chair — Overall club head\n• ⭐ Vice Chair — Supports chair\n• 📋 Secretary — Club administration\n• 📝 Vice Secretary — Assists secretary\n\n**Teams:**\n• 🎯 Executive Head/Member — Event management\n• 💬 Representative Head/Member — Student queries\n• 💻 Developer — Website management\n\n**Department Heads** — One per department (CSE, ECE, EEE, etc.)\n\nView the full team on the **Home page → Meet Our Team** section 🏆`
  },

  // Announcements
  announcements: {
    patterns: ['announcement', 'announcements', 'notice', 'notification', 'news', 'update'],
    response: () => `📢 **Announcements**\n\nAnnouncements appear on your **dashboard** automatically.\n\nTo **create an announcement** (Admin/Committee only):\n1. Go to Admin Panel or your dashboard\n2. Click "Create Announcement"\n3. Write your message and select audience\n4. Click Post\n\nAnnouncements can be targeted to:\n• All members\n• Students only\n• Faculty only\n• Committee only 🎯`
  },

  // Login/Account
  account: {
    patterns: ['login', 'logout', 'password', 'forgot', 'account', 'sign in', 'credentials', 'username'],
    response: () => `🔐 **Account Help**\n\nTo **login**:\n• Use your **username** (not email) and password\n• Students: username is your roll number or assigned ID\n• Faculty: username is from your email prefix\n\nTo **logout**:\n• Click your avatar in the navbar\n• Select Logout\n\n⚠️ **Forgot password?**\nContact your admin or faculty coordinator to reset your password.\n\nFor account issues, email: **scienceclubmecs@gmail.com** 📧`
  },

  // Tasks
  tasks: {
    patterns: ['task', 'tasks', 'assignment', 'todo', 'to-do', 'deadline', 'due'],
    response: () => `✅ **Tasks**\n\nTo **view your tasks**:\n• Click **Tasks** in the navbar\n\nTo **create a task**:\n1. Click "+ New Task"\n2. Add title, description, priority, and due date\n3. Click Create\n\nTask priorities:\n• 🔴 High — Urgent\n• 🟡 Medium — Normal\n• 🟢 Low — When free\n\nMark tasks complete by clicking the checkbox ☑️`
  },

  // Admin
  admin: {
    patterns: ['admin', 'add student', 'add faculty', 'bulk upload', 'graduate', 'manage users', 'delete user'],
    response: () => `🛡️ **Admin Functions**\n\nThe Admin Panel allows you to:\n\n**User Management:**\n• Add students individually or bulk upload CSV\n• Add faculty members\n• Assign committee posts\n• Graduate students (year promotion)\n• Delete users\n\n**Content Management:**\n• Create announcements\n• Approve/manage events\n• Manage projects\n\n**Site Config:**\n• Update site name and logos\n• Change theme settings\n\nAccess via **Admin Panel** in the navbar (admin only) 🔒`
  },

  // Help/default
  help: {
    patterns: ['help', 'what can you do', 'guide', 'how', 'support', 'assist', 'confused', 'lost'],
    response: () => `🤖 **I can help you with:**\n\n• 📅 **Events** — viewing, creating, managing\n• 🚀 **Projects** — browsing, creating, joining\n• 📚 **Courses** — watching videos, uploading\n• 💬 **Messages** — chatting, adding friends\n• 👤 **Profile** — editing, photo upload\n• ⚙️ **Dashboard** — navigation guide\n• 📢 **Announcements** — viewing, creating\n• ✅ **Tasks** — creating, managing\n• 👥 **Committee** — roles and structure\n• 🔐 **Account** — login, logout help\n\nJust type any of these topics and I'll guide you! 😊`
  }
}

const getResponse = (message, user) => {
  const msg = message.toLowerCase().trim()

  for (const key of Object.keys(responses)) {
    const { patterns, response } = responses[key]
    if (patterns.some(p => msg.includes(p))) {
      return response(user)
    }
  }

  // Default fallback
  return `🤔 I'm not sure about that. Here's what I can help with:\n\n• Events, Projects, Courses\n• Messages, Profile, Tasks\n• Dashboard navigation\n• Committee info\n• Account help\n\nTry asking something like **"how do I create a project?"** or **"where are events?"** 😊`
}

router.post('/', auth, async (req, res) => {
  try {
    const { message } = req.body
    if (!message?.trim()) {
      return res.status(400).json({ message: 'Message is required' })
    }

    const reply = getResponse(message, req.user)
    res.json({ reply })
  } catch (error) {
    console.error('Chatbot error:', error)
    res.status(500).json({ message: 'Chatbot failed', error: error.message })
  }
})

module.exports = router;

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.post('/', auth, (req, res) => {
  console.log('Chatbot body:', req.body)  // ← debug line
  const { message } = req.body

  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'Message is required' })
  }

  const msg = message.toLowerCase().trim()
  let reply = ''

  if (['hello','hi','hey'].some(p => msg.includes(p))) {
    reply = `👋 Hello ${req.user.username}! I'm the S&T Club assistant.\n\nAsk me about:\n• 📅 Events\n• 🚀 Projects\n• 📚 Courses\n• 💬 Messages\n• 👤 Profile\n• ⚙️ Dashboard\n• ✅ Tasks\n• 👥 Committee`

  } else if (['event','workshop','hackathon','seminar','schedule'].some(p => msg.includes(p))) {
    reply = `📅 **Events**\n\nTo view events:\n• Click Events in the navbar\n• Browse upcoming workshops and hackathons\n\nTo create an event (Executive/Chair/Admin):\n• Go to your dashboard → Create Event\n• Fill title, date, location, description\n\nEvents also appear on the Home page calendar! 🗓️`

  } else if (['project','create project','join project','my project'].some(p => msg.includes(p))) {
    reply = `🚀 **Projects**\n\nTo browse projects:\n• Click Projects in the navbar\n• Filter by domain, branch, or status\n\nTo create a project:\n• Student Dashboard → Create Project\n• Add title, description, domain, technologies\n\nTo join a project:\n• Open any project → Request to Join\n• Wait for creator approval\n\nView yours under My Projects 📁`

  } else if (['course','video','learn','tutorial'].some(p => msg.includes(p))) {
    reply = `📚 **Courses**\n\nTo watch videos:\n• Click Courses in the navbar\n• Browse or search videos\n• Click any video to watch\n\nTo upload (Faculty/Admin/Committee):\n• Click Add YouTube Video\n• Paste URL, add title and description\n\nYou can like, dislike and comment! 💬`

  } else if (['message','chat','dm','direct','inbox','friend'].some(p => msg.includes(p))) {
    reply = `💬 **Messages**\n\nTo send a message:\n• Click Messages in navbar\n• Select a friend → type and send\n\nTo add a friend:\n• Messages → Find People tab\n• Search by name or username\n• Click Add Friend\n\nYou can also join group channels! 📡`

  } else if (['profile','photo','bio','edit profile','update'].some(p => msg.includes(p))) {
    reply = `👤 **Profile**\n\nTo edit your profile:\n1. Click your avatar in the navbar\n2. Select My Profile\n3. Click Edit Profile\n4. Update name, bio, department, year\n5. Save Changes\n\nTo change photo:\n• My Profile → 📷 camera icon on avatar\n• Upload JPG/PNG (max 5MB) ✨`

  } else if (['dashboard','navigate','menu','where'].some(p => msg.includes(p))) {
    const role = req.user.role
    const post = req.user.committee_post
    let dashInfo = '🎓 Student Dashboard — view announcements, browse projects'
    if (role === 'admin') dashInfo = '🛡️ Admin Panel — manage users, events, projects, config'
    else if (role === 'faculty') dashInfo = '👨‍🏫 Faculty Dashboard — approve projects, manage quizzes'
    else if (post === 'Chair') dashInfo = '👑 Chair Dashboard — full club overview, approve requests'
    else if (post?.includes('Executive')) dashInfo = '🎯 Executive Dashboard — create and manage events'
    else if (post?.includes('Representative')) dashInfo = '💬 Representative Dashboard — handle student queries'
    else if (post === 'Developer') dashInfo = '💻 Developer Dashboard — manage website components'
    else if (post?.includes('Head')) dashInfo = '🏢 Dept Head Dashboard — manage department members'
    reply = `⚙️ **Your Dashboard**\n\n${dashInfo}\n\nAccess it by clicking your name or dashboard link in the navbar.`

  } else if (['task','assignment','todo','deadline','due'].some(p => msg.includes(p))) {
    reply = `✅ **Tasks**\n\nTo view tasks:\n• Click Tasks in the navbar\n\nTo create a task:\n1. Click + New Task\n2. Add title, description, priority, due date\n3. Click Create\n\nPriorities:\n• 🔴 High\n• 🟡 Medium\n• 🟢 Low\n\nMark complete by clicking the checkbox ☑️`

  } else if (['announcement','notice','news','notification'].some(p => msg.includes(p))) {
    reply = `📢 **Announcements**\n\nAnnouncements appear automatically on your dashboard.\n\nTo create (Admin/Committee only):\n• Admin Panel or dashboard → Create Announcement\n• Write message, select audience (All/Students/Faculty/Committee)\n• Click Post 🎯`

  } else if (['committee','chair','secretary','executive','representative','developer','roles','team'].some(p => msg.includes(p))) {
    reply = `👥 **Committee Structure**\n\n**Leadership:**\n• 👑 Chair — Club head\n• ⭐ Vice Chair\n• 📋 Secretary\n• 📝 Vice Secretary\n\n**Teams:**\n• 🎯 Executive — Event management\n• 💬 Representative — Student queries\n• 💻 Developer — Website\n• 🏢 Dept Heads — Per department\n\nSee full team on Home page → Meet Our Team 🏆`

  } else if (['login','logout','password','account','credentials'].some(p => msg.includes(p))) {
    reply = `🔐 **Account Help**\n\nTo login:\n• Use your username (not email) + password\n• Students: roll number or assigned ID\n• Faculty: email prefix\n\nTo logout:\n• Click avatar → Logout\n\nForgot password?\n• Contact admin to reset\n• Email: scienceclubmecs@gmail.com 📧`

  } else if (['admin','add student','add faculty','bulk','graduate','manage'].some(p => msg.includes(p))) {
    reply = `🛡️ **Admin Functions**\n\n• Add students individually or bulk CSV upload\n• Add faculty members\n• Assign committee posts\n• Graduate students (year promotion)\n• Create announcements\n• Manage events and projects\n• Update site config and logos\n\nAccess via Admin Panel in navbar (admin only) 🔒`

  } else if (['help','what can','guide','support','assist'].some(p => msg.includes(p))) {
    reply = `🤖 **I can help with:**\n\n• 📅 Events — viewing, creating\n• 🚀 Projects — browsing, creating, joining\n• 📚 Courses — watching, uploading\n• 💬 Messages — chatting, friends\n• 👤 Profile — editing, photo\n• ⚙️ Dashboard — navigation\n• 📢 Announcements\n• ✅ Tasks\n• 👥 Committee roles\n• 🔐 Account help\n\nJust type any topic! 😊`

  } else {
    reply = `🤔 I'm not sure about that.\n\nTry asking:\n• "How do I create a project?"\n• "Where are events?"\n• "How do I send a message?"\n• "What is my dashboard?"\n• Type "help" to see all topics 😊`
  }

  res.json({ reply })
})

module.exports = router;

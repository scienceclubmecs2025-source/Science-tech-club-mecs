const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const getRuleBasedResponse = (msg, user) => {
  if (['hello','hi','hey'].some(p => msg.includes(p))) {
    return `👋 Hello ${user.username}! I'm the S&T Club assistant.\n\nAsk me about:\n• 📅 Events\n• 🚀 Projects\n• 📚 Courses\n• 💬 Messages\n• 👤 Profile\n• ⚙️ Dashboard\n• ✅ Tasks\n• 👥 Committee`
  }
  if (['event','workshop','hackathon','seminar','schedule'].some(p => msg.includes(p))) {
    return `📅 **Events**\n\nTo view events:\n• Click Events in the navbar\n• Browse upcoming workshops and hackathons\n\nTo create an event (Executive/Chair/Admin):\n• Go to your dashboard → Create Event\n• Fill title, date, location, description\n\nEvents also appear on the Home page calendar! 🗓️`
  }
  if (['project','create project','join project','my project'].some(p => msg.includes(p))) {
    return `🚀 **Projects**\n\nTo browse projects:\n• Click Projects in the navbar\n• Filter by domain, branch, or status\n\nTo create a project:\n• Student Dashboard → Create Project\n• Add title, description, domain, technologies\n\nTo join a project:\n• Open any project → Request to Join\n• Wait for creator approval\n\nView yours under My Projects 📁`
  }
  if (['course','video','learn','tutorial'].some(p => msg.includes(p))) {
    return `📚 **Courses**\n\nTo watch videos:\n• Click Courses in the navbar\n• Browse or search videos\n• Click any video to watch\n\nTo upload (Faculty/Admin/Committee):\n• Click Add YouTube Video\n• Paste URL, add title and description\n\nYou can like, dislike and comment! 💬`
  }
  if (['message','chat','dm','direct','inbox','friend'].some(p => msg.includes(p))) {
    return `💬 **Messages**\n\nTo send a message:\n• Click Messages in navbar\n• Select a friend → type and send\n\nTo add a friend:\n• Messages → Find People tab\n• Search by name or username\n• Click Add Friend\n\nYou can also join group channels! 📡`
  }
  if (['profile','photo','bio','edit profile','update'].some(p => msg.includes(p))) {
    return `👤 **Profile**\n\nTo edit your profile:\n1. Click your avatar in the navbar\n2. Select My Profile → Edit Profile\n3. Update name, bio, department, year\n4. Save Changes\n\nTo change photo:\n• My Profile → 📷 camera icon\n• Upload JPG/PNG (max 5MB) ✨`
  }
  if (['dashboard','navigate','menu','where'].some(p => msg.includes(p))) {
    const post = user.committee_post
    const role = user.role
    let dashInfo = '🎓 Student Dashboard — view announcements, browse projects'
    if (role === 'admin') dashInfo = '🛡️ Admin Panel — manage users, events, projects, config'
    else if (role === 'faculty') dashInfo = '👨‍🏫 Faculty Dashboard — approve projects, manage quizzes'
    else if (post === 'Chair') dashInfo = '👑 Chair Dashboard — full club overview, approve requests'
    else if (post?.includes('Executive')) dashInfo = '🎯 Executive Dashboard — create and manage events'
    else if (post?.includes('Representative')) dashInfo = '💬 Representative Dashboard — handle student queries'
    else if (post === 'Developer') dashInfo = '💻 Developer Dashboard — manage website components'
    else if (post?.includes('Head')) dashInfo = '🏢 Dept Head Dashboard — manage department members'
    return `⚙️ **Your Dashboard**\n\n${dashInfo}\n\nAccess it by clicking your name or dashboard link in the navbar.`
  }
  if (['task','assignment','todo','deadline','due'].some(p => msg.includes(p))) {
    return `✅ **Tasks**\n\nTo view tasks:\n• Click Tasks in the navbar\n\nTo create a task:\n1. Click + New Task\n2. Add title, description, priority, due date\n3. Click Create\n\nPriorities: 🔴 High • 🟡 Medium • 🟢 Low\n\nMark complete by clicking the checkbox ☑️`
  }
  if (['announcement','notice','news','notification'].some(p => msg.includes(p))) {
    return `📢 **Announcements**\n\nAnnouncements appear automatically on your dashboard.\n\nTo create (Admin/Committee only):\n• Admin Panel → Create Announcement\n• Write message, select audience\n• Click Post 🎯`
  }
  if (['committee','chair','secretary','executive','representative','developer','roles','team'].some(p => msg.includes(p))) {
    return `👥 **Committee Structure**\n\n**Leadership:**\n• 👑 Chair — Club head\n• ⭐ Vice Chair\n• 📋 Secretary\n• 📝 Vice Secretary\n\n**Teams:**\n• 🎯 Executive — Event management\n• 💬 Representative — Student queries\n• 💻 Developer — Website\n• 🏢 Dept Heads — Per department\n\nSee full team on Home page → Meet Our Team 🏆`
  }
  if (['login','logout','password','account','credentials'].some(p => msg.includes(p))) {
    return `🔐 **Account Help**\n\nTo login:\n• Use your username (not email) + password\n\nTo logout:\n• Click avatar → Logout\n\nForgot password?\n• Contact admin to reset\n• Email: scienceclubmecs@gmail.com 📧`
  }
  if (['help','what can','guide','support'].some(p => msg.includes(p))) {
    return `🤖 **I can help with:**\n\n• 📅 Events\n• 🚀 Projects\n• 📚 Courses\n• 💬 Messages\n• 👤 Profile\n• ⚙️ Dashboard\n• 📢 Announcements\n• ✅ Tasks\n• 👥 Committee roles\n• 🔐 Account help\n\nFor anything else, I'll use AI to answer! 🤖`
  }
  return null // no rule matched → use Gemini
}

router.post('/', auth, async (req, res) => {
  try {
    const { message } = req.body
    if (!message?.trim()) {
      return res.status(400).json({ message: 'Message is required' })
    }

    const msg = message.toLowerCase().trim()

    // Try rule-based first
    const ruleReply = getRuleBasedResponse(msg, req.user)
    if (ruleReply) {
      return res.json({ reply: ruleReply })
    }

    // Fallback to Gemini
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY
    if (!GEMINI_API_KEY) {
      return res.json({ reply: "🤔 I'm not sure about that. Try asking about events, projects, courses, messages, profile, or tasks!" })
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a helpful assistant for the Science & Tech Club at Matrusri Engineering College (MECS). 
The club platform has: Events, Projects, Courses, Messages, Tasks, Announcements, and role-based Dashboards.
The user asking is: ${req.user.username} (role: ${req.user.role}, committee post: ${req.user.committee_post || 'none'}).
Answer helpfully and concisely. If the question is unrelated to the club or college, politely redirect.
User question: ${message}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        })
      }
    )

    const geminiData = await geminiRes.json()

    if (!geminiRes.ok) {
      console.error('Gemini API error:', geminiData)
      return res.json({ reply: "🤔 I couldn't process that right now. Try asking about events, projects, courses, or tasks!" })
    }

    const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text
      || "🤔 I'm not sure about that. Try asking about club events, projects, or courses!"

    res.json({ reply })

  } catch (error) {
    console.error('Chatbot error:', error)
    res.status(500).json({ message: 'Chatbot failed', error: error.message })
  }
})

module.exports = router;

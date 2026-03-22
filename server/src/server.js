require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const app      = express();
const supabase = require('./config/supabase');
const auth     = require('./middleware/auth');

const corsOptions = {
  origin: [
    'https://science-and-tech-club-mecs.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))
app.options('*', cors(corsOptions))
app.use(express.json());

// ── Root & health ────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'ok', message: 'Science & Tech Club API v2.0' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /');
});

// ── /api/users/profile ───────────────────────────────────────────
app.get('/api/users/profile', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, email, role, department, year, profile_photo_url, bio, is_committee, committee_post, roll_number, employment_id, created_at')
      .eq('id', req.user.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

app.put('/api/users/profile', auth, async (req, res) => {
  try {
    const { full_name, bio, profile_photo_url, department, year } = req.body;
    const updateData = {};
    if (full_name          !== undefined) updateData.full_name          = full_name;
    if (bio                !== undefined) updateData.bio                = bio;
    if (profile_photo_url  !== undefined) updateData.profile_photo_url  = profile_photo_url;
    if (department         !== undefined) updateData.department         = department;
    if (year               !== undefined) updateData.year               = year;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.user.id)
      .select('id, username, full_name, email, role, department, year, profile_photo_url, bio, is_committee, committee_post')
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

// ── /api/public/committee ────────────────────────────────────────
app.get('/api/public/committee', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, profile_photo_url, committee_post, department, bio')
      .eq('is_committee', true)
      .neq('role', 'admin')
      .order('committee_post');
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Public committee error:', error);
    res.status(500).json({ message: 'Failed to fetch committee' });
  }
});

// ── /api/report-formats ──────────────────────────────────────────
app.get('/api/report-formats', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('report_formats')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch formats' });
  }
});

app.get('/api/report-formats/active', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('report_formats')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    res.json(data || null);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch active format' });
  }
});

// ── /api/messages/unread-count ───────────────────────────────────
app.get('/api/messages/unread-count', auth, async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', req.user.id)
      .eq('is_read', false);
    if (error) throw error;
    res.json({ count: count || 0 });
  } catch (error) {
    res.json({ count: 0 });
  }
});

// ── /api/tasks ───────────────────────────────────────────────────
app.get('/api/tasks', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:assigned_to(id, username, full_name, profile_photo_url),
        creator:created_by(id, username, full_name)
      `)
      .or(`assigned_to.eq.${req.user.id},created_by.eq.${req.user.id}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Tasks error:', error);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', auth, async (req, res) => {
  try {
    const { title, description, assigned_to, due_date, priority, status } = req.body;
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        title,
        description,
        assigned_to: assigned_to || req.user.id,
        created_by:  req.user.id,
        due_date,
        priority: priority || 'medium',
        status:   status   || 'pending'
      }])
      .select(`
        *,
        assignee:assigned_to(id, username, full_name, profile_photo_url),
        creator:created_by(id, username, full_name)
      `)
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Failed to create task', error: error.message });
  }
});

app.put('/api/tasks/:id', auth, async (req, res) => {
  try {
    const { title, description, status, priority, due_date } = req.body;
    const { data, error } = await supabase
      .from('tasks')
      .update({ title, description, status, priority, due_date, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', auth, async (req, res) => {
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete task' });
  }
});

// ── /api/projects/my-projects ────────────────────────────────────
app.get('/api/projects/my-projects', auth, async (req, res) => {
  try {
    const { data: created, error: e1 } = await supabase
      .from('projects')
      .select(`
        *,
        creator:created_by(id, username, full_name, profile_photo_url),
        members:project_members(
          *,
          user:user_id(id, username, full_name, profile_photo_url)
        )
      `)
      .eq('created_by', req.user.id);
    if (e1) throw e1;

    const { data: memberOf, error: e2 } = await supabase
      .from('project_members')
      .select(`
        project:project_id(
          *,
          creator:created_by(id, username, full_name, profile_photo_url),
          members:project_members(
            *,
            user:user_id(id, username, full_name, profile_photo_url)
          )
        )
      `)
      .eq('user_id', req.user.id);
    if (e2) throw e2;

    const memberProjects = (memberOf || [])
      .map(m => m.project)
      .filter(p => p && p.created_by !== req.user.id);

    const allProjects = [...(created || []), ...memberProjects];
    const unique = Array.from(new Map(allProjects.map(p => [p.id, p])).values());
    res.json(unique);
  } catch (error) {
    console.error('My projects error:', error);
    res.status(500).json({ message: 'Failed to fetch my projects', error: error.message });
  }
});

// ── Route files ──────────────────────────────────────────────────
let authRoutes, userRoutes, courseRoutes, projectRoutes, eventRoutes,
    announcementRoutes, messageRoutes, configRoutes, adminRoutes,
    quizRoutes, chatbotRoutes, reportRoutes, friendRoutes,
    channelRoutes, requestsRouter,
    teamUploadsRouter, teamTemplatesRouter   // ← new

try { authRoutes          = require('./routes/auth')          } catch(e) { console.error('❌ auth routes failed:',          e.message) }
try { userRoutes          = require('./routes/users')         } catch(e) { console.error('❌ users routes failed:',         e.message) }
try { courseRoutes        = require('./routes/courses')       } catch(e) { console.error('❌ courses routes failed:',       e.message) }
try { projectRoutes       = require('./routes/projects')      } catch(e) { console.error('❌ projects routes failed:',      e.message) }
try { eventRoutes         = require('./routes/events')        } catch(e) { console.error('❌ events routes failed:',        e.message) }
try { announcementRoutes  = require('./routes/announcements') } catch(e) { console.error('❌ announcements routes failed:', e.message) }
try { messageRoutes       = require('./routes/messages')      } catch(e) { console.error('❌ messages routes failed:',      e.message) }
try { configRoutes        = require('./routes/config')        } catch(e) { console.error('❌ config routes failed:',        e.message) }
try { adminRoutes         = require('./routes/admin')         } catch(e) { console.error('❌ admin routes failed:',         e.message) }
try { quizRoutes          = require('./routes/quizzes')       } catch(e) { console.error('❌ quizzes routes failed:',       e.message) }
try { chatbotRoutes       = require('./routes/chatbot')       } catch(e) { console.error('❌ chatbot routes failed:',       e.message) }
try { reportRoutes        = require('./routes/reports')       } catch(e) { console.error('❌ reports routes failed:',       e.message) }
try { friendRoutes        = require('./routes/friends')       } catch(e) { console.error('❌ friends routes failed:',       e.message) }
try { channelRoutes       = require('./routes/channels')      } catch(e) { console.error('❌ channels routes failed:',      e.message) }
try { requestsRouter      = require('./routes/requests')      } catch(e) { console.error('❌ requests routes failed:',      e.message) }
try { teamUploadsRouter   = require('./routes/teamUploads')   } catch(e) { console.error('❌ teamUploads routes failed:',   e.message) }
try { teamTemplatesRouter = require('./routes/teamTemplates') } catch(e) { console.error('❌ teamTemplates routes failed:', e.message) }

// ── Mount routes ─────────────────────────────────────────────────
if (authRoutes)          app.use('/api/auth',           authRoutes)
if (userRoutes)          app.use('/api/users',          userRoutes)
if (courseRoutes)        app.use('/api/courses',        courseRoutes)
if (projectRoutes)       app.use('/api/projects',       projectRoutes)
if (eventRoutes)         app.use('/api/events',         eventRoutes)
if (announcementRoutes)  app.use('/api/announcements',  announcementRoutes)
if (messageRoutes)       app.use('/api/messages',       messageRoutes)
if (configRoutes)        app.use('/api/config',         configRoutes)
if (adminRoutes)         app.use('/api/admin',          adminRoutes)
if (quizRoutes)          app.use('/api/quizzes',        quizRoutes)
if (chatbotRoutes)       app.use('/api/chatbot',        chatbotRoutes)
if (reportRoutes)        app.use('/api/reports',        reportRoutes)
if (friendRoutes)        app.use('/api/friends',        friendRoutes)
if (channelRoutes)       app.use('/api/channels',       channelRoutes)
if (requestsRouter)      app.use('/api/requests',       requestsRouter)
if (teamUploadsRouter)   app.use('/api/team-uploads',   teamUploadsRouter)    // ← new
if (teamTemplatesRouter) app.use('/api/team-templates', teamTemplatesRouter)  // ← new

// ── 404 handler ──────────────────────────────────────────────────
app.use((req, res) => {
  console.log(`⚠️ 404 - Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ message: 'Route not found' });
});

// ── Global error handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('💥 Server error:', err.message);
  res.status(500).json({ message: 'Server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// ── TEMPORARY DEBUG — remove after fix ──
const routeMap = {
  auth:          authRoutes,
  users:         userRoutes,
  courses:       courseRoutes,
  projects:      projectRoutes,
  events:        eventRoutes,
  announcements: announcementRoutes,
  messages:      messageRoutes,
  config:        configRoutes,
  admin:         adminRoutes,
  quizzes:       quizRoutes,
  chatbot:       chatbotRoutes,
  reports:       reportRoutes,
  friends:       friendRoutes,
  channels:      channelRoutes,
  requests:      requestsRouter,
  teamUploads:   teamUploadsRouter,
  teamTemplates: teamTemplatesRouter,
}
Object.entries(routeMap).forEach(([name, r]) => {
  const ok = typeof r === 'function' || (r && typeof r.handle === 'function')
  console.log(`${ok ? '✅' : '❌'} ${name}:`, typeof r)
})


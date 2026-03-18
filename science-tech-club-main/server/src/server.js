const express = require('express');
const http = require('http');
const cors = require('cors');
const socket = require('./socket');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
socket.init(server);
const supabase = require('./config/supabase');
const auth = require('./middleware/auth');

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json());

// ── Root & health ────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'ok', message: 'Science & Tech Club API v2.0' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /');
});

// ── Route files ──────────────────────────────────────────────────
const authRoutes         = require('./routes/auth');
const userRoutes         = require('./routes/users');
const friendsRoutes      = require('./routes/friends');
const channelsRoutes     = require('./routes/channels');
const courseRoutes       = require('./routes/courses');
const projectRoutes      = require('./routes/projects');
const eventRoutes        = require('./routes/events');
const announcementRoutes = require('./routes/announcements');
const messageRoutes      = require('./routes/messages');
const configRoutes       = require('./routes/config');
const adminRoutes        = require('./routes/admin');
const quizRoutes         = require('./routes/quizzes');
const chatbotRoutes      = require('./routes/chatbot');
const reportRoutes       = require('./routes/reports');

// ── Mount routes ─────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/friends',       friendsRoutes);
app.use('/api/channels',      channelsRoutes);
app.use('/api/courses',       courseRoutes);
app.use('/api/projects',      projectRoutes);
app.use('/api/events',        eventRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/messages',      messageRoutes);
app.use('/api/config',        configRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/quizzes',       quizRoutes);
app.use('/api/chatbot',       chatbotRoutes);
app.use('/api/reports',       reportRoutes);

// ── API 404 Guard (After routes) ─────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// ── Global error handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('💥 Server error:', err.message);
  res.status(500).json({ message: 'Server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io initialized`);
});

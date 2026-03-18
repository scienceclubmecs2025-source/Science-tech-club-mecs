const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// POST /api/chatbot
router.post('/', auth, async (req, res) => {
  try {
    const { message, question } = req.body;
    const userMessage = message || question;

    if (!userMessage || !userMessage.trim()) {
      return res.status(400).json({ message: 'Message or question is required' });
    }

    // ── Fetch context from DB ────────────────────────────────────
    const [
      { data: events },
      { data: announcements },
      { data: projects }
    ] = await Promise.all([
      supabase.from('events').select('title, description, event_date, location').order('event_date', { ascending: true }).limit(5),
      supabase.from('announcements').select('title, content, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('projects').select('title, description, status').limit(5)
    ]);

    // ── Build context string for GROQ ────────────────────────────
    const context = `
You are the Science & Tech Club assistant at Matrusri Engineering College.
Answer questions helpfully based on the club data below.

UPCOMING EVENTS:
${events?.map(e => `- ${e.title} on ${e.event_date ? new Date(e.event_date).toDateString() : 'TBD'}${e.location ? ` at ${e.location}` : ''}`).join('\n') || 'No events'}

LATEST ANNOUNCEMENTS:
${announcements?.map(a => `- ${a.title}: ${a.content?.slice(0, 150)}`).join('\n') || 'No announcements'}

ACTIVE PROJECTS:
${projects?.map(p => `- ${p.title} [${p.status || 'ongoing'}]: ${p.description?.slice(0, 100)}`).join('\n') || 'No projects'}

Keep responses concise, friendly, and use bullet points where helpful.
    `.trim();

    // ── Call GROQ ────────────────────────────────────────────────
    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: context },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 512,
      temperature: 0.7
    });

    const reply = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // ── Save to chat history ─────────────────────────────────────
    await supabase.from('chatbot_history').insert([{
      user_id: req.user.id,
      message: userMessage,
      reply,
      created_at: new Date().toISOString()
    }]);

    res.json({ reply });

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ message: 'Chatbot failed', error: error.message });
  }
});

// GET /api/chatbot/history
router.get('/history', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chatbot_history')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true })
      .limit(50);
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch history' });
  }
});

// DELETE /api/chatbot/history
router.delete('/history', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('chatbot_history')
      .delete()
      .eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ message: 'History cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to clear history' });
  }
});

module.exports = router;

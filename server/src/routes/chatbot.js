const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const supabase = require('../config/supabase');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// POST /api/chatbot
router.post('/', auth, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message required' });
    }

    const prompt = message.trim();

    const { data } = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `
You are the Science & Tech Club assistant at Matrusri Engineering College.
Be concise, friendly, and helpful. Prefer bullet points for lists.
User message: ${prompt}
                `.trim()
              }
            ]
          }
        ]
      },
      {
        params: { key: GEMINI_API_KEY }
      }
    );

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      'No response generated.';

    // Save history (optional, uses chatbot_history table)
    try {
      await supabase.from('chatbot_history').insert([
        {
          user_id: req.user.id,
          message: prompt,
          reply,
          created_at: new Date().toISOString()
        }
      ]);
    } catch (e) {
      console.error('Failed to save chatbot history:', e.message);
    }

    res.json({ reply });
  } catch (error) {
    console.error('Gemini error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Chatbot failed',
      error: error.message
    });
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
    console.error('History error:', error.message);
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
    console.error('Clear history error:', error.message);
    res.status(500).json({ message: 'Failed to clear history' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const axios = require('axios');

const OLLAMA_URL = 'https://gorgeous-granita-717730.netlify.app';

router.post('/', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ message: 'Message required' });
    }

    // Call your Ollama instance
    const { data } = await axios.post(`${OLLAMA_URL}/api/chat`, {
      model: 'llama3.2',  // or check what models are available at /api/tags
      messages: [
        {
          role: 'system',
          content: `You are Science & Tech Club assistant at Matrusri Engineering College. 
          Answer about robotics, AI, web dev, projects, events. Be friendly, use bullet points.`
        },
        { role: 'user', content: message }
      ],
      stream: false,
      temperature: 0.7
    });

    const reply = data.message?.content?.trim() || 'No response generated.';
    
    // Save to Supabase (optional)
    const supabase = require('../config/supabase');
    await supabase.from('chatbot_history').insert([{
      user_id: req.user.id,
      message,
      reply,
      created_at: new Date().toISOString()
    }]);

    res.json({ reply });
  } catch (error) {
    console.error('Ollama error:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Club assistant unavailable',
      error: error.message 
    });
  }
});

// Get chat history
router.get('/history', auth, async (req, res) => {
  const supabase = require('../config/supabase');
  const { data } = await supabase
    .from('chatbot_history')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: true })
    .limit(50);
  res.json(data || []);
});

// Clear history
router.delete('/history', auth, async (req, res) => {
  const supabase = require('../config/supabase');
  await supabase.from('chatbot_history').delete().eq('user_id', req.user.id);
  res.json({ message: 'History cleared' });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      {
        role: 'user',
        parts: [{ text: `You are a helpful assistant for the Science & Tech Club at MECS College, Hyderabad. 
Help students with questions about events, projects, committees, club activities, and technical topics.
Keep responses concise and friendly.

User: ${message}` }]
      }
    ]);

    const reply = result.response.text();
    res.json({ reply });

  } catch (error) {
    console.error('Chatbot error:', error.message);
    if (error.status === 429 || error.message?.includes('429')) {
      return res.status(429).json({ message: 'Chatbot is busy, please try again in a moment.' });
    }
    res.status(500).json({ message: 'Chatbot failed', error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Get messages for a room
router.get('/:room', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room', req.params.room)
      .order('created_at', { ascending: true })
      .limit(100);
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
});

// Send message
router.post('/', auth, async (req, res) => {
  try {
    const { room, message } = req.body;
    
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        room,
        message,
        user_id: req.user.id,
        username: req.user.username
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Emit via Socket.IO
    const { io } = require('../server');
    io.to(room).emit('new-message', data);
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
});

// Delete message
router.delete('/:id', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);
    
    if (error) throw error;
    
    const { io } = require('../server');
    io.emit('message-deleted', req.params.id);
    
    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete message', error: error.message });
  }
});

module.exports = router;

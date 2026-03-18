const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Get all conversations for a user
router.get('/conversations', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participant1:user1_id(id, username, full_name, profile_photo_url, is_committee),
        participant2:user2_id(id, username, full_name, profile_photo_url, is_committee),
        last_message:messages(content, created_at)
      `)
      .or(`user1_id.eq.${req.user.id},user2_id.eq.${req.user.id}`)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Conversations error:', error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
});

// Get or create conversation between two users
router.post('/conversations', auth, async (req, res) => {
  try {
    const { other_user_id } = req.body;
    const myId = req.user.id;

    // Check existing
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(user1_id.eq.${myId},user2_id.eq.${other_user_id}),and(user1_id.eq.${other_user_id},user2_id.eq.${myId})`)
      .single();

    if (existing) return res.json(existing);

    const { data, error } = await supabase
      .from('conversations')
      .insert([{ user1_id: myId, user2_id: other_user_id }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ message: 'Failed to create conversation' });
  }
});

// Get messages in a conversation
router.get('/conversations/:id/messages', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(id, username, full_name, profile_photo_url)
      `)
      .eq('conversation_id', req.params.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Send message in conversation
router.post('/conversations/:id/messages', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Content required' });

    const { data, error } = await supabase
      .from('messages')
      .insert([{
        conversation_id: req.params.id,
        sender_id: req.user.id,
        content: content.trim()
      }])
      .select(`
        *,
        sender:sender_id(id, username, full_name, profile_photo_url)
      `)
      .single();

    if (error) throw error;

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', req.params.id);

    res.status(201).json(data);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// ─── COMMITTEE GROUP CHAT ───────────────────────────────────────

// Get committee channel messages
router.get('/committee-chat', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('committee_messages')
      .select(`
        *,
        sender:sender_id(id, username, full_name, profile_photo_url, committee_post)
      `)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Committee chat error:', error);
    res.status(500).json({ message: 'Failed to fetch committee messages' });
  }
});

// Send committee chat message
router.post('/committee-chat', auth, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('role, is_committee')
      .eq('id', req.user.id)
      .single();

    if (!user || (user.role !== 'admin' && !user.is_committee)) {
      return res.status(403).json({ message: 'Only committee members can send messages here' });
    }

    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Content required' });

    const { data, error } = await supabase
      .from('committee_messages')
      .insert([{
        sender_id: req.user.id,
        content: content.trim()
      }])
      .select(`
        *,
        sender:sender_id(id, username, full_name, profile_photo_url, committee_post)
      `)
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Committee message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

module.exports = router;

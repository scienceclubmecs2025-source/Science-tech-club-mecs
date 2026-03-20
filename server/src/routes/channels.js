const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Get all channels
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .order('name');

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('❌ Fetch channels error:', error);
    res.status(500).json({ message: 'Failed to fetch channels', error: error.message });
  }
});

// ✅ Named routes BEFORE /:id to prevent UUID parse errors
router.get('/by-name/:name', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('name', req.params.name)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('❌ Fetch channel by name error:', error);
    res.status(500).json({ message: 'Failed to fetch channel', error: error.message });
  }
});

// Get single channel by UUID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params
    // Guard against non-UUID strings
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ message: 'Invalid channel ID' })
    }

    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('❌ Fetch channel error:', error);
    res.status(500).json({ message: 'Failed to fetch channel', error: error.message });
  }
});

// Create new channel (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create channels' });
    }

    const { name, description, is_private } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Channel name required' });
    }

    const { data, error } = await supabase
      .from('channels')
      .insert([{
        name: name.toLowerCase().replace(/\s+/g, '-'),
        description,
        is_private: is_private || false,
        created_by: req.user.id
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('❌ Create channel error:', error);
    res.status(500).json({ message: 'Failed to create channel', error: error.message });
  }
});

module.exports = router;

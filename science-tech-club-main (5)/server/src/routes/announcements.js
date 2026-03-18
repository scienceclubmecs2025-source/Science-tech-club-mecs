const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Get all announcements
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        creator:created_by(id, username, full_name, profile_photo_url)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Fetch announcements error:', error);
    res.status(500).json({ message: 'Failed to fetch announcements' });
  }
});

// Create announcement
router.post('/', auth, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('role, is_committee')
      .eq('id', req.user.id)
      .single();

    if (!user || (user.role !== 'admin' && !user.is_committee)) {
      return res.status(403).json({ message: 'Only admins and committee members can post announcements' });
    }

    const { title, content, target_audience } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert([{
        title: title.trim(),
        content: content.trim(),
        target_audience: target_audience || 'all',
        created_by: req.user.id
      }])
      .select(`
        *,
        creator:created_by(id, username, full_name, profile_photo_url)
      `)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ message: 'Failed to create announcement', error: error.message });
  }
});

// Delete announcement
router.delete('/:id', auth, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete announcement' });
  }
});

module.exports = router;

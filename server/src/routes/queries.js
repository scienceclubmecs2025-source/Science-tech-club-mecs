const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Get all queries (committee/admin only)
router.get('/', auth, async (req, res) => {
  try {
    const canView = req.user.role === 'admin' || 
                    req.user.is_committee ||
                    req.user.committee_post?.includes('Representative');
    
    if (!canView) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { data, error } = await supabase
      .from('queries')
      .select(`
        *,
        user:user_id(username, email),
        assigned:assigned_to(username)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch queries' });
  }
});

// Create query
router.post('/', auth, async (req, res) => {
  try {
    const { query } = req.body;
    
    const { data, error } = await supabase
      .from('queries')
      .insert([{
        user_id: req.user.id,
        query,
        status: 'pending'
      }])
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create query' });
  }
});

// Respond to query
router.put('/:id/respond', auth, async (req, res) => {
  try {
    const canRespond = req.user.role === 'admin' || 
                       req.user.committee_post?.includes('Representative') ||
                       req.user.committee_post?.includes('Chair') ||
                       req.user.committee_post?.includes('Secretary');
    
    if (!canRespond) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { response } = req.body;
    
    const { data, error } = await supabase
      .from('queries')
      .update({
        response,
        status: 'resolved',
        resolved_at: new Date(),
        assigned_to: req.user.id
      })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to respond to query' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('queries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('❌ Fetch queries error:', error);
    res.status(500).json({ message: 'Failed to fetch queries', error: error.message });
  }
});

module.exports = router;

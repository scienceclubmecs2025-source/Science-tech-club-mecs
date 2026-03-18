const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');
const { checkCommitteeRole } = require('../middleware/committeeAuth');

// Get all permissions (representatives + leadership)
router.get('/', auth, checkCommitteeRole('representative', 'chair', 'secretary', 'vice_chair', 'vice_secretary'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('permissions')
      .select(`
        *,
        requester:users!permissions_requester_id_fkey(id, username, full_name, email),
        guide:users!permissions_assigned_guide_fkey(id, username, full_name),
        handler:users!permissions_handled_by_fkey(id, username, full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('❌ Fetch permissions error:', error);
    res.status(500).json({ message: 'Failed to fetch permissions', error: error.message });
  }
});

// Get my requests (any student)
router.get('/my-requests', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('permissions')
      .select(`
        *,
        guide:users!permissions_assigned_guide_fkey(id, username, full_name),
        handler:users!permissions_handled_by_fkey(id, username, full_name)
      `)
      .eq('requester_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('❌ Fetch my requests error:', error);
    res.status(500).json({ message: 'Failed to fetch requests', error: error.message });
  }
});

// Create permission request (any student)
router.post('/', auth, async (req, res) => {
  try {
    const { request_type, subject, description } = req.body;

    if (!request_type || !subject || !description) {
      return res.status(400).json({ message: 'All fields required' });
    }

    const { data, error } = await supabase
      .from('permissions')
      .insert([{
        requester_id: req.user.id,
        request_type,
        subject: subject.trim(),
        description: description.trim(),
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('❌ Create permission error:', error);
    res.status(500).json({ message: 'Failed to create request', error: error.message });
  }
});

// Update permission (representatives + leadership)
router.put('/:id', auth, checkCommitteeRole('representative', 'chair', 'secretary'), async (req, res) => {
  try {
    const { status, assigned_guide, response } = req.body;

    const updateData = { 
      updated_at: new Date().toISOString(),
      handled_by: req.user.id
    };

    if (status) updateData.status = status;
    if (assigned_guide) updateData.assigned_guide = assigned_guide;
    if (response) updateData.response = response;

    const { data, error } = await supabase
      .from('permissions')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('❌ Update permission error:', error);
    res.status(500).json({ message: 'Failed to update permission', error: error.message });
  }
});

// Assign guide (representatives)
router.put('/:id/assign-guide', auth, checkCommitteeRole('representative', 'chair', 'secretary'), async (req, res) => {
  try {
    const { guide_id } = req.body;

    if (!guide_id) {
      return res.status(400).json({ message: 'Guide ID required' });
    }

    const { data, error } = await supabase
      .from('permissions')
      .update({ 
        assigned_guide: guide_id,
        status: 'approved',
        handled_by: req.user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('❌ Assign guide error:', error);
    res.status(500).json({ message: 'Failed to assign guide', error: error.message });
  }
});

module.exports = router;

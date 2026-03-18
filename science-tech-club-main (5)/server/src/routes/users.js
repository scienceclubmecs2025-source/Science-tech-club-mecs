const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Get all users (excluding admin)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, email, role, department, year, profile_photo_url, bio, is_committee, committee_post')
      .neq('role', 'admin')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// In users.js — move these to the TOP before /:id routes

// GET own profile
router.get('/profile', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, email, role, department, year, profile_photo_url, bio, is_committee, committee_post, roll_number, employment_id, created_at')
      .eq('id', req.user.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// PUT own profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { full_name, bio, profile_photo_url, department, year } = req.body;
    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (bio !== undefined) updateData.bio = bio;
    if (profile_photo_url !== undefined) updateData.profile_photo_url = profile_photo_url;
    if (department !== undefined) updateData.department = department;
    if (year !== undefined) updateData.year = year;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.user.id)
      .select('id, username, full_name, email, role, department, year, profile_photo_url, bio, is_committee, committee_post')
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

// ... rest of routes (/:id etc) below

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, email, role, department, year, profile_photo_url, bio, is_committee, committee_post, created_at')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(404).json({ message: 'User not found' });
  }
});

// Update own profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { full_name, bio, profile_photo_url, department, year } = req.body;

    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (bio !== undefined) updateData.bio = bio;
    if (profile_photo_url !== undefined) updateData.profile_photo_url = profile_photo_url;
    if (department !== undefined) updateData.department = department;
    if (year !== undefined) updateData.year = year;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.user.id)
      .select('id, username, full_name, email, role, department, year, profile_photo_url, bio, is_committee, committee_post')
      .single();

    if (error) throw error;

    // Update localStorage user object returned to client
    res.json(data);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

// Update any user (admin)
router.put('/:id', auth, async (req, res) => {
  try {
    const { data: me } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (me.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const allowedFields = ['full_name', 'bio', 'profile_photo_url', 'department', 'year', 'committee_post', 'is_committee'];
    const updateData = {};
    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) updateData[f] = req.body[f];
    });
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // If made committee member, auto-friend with other committee members
    if (updateData.is_committee === true) {
      await autoFriendCommitteeMembers(req.params.id);
    }

    res.json(data);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Auto-friend all committee members
const autoFriendCommitteeMembers = async (newMemberId) => {
  try {
    const { data: committee } = await supabase
      .from('users')
      .select('id')
      .eq('is_committee', true)
      .neq('id', newMemberId);

    if (!committee) return;

    const friendships = committee.map(member => ({
      user_id: newMemberId,
      friend_id: member.id,
      status: 'accepted'
    }));

    const reverseFriendships = committee.map(member => ({
      user_id: member.id,
      friend_id: newMemberId,
      status: 'accepted'
    }));

    // Insert ignoring duplicates
    await supabase.from('friendships').upsert(friendships, { onConflict: 'user_id,friend_id' });
    await supabase.from('friendships').upsert(reverseFriendships, { onConflict: 'user_id,friend_id' });
  } catch (error) {
    console.error('Auto-friend error:', error);
  }
};

// Update role (admin only)
router.put('/:id/role', auth, async (req, res) => {
  try {
    const { data: me } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (me.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { role } = req.body;
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update role' });
  }
});

// Delete user (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { data: me } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (me.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });

    const { error } = await supabase.from('users').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Get friends list
router.get('/:id/friends', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        *,
        friend:friend_id(id, username, full_name, profile_photo_url, is_committee, committee_post)
      `)
      .eq('user_id', req.params.id)
      .eq('status', 'accepted');

    if (error) throw error;
    res.json(data?.map(f => f.friend) || []);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch friends' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Auto-friend all admin and committee members (admin only)
router.post('/sync-admin-committee', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    // Get all admin and committee users
    const { data: adminCommittee, error: fetchError } = await supabase
      .from('users')
      .select('id, username, role, is_committee')
      .or('role.eq.admin,is_committee.eq.true');

    if (fetchError) throw fetchError;

    let created = 0;
    let skipped = 0;

    // Create friendships between all pairs
    for (let i = 0; i < adminCommittee.length; i++) {
      for (let j = i + 1; j < adminCommittee.length; j++) {
        const user1 = adminCommittee[i];
        const user2 = adminCommittee[j];
        
        const [user1_id, user2_id] = [user1.id, user2.id].sort();

        const { error } = await supabase
          .from('friendships')
          .insert([{ user1_id, user2_id }])
          .select()
          .single();

        if (error) {
          if (error.code === '23505') { // Duplicate key
            skipped++;
          } else {
            console.error('Friendship creation error:', error);
          }
        } else {
          created++;
        }
      }
    }

    res.json({
      message: 'Admin/Committee friendships synced',
      created,
      skipped,
      total: adminCommittee.length
    });
  } catch (error) {
    console.error('❌ Sync error:', error);
    res.status(500).json({ message: 'Failed to sync', error: error.message });
  }
});

// Get all users (for Find My Friend)
router.get('/users', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, email, profile_photo_url, department, year, role')
      .neq('id', req.user.id) // Exclude current user
      .order('username');

    if (error) throw error;

    // Remove passwords
    const users = data.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json(users);
  } catch (error) {
    console.error('❌ Fetch users error:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// Send friend request
router.post('/request', auth, async (req, res) => {
  try {
    const { receiver_id } = req.body;

    if (!receiver_id) {
      return res.status(400).json({ message: 'Receiver ID required' });
    }

    if (receiver_id === req.user.id) {
      return res.status(400).json({ message: 'Cannot send request to yourself' });
    }

    // Check if request already exists
    const { data: existing } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`and(sender_id.eq.${req.user.id},receiver_id.eq.${receiver_id}),and(sender_id.eq.${receiver_id},receiver_id.eq.${req.user.id})`)
      .single();

    if (existing) {
      return res.status(400).json({ message: 'Friend request already exists' });
    }

    // Check if already friends
    const [id1, id2] = [req.user.id, receiver_id].sort();
    const { data: friendship } = await supabase
      .from('friendships')
      .select('*')
      .eq('user1_id', id1)
      .eq('user2_id', id2)
      .single();

    if (friendship) {
      return res.status(400).json({ message: 'Already friends' });
    }

    // Create friend request
    const { data, error } = await supabase
      .from('friend_requests')
      .insert([{
        sender_id: req.user.id,
        receiver_id,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('❌ Send friend request error:', error);
    res.status(500).json({ message: 'Failed to send request', error: error.message });
  }
});

// Get sent requests (My Requests)
router.get('/requests/sent', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        *,
        receiver:users!friend_requests_receiver_id_fkey(id, username, full_name, profile_photo_url)
      `)
      .eq('sender_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('❌ Fetch sent requests error:', error);
    res.status(500).json({ message: 'Failed to fetch requests', error: error.message });
  }
});

// Get received requests (Pending Requests)
router.get('/requests/received', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        *,
        sender:users!friend_requests_sender_id_fkey(id, username, full_name, profile_photo_url)
      `)
      .eq('receiver_id', req.user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('❌ Fetch received requests error:', error);
    res.status(500).json({ message: 'Failed to fetch requests', error: error.message });
  }
});

// Accept friend request
router.put('/request/:id/accept', auth, async (req, res) => {
  try {
    // Get the request
    const { data: request, error: fetchError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('id', req.params.id)
      .eq('receiver_id', req.user.id)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Update request status
    await supabase
      .from('friend_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', req.params.id);

    // Create friendship
    const [user1_id, user2_id] = [request.sender_id, request.receiver_id].sort();
    
    const { data: friendship, error: friendshipError } = await supabase
      .from('friendships')
      .insert([{ user1_id, user2_id }])
      .select()
      .single();

    if (friendshipError) throw friendshipError;

    res.json({ message: 'Friend request accepted', friendship });
  } catch (error) {
    console.error('❌ Accept request error:', error);
    res.status(500).json({ message: 'Failed to accept request', error: error.message });
  }
});

// Reject friend request
router.put('/request/:id/reject', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('receiver_id', req.user.id);

    if (error) throw error;

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    console.error('❌ Reject request error:', error);
    res.status(500).json({ message: 'Failed to reject request', error: error.message });
  }
});

// Get friends list
router.get('/list', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`user1_id.eq.${req.user.id},user2_id.eq.${req.user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get friend details
    const friendIds = data.map(f => 
      f.user1_id === req.user.id ? f.user2_id : f.user1_id
    );

    if (friendIds.length === 0) {
      return res.json([]);
    }

    const { data: friends, error: friendsError } = await supabase
      .from('users')
      .select('id, username, full_name, profile_photo_url, department, year')
      .in('id', friendIds);

    if (friendsError) throw friendsError;

    res.json(friends || []);
  } catch (error) {
    console.error('❌ Fetch friends error:', error);
    res.status(500).json({ message: 'Failed to fetch friends', error: error.message });
  }
});

// Remove friend
router.delete('/remove/:friendId', auth, async (req, res) => {
  try {
    const [user1_id, user2_id] = [req.user.id, req.params.friendId].sort();

    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('user1_id', user1_id)
      .eq('user2_id', user2_id);

    if (error) throw error;

    res.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('❌ Remove friend error:', error);
    res.status(500).json({ message: 'Failed to remove friend', error: error.message });
  }
});

module.exports = router;

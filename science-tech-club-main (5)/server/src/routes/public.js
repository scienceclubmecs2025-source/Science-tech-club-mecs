const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Get public committee members
router.get('/committee', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, email, committee_post, profile_photo_url')
      .eq('is_committee', true)
      .order('committee_post');

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('❌ Fetch committee error:', error);
    res.status(500).json({ message: 'Failed to fetch committee', error: error.message });
  }
});

module.exports = router;

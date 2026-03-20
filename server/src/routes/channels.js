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
      .order('name')
    if (error) throw error
    res.json(data || [])
  } catch (error) {
    console.error('❌ Fetch channels error:', error)
    res.status(500).json({ message: 'Failed to fetch channels', error: error.message })
  }
})

// Get single channel — supports both UUID and name string
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    let query = supabase.from('channels').select('*')

    if (uuidRegex.test(id)) {
      query = query.eq('id', id)        // ✅ UUID lookup
    } else {
      query = query.eq('name', id)      // ✅ name lookup e.g. "committee"
    }

    const { data, error } = await query.single()
    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('❌ Fetch channel error:', error)
    res.status(500).json({ message: 'Failed to fetch channel', error: error.message })
  }
})

// Create channel (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create channels' })
    }
    const { name, description, is_private } = req.body
    if (!name) return res.status(400).json({ message: 'Channel name required' })

    const { data, error } = await supabase
      .from('channels')
      .insert([{
        name: name.toLowerCase().replace(/\s+/g, '-'),
        description,
        is_private: is_private || false,
        created_by: req.user.id
      }])
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    console.error('❌ Create channel error:', error)
    res.status(500).json({ message: 'Failed to create channel', error: error.message })
  }
})

module.exports = router

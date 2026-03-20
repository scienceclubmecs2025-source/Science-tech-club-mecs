const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Group display name mapping
const CHANNEL_DISPLAY_NAMES = {
  'executives':      'Executives',
  'representatives': 'Representatives',
  'design-team':     'Design Team',
  'committee':       'Committee',
  'general':         'General'
}

// Get all channels — auto-seed design-team if missing
router.get('/', auth, async (req, res) => {
  try {
    // Auto-create design-team channel if it doesn't exist
    const { data: existing } = await supabase.from('channels').select('id').eq('name', 'design-team').single()
    if (!existing) {
      await supabase.from('channels').insert([{
        name: 'design-team',
        description: 'Design Team — Canva collaboration channel',
        is_private: true
      }])
    }

    const { data, error } = await supabase.from('channels').select('*').order('name')
    if (error) throw error

    // Attach display names
    const enriched = (data || []).map(ch => ({
      ...ch,
      display_name: CHANNEL_DISPLAY_NAMES[ch.name] || ch.name
    }))

    res.json(enriched)
  } catch (error) {
    console.error('❌ Fetch channels error:', error)
    res.status(500).json({ message: 'Failed to fetch channels', error: error.message })
  }
})

// Get single channel — supports UUID or name
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    let query = supabase.from('channels').select('*')
    query = uuidRegex.test(id) ? query.eq('id', id) : query.eq('name', id)
    const { data, error } = await query.single()
    if (error) throw error
    res.json({ ...data, display_name: CHANNEL_DISPLAY_NAMES[data.name] || data.name })
  } catch (error) {
    console.error('❌ Fetch channel error:', error)
    res.status(500).json({ message: 'Failed to fetch channel', error: error.message })
  }
})

// Create channel (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Only admins can create channels' })
    const { name, description, is_private } = req.body
    if (!name) return res.status(400).json({ message: 'Channel name required' })

    const { data, error } = await supabase
      .from('channels')
      .insert([{ name: name.toLowerCase().replace(/\s+/g, '-'), description, is_private: is_private || false, created_by: req.user.id }])
      .select().single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    console.error('❌ Create channel error:', error)
    res.status(500).json({ message: 'Failed to create channel', error: error.message })
  }
})

module.exports = router

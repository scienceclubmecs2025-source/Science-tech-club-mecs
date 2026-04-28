const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')
const auth = require('../middleware/auth')

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        creator:created_by(id, username, full_name, committee_post)
      `)
      .order('event_date', { ascending: false })

    if (error) throw error
    res.json(data || [])
  } catch (error) {
    console.error('GET /events error:', error)
    res.status(500).json({ message: 'Failed to fetch events', error: error.message })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      event_date,
      location,
      poster_url,
      banner_url,
      report_url
    } = req.body

    if (!title || !event_date) {
      return res.status(400).json({ message: 'title and event_date are required' })
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role, committee_post')
      .eq('id', req.user.id)
      .single()

    if (userError || !user) {
      return res.status(401).json({ message: 'User not found or unauthorized' })
    }

    const canCreateEvent =
      user.role === 'admin' ||
      user.committee_post === 'Executive Head'

    if (!canCreateEvent) {
      return res.status(403).json({
        message: 'Only admin or Executive Head can create events'
      })
    }

    const { data, error } = await supabase
      .from('events')
      .insert([{
        title,
        description,
        event_date,
        location,
        poster_url,
        banner_url,
        report_url,
        created_by: req.user.id,
        status: 'pending'
      }])
      .select(`
        *,
        creator:created_by(id, username, full_name, committee_post)
      `)
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    console.error('POST /events error:', error)
    res.status(500).json({ message: 'Failed to create event', error: error.message })
  }
})

router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body

    if (!status) {
      return res.status(400).json({ message: 'status is required' })
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single()

    if (userError || !user) {
      return res.status(401).json({ message: 'User not found or unauthorized' })
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' })
    }

    const { data, error } = await supabase
      .from('events')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    console.error('PUT /events/:id/status error:', error)
    res.status(500).json({ message: 'Failed to update event status', error: error.message })
  }
})

module.exports = router

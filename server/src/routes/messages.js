const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// ── UUID helper ───────────────────────────────────────────────────
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Resolves channel name string OR UUID to actual UUID
const resolveChannelId = async (channelId) => {
  if (!channelId) return null
  if (uuidRegex.test(channelId)) return channelId
  const { data } = await supabase
    .from('channels')
    .select('id')
    .eq('name', channelId)
    .single()
  return data?.id || null
}

// ── Smart root POST — used by MessagesPage send handler ───────────
router.post('/', auth, async (req, res) => {
  try {
    const { content, channel_id, receiver_id } = req.body

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Content required' })
    }

    // DM path
    if (receiver_id) {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          sender_id:   req.user.id,
          receiver_id: receiver_id,
          content:     content.trim()
        }])
        .select(`
          *,
          sender:sender_id(id, username, full_name, profile_photo_url)
        `)
        .single()

      if (error) throw error
      return res.status(201).json(data)
    }

    // Channel path
    if (channel_id) {
      const resolvedId = await resolveChannelId(channel_id)
      if (!resolvedId) return res.status(404).json({ message: 'Channel not found' })

      const { data, error } = await supabase
        .from('messages')
        .insert([{
          sender_id:  req.user.id,
          channel_id: resolvedId,
          content:    content.trim()
        }])
        .select(`
          *,
          sender:sender_id(id, username, full_name, profile_photo_url)
        `)
        .single()

      if (error) throw error
      return res.status(201).json(data)
    }

    return res.status(400).json({ message: 'Either channel_id or receiver_id is required' })
  } catch (error) {
    console.error('POST /messages error:', error)
    res.status(500).json({ message: 'Failed to send message', error: error.message })
  }
})

// ── Unread count — must be before /:id style routes ──────────────
router.get('/unread-count', auth, async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', req.user.id)
      .eq('is_read', false)

    if (error) throw error
    res.json({ count: count || 0 })
  } catch (error) {
    console.error('Unread count error:', error)
    res.json({ count: 0 })
  }
})

// ── Committee chat shortcuts ──────────────────────────────────────
router.get('/committee-chat', auth, async (req, res) => {
  try {
    const channelId = await resolveChannelId('committee')
    if (!channelId) return res.json([])

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(id, username, full_name, profile_photo_url, committee_post)
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) throw error
    res.json(data || [])
  } catch (error) {
    console.error('Committee chat fetch error:', error)
    res.status(500).json({ message: 'Failed to fetch committee messages' })
  }
})

router.post('/committee-chat', auth, async (req, res) => {
  try {
    const { data: userRecord } = await supabase
      .from('users')
      .select('role, is_committee')
      .eq('id', req.user.id)
      .single()

    if (!userRecord || (userRecord.role !== 'admin' && !userRecord.is_committee)) {
      return res.status(403).json({ message: 'Committee members only' })
    }

    const { content } = req.body
    if (!content?.trim()) return res.status(400).json({ message: 'Content required' })

    const channelId = await resolveChannelId('committee')
    if (!channelId) return res.status(404).json({ message: 'Committee channel not found' })

    const { data, error } = await supabase
      .from('messages')
      .insert([{
        sender_id:  req.user.id,
        channel_id: channelId,
        content:    content.trim()
      }])
      .select(`
        *,
        sender:sender_id(id, username, full_name, profile_photo_url, committee_post)
      `)
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    console.error('Committee message send error:', error)
    res.status(500).json({ message: 'Failed to send message' })
  }
})

// ── Channel messages ──────────────────────────────────────────────
router.get('/channel/:channelId', auth, async (req, res) => {
  try {
    const channelId = await resolveChannelId(req.params.channelId)
    if (!channelId) return res.status(404).json({ message: 'Channel not found' })

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(id, username, full_name, profile_photo_url)
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) throw error
    res.json(data || [])
  } catch (error) {
    console.error('Fetch channel messages error:', error)
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message })
  }
})

router.post('/channel/:channelId', auth, async (req, res) => {
  try {
    const channelId = await resolveChannelId(req.params.channelId)
    if (!channelId) return res.status(404).json({ message: 'Channel not found' })

    const { content } = req.body
    if (!content?.trim()) return res.status(400).json({ message: 'Content required' })

    const { data, error } = await supabase
      .from('messages')
      .insert([{
        sender_id:  req.user.id,
        channel_id: channelId,
        content:    content.trim()
      }])
      .select(`
        *,
        sender:sender_id(id, username, full_name, profile_photo_url)
      `)
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    console.error('Send channel message error:', error)
    res.status(500).json({ message: 'Failed to send message', error: error.message })
  }
})

// ── DM messages ───────────────────────────────────────────────────
router.get('/dm/:userId', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(id, username, full_name, profile_photo_url)
      `)
      .or(
        `and(sender_id.eq.${req.user.id},receiver_id.eq.${req.params.userId}),` +
        `and(sender_id.eq.${req.params.userId},receiver_id.eq.${req.user.id})`
      )
      .is('channel_id', null)
      .order('created_at', { ascending: true })

    if (error) throw error

    // Mark received messages as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', req.params.userId)
      .eq('receiver_id', req.user.id)

    res.json(data || [])
  } catch (error) {
    console.error('Fetch DM error:', error)
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message })
  }
})

router.post('/dm/:userId', auth, async (req, res) => {
  try {
    const { content } = req.body
    if (!content?.trim()) return res.status(400).json({ message: 'Content required' })

    const { data, error } = await supabase
      .from('messages')
      .insert([{
        sender_id:   req.user.id,
        receiver_id: req.params.userId,
        content:     content.trim()
      }])
      .select(`
        *,
        sender:sender_id(id, username, full_name, profile_photo_url)
      `)
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    console.error('Send DM error:', error)
    res.status(500).json({ message: 'Failed to send message', error: error.message })
  }
})

module.exports = router;

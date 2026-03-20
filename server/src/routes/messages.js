const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Helper — resolve channel name or UUID to channel id
const resolveChannelId = async (channelId) => {
  if (uuidRegex.test(channelId)) return channelId
  const { data } = await supabase
    .from('channels')
    .select('id')
    .eq('name', channelId)
    .single()
  return data?.id || null
}

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
        sender_id: req.user.id,
        channel_id: channelId,
        content: content.trim()
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
        sender_id: req.user.id,
        receiver_id: req.params.userId,
        content: content.trim()
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

// ── Unread count ──────────────────────────────────────────────────

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
    res.json({ count: 0 })
  }
})

// ── Committee chat ────────────────────────────────────────────────

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
    console.error('Committee chat error:', error)
    res.status(500).json({ message: 'Failed to fetch committee messages' })
  }
})

router.post('/committee-chat', auth, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('role, is_committee')
      .eq('id', req.user.id)
      .single()

    if (!user || (user.role !== 'admin' && !user.is_committee)) {
      return res.status(403).json({ message: 'Committee members only' })
    }

    const { content } = req.body
    if (!content?.trim()) return res.status(400).json({ message: 'Content required' })

    const channelId = await resolveChannelId('committee')
    if (!channelId) return res.status(404).json({ message: 'Committee channel not found' })

    const { data, error } = await supabase
      .from('messages')
      .insert([{
        sender_id: req.user.id,
        channel_id: channelId,
        content: content.trim()
      }])
      .select(`
        *,
        sender:sender_id(id, username, full_name, profile_photo_url, committee_post)
      `)
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    console.error('Committee message error:', error)
    res.status(500).json({ message: 'Failed to send message' })
  }
})

module.exports = router;

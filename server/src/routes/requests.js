const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// ── Profile Requests ─────────────────────────────────────────────

// ✅ PUBLIC — no auth needed
router.post('/profile', async (req, res) => {
  try {
    const { full_name, email, roll_number, department, year, phone, guardian_phone, reason } = req.body
    if (!full_name || !email) return res.status(400).json({ message: 'Name and email required' })

    const { data, error } = await supabase
      .from('profile_requests')
      .insert([{ full_name, email, roll_number, department, year, phone, guardian_phone, reason, status: 'pending' }])
      .select().single()

    if (error) throw error

    // Notify admins, chair, vice chair
    try {
      const { sendProfileRequestMail } = require('../services/mailer')
      const { data: admins } = await supabase
        .from('users')
        .select('email')
        .or('role.eq.admin,committee_post.eq.Chair,committee_post.eq.Vice Chair,committee_post.eq.Representative Head')
      if (admins) {
        for (const admin of admins) {
          await sendProfileRequestMail(admin.email, { full_name, email, roll_number, department, year })
        }
      }
    } catch (mailErr) {
      console.error('Mail error (non-fatal):', mailErr.message)
    }

    res.status(201).json({ message: 'Profile request submitted successfully', id: data.id })
  } catch (error) {
    console.error('Profile request error:', error)
    res.status(500).json({ message: 'Failed to submit request', error: error.message })
  }
})

// ✅ PUBLIC — no auth needed
router.post('/password', async (req, res) => {
  try {
    const { username, email, reason } = req.body
    if (!username || !email) return res.status(400).json({ message: 'Username and email required' })

    const { data: user } = await supabase.from('users').select('id, email').eq('username', username).single()
    if (!user || user.email !== email) return res.status(404).json({ message: 'User not found or email mismatch' })

    const { data, error } = await supabase
      .from('password_requests')
      .insert([{ username, email, reason, status: 'pending' }])
      .select().single()

    if (error) throw error
    res.status(201).json({ message: 'Password reset request submitted', id: data.id })
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit request', error: error.message })
  }
})

// ── Admin/Chair routes — auth required ───────────────────────────

// Get all profile requests
router.get('/profile', auth, async (req, res) => {
  try {
    const { data: me } = await supabase.from('users').select('role, committee_post').eq('id', req.user.id).single()
    const allowed = me.role === 'admin' || ['Chair', 'Vice Chair', 'Representative Head'].includes(me.committee_post)
    if (!allowed) return res.status(403).json({ message: 'Not authorized' })

    const { data, error } = await supabase
      .from('profile_requests')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json(data || [])
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch requests' })
  }
})

// Accept profile request → create user
router.put('/profile/:id/accept', auth, async (req, res) => {
  try {
    const { data: me } = await supabase.from('users').select('role, committee_post').eq('id', req.user.id).single()
    const allowed = me.role === 'admin' || ['Chair', 'Vice Chair', 'Representative Head'].includes(me.committee_post)
    if (!allowed) return res.status(403).json({ message: 'Not authorized' })

    const { data: request } = await supabase.from('profile_requests').select('*').eq('id', req.params.id).single()
    if (!request) return res.status(404).json({ message: 'Request not found' })

    const username = request.roll_number
      ? request.roll_number.toLowerCase().replace(/\s+/g, '')
      : request.email.split('@')[0]

    const uniqueId = request.roll_number || username
    const guardianPhone = request.guardian_phone || '0000000000'
    const rawPassword = `${uniqueId}@${guardianPhone}`
    const hashedPassword = await bcrypt.hash(rawPassword, 10)

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{
        username,
        full_name:   request.full_name,
        email:       request.email,
        password:    hashedPassword,
        roll_number: request.roll_number,
        department:  request.department,
        year:        request.year,
        role:        'student'
      }])
      .select().single()

    if (createError) throw createError

    await supabase.from('profile_requests').update({ status: 'accepted' }).eq('id', req.params.id)

    try {
      const { sendProfileCreatedMail } = require('../services/mailer')
      await sendProfileCreatedMail(newUser, rawPassword)
    } catch (mailErr) {
      console.error('Mail error (non-fatal):', mailErr.message)
    }

    res.json({ message: 'Profile created and credentials sent', user: newUser })
  } catch (error) {
    console.error('Accept request error:', error)
    res.status(500).json({ message: 'Failed to accept request', error: error.message })
  }
})

// Reject profile request
router.put('/profile/:id/reject', auth, async (req, res) => {
  try {
    const { data: me } = await supabase.from('users').select('role, committee_post').eq('id', req.user.id).single()
    const allowed = me.role === 'admin' || ['Chair', 'Vice Chair', 'Representative Head'].includes(me.committee_post)
    if (!allowed) return res.status(403).json({ message: 'Not authorized' })

    await supabase.from('profile_requests').update({ status: 'rejected' }).eq('id', req.params.id)
    res.json({ message: 'Request rejected' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject request' })
  }
})

// Get all password requests
router.get('/password', auth, async (req, res) => {
  try {
    const { data: me } = await supabase.from('users').select('role, committee_post').eq('id', req.user.id).single()
    const allowed = me.role === 'admin' || ['Chair', 'Vice Chair'].includes(me.committee_post)
    if (!allowed) return res.status(403).json({ message: 'Not authorized' })

    const { data, error } = await supabase
      .from('password_requests')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json(data || [])
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch requests' })
  }
})

// Approve password reset
router.put('/password/:id/approve', auth, async (req, res) => {
  try {
    const { data: me } = await supabase.from('users').select('role, committee_post').eq('id', req.user.id).single()
    const allowed = me.role === 'admin' || ['Chair', 'Vice Chair'].includes(me.committee_post)
    if (!allowed) return res.status(403).json({ message: 'Not authorized' })

    const { data: request } = await supabase.from('password_requests').select('*').eq('id', req.params.id).single()
    if (!request) return res.status(404).json({ message: 'Request not found' })

    const { data: user } = await supabase.from('users').select('*').eq('username', request.username).single()
    if (!user) return res.status(404).json({ message: 'User not found' })

    const uniqueId = user.roll_number || user.username
    const guardianPhone = user.guardian_phone || '0000000000'
    const rawPassword = `${uniqueId}@${guardianPhone}`
    const hashedPassword = await bcrypt.hash(rawPassword, 10)

    await supabase.from('users').update({ password: hashedPassword }).eq('id', user.id)
    await supabase.from('password_requests').update({ status: 'approved' }).eq('id', req.params.id)

    try {
      const { sendPasswordChangedMail } = require('../services/mailer')
      await sendPasswordChangedMail(user, rawPassword)
    } catch (mailErr) {
      console.error('Mail error (non-fatal):', mailErr.message)
    }

    res.json({ message: 'Password reset and email sent' })
  } catch (error) {
    console.error('Approve password error:', error)
    res.status(500).json({ message: 'Failed to reset password', error: error.message })
  }
})

// Reject password request
router.put('/password/:id/reject', auth, async (req, res) => {
  try {
    await supabase.from('password_requests').update({ status: 'rejected' }).eq('id', req.params.id)
    res.json({ message: 'Request rejected' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject' })
  }
})

module.exports = router

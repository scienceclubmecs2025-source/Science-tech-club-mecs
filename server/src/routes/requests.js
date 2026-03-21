const express  = require('express')
const router   = express.Router()
const supabase = require('../config/supabase')
const auth     = require('../middleware/auth')
const bcrypt   = require('bcryptjs')

// ── Profile Requests ─────────────────────────────────────────────

// PUBLIC — submit profile request
router.post('/profile', async (req, res) => {
  try {
    const {
      full_name, email, roll_number, department,
      year, phone, guardian_phone, reason
    } = req.body

    if (!full_name || !email) {
      return res.status(400).json({ message: 'Name and email required' })
    }

    const { data, error } = await supabase
      .from('profile_requests')
      .insert([{
        full_name,
        email,
        roll_number,    // college roll number from student
        department,
        year,
        phone,
        guardian_phone,
        reason,
        status: 'pending'
      }])
      .select().single()

    if (error) throw error

    // Notify admins/chair (non-fatal)
    try {
      const { sendProfileRequestMail } = require('../services/mailer')
      const { data: admins } = await supabase
        .from('users')
        .select('email')
        .or('role.eq.admin,committee_post.eq.Chair')
      if (admins?.length) {
        for (const admin of admins) {
          await sendProfileRequestMail(admin.email, {
            full_name, email, roll_number, department, year, phone
          })
        }
      }
    } catch (mailErr) {
      console.error('Mail notify error (non-fatal):', mailErr.message)
    }

    res.status(201).json({ message: 'Profile request submitted successfully', id: data.id })
  } catch (error) {
    console.error('Profile request error:', error)
    res.status(500).json({ message: 'Failed to submit request', error: error.message })
  }
})

// AUTH — get all profile requests (admin/chair only)
router.get('/profile', auth, async (req, res) => {
  try {
    const { data: me } = await supabase
      .from('users').select('role, committee_post').eq('id', req.user.id).single()
    const allowed = me.role === 'admin' || me.committee_post === 'Chair'
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

// AUTH — accept profile request → create user account
// username  = part before '@' in email
// password  = UniqueID@GuardianPhone  (unique_id assigned by admin here)
// roll_number = kept as college roll number (separate from unique_id)
router.put('/profile/:id/accept', auth, async (req, res) => {
  try {
    const { data: me } = await supabase
      .from('users').select('role, committee_post').eq('id', req.user.id).single()
    const allowed = me.role === 'admin' || me.committee_post === 'Chair'
    if (!allowed) return res.status(403).json({ message: 'Not authorized' })

    const { data: request } = await supabase
      .from('profile_requests').select('*').eq('id', req.params.id).single()
    if (!request) return res.status(404).json({ message: 'Request not found' })

    // unique_id must be provided by admin in request body
    const { unique_id } = req.body
    if (!unique_id || !unique_id.trim()) {
      return res.status(400).json({ message: 'Unique ID is required' })
    }

    const clubUniqueId  = unique_id.trim()
    // username = everything before '@' in their email
    const username      = request.email.split('@')[0].toLowerCase().replace(/\s+/g, '')
    const guardianPhone = request.guardian_phone || '0000000000'
    // password = UniqueID@GuardianPhone
    const rawPassword   = `${clubUniqueId}@${guardianPhone}`
    const hashedPassword = await bcrypt.hash(rawPassword, 10)

    // Check username not already taken
    const { data: existingUser } = await supabase
      .from('users').select('id').eq('username', username).single()
    if (existingUser) {
      return res.status(400).json({
        message: `Username "${username}" already exists. This email is already registered.`
      })
    }

    // Check unique_id not already assigned
    const { data: existingUID } = await supabase
      .from('users').select('id').eq('unique_id', clubUniqueId).single()
    if (existingUID) {
      return res.status(400).json({
        message: `Unique ID "${clubUniqueId}" is already assigned to another member.`
      })
    }

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{
        username,                          // email prefix
        full_name:     request.full_name,
        email:         request.email,
        password:      hashedPassword,
        unique_id:     clubUniqueId,       // club-assigned unique ID
        roll_number:   request.roll_number, // college roll number (kept separate)
        department:    request.department,
        year:          request.year,
        phone:         request.phone,
        guardian_phone: request.guardian_phone,
        role:          'student'
      }])
      .select().single()

    if (createError) throw createError

    await supabase
      .from('profile_requests')
      .update({ status: 'accepted' })
      .eq('id', req.params.id)

    // Send credentials email
    try {
      const { sendProfileCreatedMail } = require('../services/mailer')
      await sendProfileCreatedMail(newUser, rawPassword)
      console.log(`✅ Credentials sent to ${newUser.email}`)
    } catch (mailErr) {
      console.error('Mail error (non-fatal):', mailErr.message)
      // Don't fail the request — account is created, mail just failed
    }

    res.json({
      message: 'Profile created and credentials sent to user email',
      user: { ...newUser, password: undefined }
    })
  } catch (error) {
    console.error('Accept request error:', error)
    res.status(500).json({ message: 'Failed to accept request', error: error.message })
  }
})

// AUTH — reject profile request
router.put('/profile/:id/reject', auth, async (req, res) => {
  try {
    const { data: me } = await supabase
      .from('users').select('role, committee_post').eq('id', req.user.id).single()
    const allowed = me.role === 'admin' || me.committee_post === 'Chair'
    if (!allowed) return res.status(403).json({ message: 'Not authorized' })

    await supabase
      .from('profile_requests')
      .update({ status: 'rejected' })
      .eq('id', req.params.id)

    res.json({ message: 'Request rejected' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject request' })
  }
})

// ── Password Requests ────────────────────────────────────────────

// PUBLIC — submit password reset request
router.post('/password', async (req, res) => {
  try {
    const { username, email, reason } = req.body
    if (!username || !email) {
      return res.status(400).json({ message: 'Username and email required' })
    }

    // Verify user exists with matching email
    const { data: user } = await supabase
      .from('users').select('id, email').eq('username', username).single()
    if (!user || user.email !== email) {
      return res.status(404).json({ message: 'No account found with that username and email' })
    }

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

// AUTH — get all password requests (admin/chair only)
router.get('/password', auth, async (req, res) => {
  try {
    const { data: me } = await supabase
      .from('users').select('role, committee_post').eq('id', req.user.id).single()
    const allowed = me.role === 'admin' || me.committee_post === 'Chair'
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

// AUTH — approve password reset → resets to UniqueID@GuardianPhone
router.put('/password/:id/approve', auth, async (req, res) => {
  try {
    const { data: me } = await supabase
      .from('users').select('role, committee_post').eq('id', req.user.id).single()
    const allowed = me.role === 'admin' || me.committee_post === 'Chair'
    if (!allowed) return res.status(403).json({ message: 'Not authorized' })

    const { data: request } = await supabase
      .from('password_requests').select('*').eq('id', req.params.id).single()
    if (!request) return res.status(404).json({ message: 'Request not found' })

    const { data: user } = await supabase
      .from('users').select('*').eq('username', request.username).single()
    if (!user) return res.status(404).json({ message: 'User not found' })

    // Reset to UniqueID@GuardianPhone
    const uniqueId      = user.unique_id || user.username
    const guardianPhone = user.guardian_phone || '0000000000'
    const rawPassword   = `${uniqueId}@${guardianPhone}`
    const hashedPassword = await bcrypt.hash(rawPassword, 10)

    await supabase.from('users').update({ password: hashedPassword }).eq('id', user.id)
    await supabase.from('password_requests').update({ status: 'approved' }).eq('id', req.params.id)

    try {
      const { sendPasswordChangedMail } = require('../services/mailer')
      await sendPasswordChangedMail(user, rawPassword)
      console.log(`✅ Password reset mail sent to ${user.email}`)
    } catch (mailErr) {
      console.error('Mail error (non-fatal):', mailErr.message)
    }

    res.json({ message: 'Password reset and email sent to user' })
  } catch (error) {
    console.error('Approve password error:', error)
    res.status(500).json({ message: 'Failed to reset password', error: error.message })
  }
})

// AUTH — reject password request
router.put('/password/:id/reject', auth, async (req, res) => {
  try {
    await supabase
      .from('password_requests')
      .update({ status: 'rejected' })
      .eq('id', req.params.id)
    res.json({ message: 'Request rejected' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject' })
  }
})

module.exports = router

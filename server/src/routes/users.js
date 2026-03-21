const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')
const auth = require('../middleware/auth')
const bcrypt = require('bcryptjs')
const multer = require('multer')
const {
  sendProfileCreatedMail,
  sendProfileUpdatedMail,
  sendProfileDeletedMail
} = require('../services/mailer')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only JPG, PNG, GIF allowed'))
  }
})

// GET all users (excluding admin)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, email, role, department, year, profile_photo_url, bio, is_committee, committee_post')
      .neq('role', 'admin')
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json(data || [])
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' })
  }
})

// GET own profile
router.get('/profile', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, email, role, department, year, profile_photo_url, bio, is_committee, committee_post, roll_number, unique_id, employment_id, guardian_phone, created_at')
      .eq('id', req.user.id)
      .single()
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile' })
  }
})

// PUT own profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { full_name, bio, profile_photo_url, department, year } = req.body
    const updateData = {}
    if (full_name !== undefined)        updateData.full_name        = full_name
    if (bio !== undefined)              updateData.bio              = bio
    if (profile_photo_url !== undefined) updateData.profile_photo_url = profile_photo_url
    if (department !== undefined)       updateData.department       = department
    if (year !== undefined)             updateData.year             = year ? parseInt(year) : null
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.user.id)
      .select('id, username, full_name, email, role, department, year, profile_photo_url, bio, is_committee, committee_post')
      .single()
    if (error) throw error

    try { await sendProfileUpdatedMail(data) } catch (e) { console.error('Mail error (non-fatal):', e.message) }

    res.json(data)
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ message: 'Failed to update profile', error: error.message })
  }
})

// POST upload profile photo
router.post('/profile/photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })

    const ext      = req.file.mimetype.split('/')[1].replace('jpeg', 'jpg')
    const filePath = `${req.user.id}/profile.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')                           // ← fixed from 'profile-photos'
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      })
    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')                           // ← fixed from 'profile-photos'
      .getPublicUrl(filePath)

    const finalUrl = `${publicUrl}?t=${Date.now()}`

    const { error: dbError } = await supabase
      .from('users')
      .update({ profile_photo_url: finalUrl })
      .eq('id', req.user.id)
    if (dbError) throw dbError

    res.json({ profile_photo_url: finalUrl })
  } catch (error) {
    console.error('Photo upload error:', error)
    res.status(500).json({ message: error.message || 'Failed to upload photo' })
  }
})

// GET user by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, email, role, department, year, profile_photo_url, bio, is_committee, committee_post, created_at')
      .eq('id', req.params.id)
      .single()
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(404).json({ message: 'User not found' })
  }
})

// PUT update any user (admin) or self
router.put('/:id', auth, async (req, res) => {
  try {
    const { data: me } = await supabase.from('users').select('role').eq('id', req.user.id).single()
    if (me.role !== 'admin' && req.user.id !== req.params.id)
      return res.status(403).json({ message: 'Not authorized' })

    const allowedFields = [
      'full_name', 'bio', 'profile_photo_url', 'department', 'year',
      'committee_post', 'is_committee', 'guardian_phone', 'roll_number', 'unique_id'
    ]
    const updateData = {}
    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) updateData[f] = req.body[f]
    })
    if (updateData.year !== undefined) updateData.year = updateData.year ? parseInt(updateData.year) : null
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error

    if (updateData.is_committee === true) await autoFriendCommitteeMembers(req.params.id)

    try { await sendProfileUpdatedMail(data) } catch (e) { console.error('Mail error (non-fatal):', e.message) }

    res.json(data)
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ message: 'Failed to update user', error: error.message })
  }
})

// POST admin create user
router.post('/', auth, async (req, res) => {
  try {
    const { data: me } = await supabase.from('users').select('role').eq('id', req.user.id).single()
    if (me.role !== 'admin') return res.status(403).json({ message: 'Admin only' })

    const {
      username, full_name, email, role = 'student',
      department, year, roll_number, unique_id,
      guardian_phone, is_committee, committee_post
    } = req.body

    if (!username || !email) return res.status(400).json({ message: 'Username and email required' })

    const clubId      = unique_id || roll_number || username
    const gPhone      = guardian_phone || '0000000000'
    const rawPassword = `${clubId}@${gPhone}`
    const hashedPassword = await bcrypt.hash(rawPassword, 10)

    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        username,
        full_name,
        email,
        password:      hashedPassword,
        role,
        department,
        year:          year ? parseInt(year) : null,
        roll_number,
        unique_id,
        guardian_phone,
        is_committee,
        committee_post
      }])
      .select()
      .single()

    if (error) throw error

    if (is_committee) await autoFriendCommitteeMembers(newUser.id)

    try { await sendProfileCreatedMail(newUser, rawPassword) } catch (e) { console.error('Mail error (non-fatal):', e.message) }

    delete newUser.password
    res.status(201).json(newUser)
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({ message: 'Failed to create user', error: error.message })
  }
})

// Auto-friend all committee members
const autoFriendCommitteeMembers = async (newMemberId) => {
  try {
    const { data: committee } = await supabase
      .from('users').select('id').eq('is_committee', true).neq('id', newMemberId)
    if (!committee?.length) return
    const friendships = committee.map(m => ({ user_id: newMemberId, friend_id: m.id,    status: 'accepted' }))
    const reverse     = committee.map(m => ({ user_id: m.id,    friend_id: newMemberId, status: 'accepted' }))
    await supabase.from('friendships').upsert(friendships, { onConflict: 'user_id,friend_id' })
    await supabase.from('friendships').upsert(reverse,     { onConflict: 'user_id,friend_id' })
  } catch (error) {
    console.error('Auto-friend error:', error)
  }
}

// PUT update role (admin only)
router.put('/:id/role', auth, async (req, res) => {
  try {
    const { data: me } = await supabase.from('users').select('role').eq('id', req.user.id).single()
    if (me.role !== 'admin') return res.status(403).json({ message: 'Admin access required' })

    const { role } = req.body
    const { data, error } = await supabase
      .from('users').update({ role }).eq('id', req.params.id).select().single()
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update role' })
  }
})

// DELETE user (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { data: me } = await supabase.from('users').select('role').eq('id', req.user.id).single()
    if (me.role !== 'admin') return res.status(403).json({ message: 'Admin access required' })

    const { data: userToDelete } = await supabase
      .from('users').select('*').eq('id', req.params.id).single()

    const { error } = await supabase.from('users').delete().eq('id', req.params.id)
    if (error) throw error

    try { if (userToDelete) await sendProfileDeletedMail(userToDelete) } catch (e) { console.error('Mail error (non-fatal):', e.message) }

    res.json({ message: 'User deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user' })
  }
})

// GET friends list
router.get('/:id/friends', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select('*, friend:friend_id(id, username, full_name, profile_photo_url, is_committee, committee_post)')
      .eq('user_id', req.params.id)
      .eq('status', 'accepted')
    if (error) throw error
    res.json(data?.map(f => f.friend) || [])
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch friends' })
  }
})

module.exports = router

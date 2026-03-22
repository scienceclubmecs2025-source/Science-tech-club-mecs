const express  = require('express')
const router   = express.Router()
const bcrypt   = require('bcryptjs')
const jwt      = require('jsonwebtoken')
const supabase = require('../config/supabase')
const auth     = require('../middleware/auth')

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role = 'student' } = req.body
    const { data: existing } = await supabase
      .from('users').select('*')
      .or(`username.eq.${username},email.eq.${email}`).single()
    if (existing) return res.status(400).json({ message: 'User already exists' })

    const hashedPassword = await bcrypt.hash(password, 10)
    const { data: user, error } = await supabase
      .from('users')
      .insert([{ username, email, password: hashedPassword, role }])
      .select().single()
    if (error) throw error
    res.status(201).json({ message: 'User created successfully', userId: user.id })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Registration failed' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const { data: user, error } = await supabase
      .from('users').select('*').eq('username', username).single()
    if (error || !user) return res.status(401).json({ message: 'Invalid credentials' })

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) return res.status(401).json({ message: 'Invalid credentials' })

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )
    delete user.password
    res.json({ token, user })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Login failed' })
  }
})

// ✅ Verify token — returns FRESH user from DB (fixes stale localStorage)
router.get('/verify', auth, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, full_name, role, is_committee, committee_post, department, year, phone, address, roll_number, unique_id, employment_id, guardian_phone, profile_photo_url, bio, field_of_interest, created_at')
      .eq('id', req.user.id)
      .single()
    if (error) throw error
    delete user.password
    res.json({ user })
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' })
  }
})

// ✅ /me — alias for verify, used by some components
router.get('/me', auth, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, full_name, role, is_committee, committee_post, department, year, phone, address, roll_number, unique_id, employment_id, guardian_phone, profile_photo_url, bio, field_of_interest, created_at')
      .eq('id', req.user.id)
      .single()
    if (error) throw error
    delete user.password
    res.json(user)
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' })
  }
})

// Logout
router.post('/logout', auth, async (req, res) => {
  res.json({ message: 'Logged out successfully' })
})

// Change own password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { current_password, new_password } = req.body
    if (!current_password || !new_password)
      return res.status(400).json({ message: 'Both current and new password required' })

    const { data: user } = await supabase
      .from('users').select('*').eq('id', req.user.id).single()
    if (!user) return res.status(404).json({ message: 'User not found' })

    const valid = await bcrypt.compare(current_password, user.password)
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' })

    const hashed = await bcrypt.hash(new_password, 10)
    await supabase.from('users').update({ password: hashed }).eq('id', req.user.id)
    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to change password' })
  }
})

module.exports = router

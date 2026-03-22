const express    = require('express')
const router     = express.Router()
const supabase   = require('../config/supabase')
const auth       = require('../middleware/auth')
const bcrypt     = require('bcryptjs')
const multer     = require('multer')
const csv        = require('csv-parser')
const { Readable } = require('stream')
const { sendProfileCreatedMail } = require('../services/mailer')

const upload = multer({ storage: multer.memoryStorage() })

const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' })
  next()
}

// GET dashboard stats
router.get('/dashboard', auth, adminAuth, async (req, res) => {
  try {
    const { data: users }    = await supabase.from('users').select('*')
    const { data: courses }  = await supabase.from('courses').select('*')
    const { data: events }   = await supabase.from('events').select('*')
    const { data: projects } = await supabase.from('projects').select('*')
    res.json({
      totalUsers:    users?.length    || 0,
      totalCourses:  courses?.length  || 0,
      totalEvents:   events?.length   || 0,
      totalProjects: projects?.length || 0
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({ message: 'Failed to fetch dashboard' })
  }
})

// ── Add student (manual) ─────────────────────────────────────────
// username  = email prefix
// password  = UniqueID@GuardianNumber
router.post('/add-student', auth, adminAuth, async (req, res) => {
  try {
    const {
      unique_id, name, roll_number, branch, year,
      address, phone, email, guardian_name,
      guardian_number, field_of_interest
    } = req.body

    if (!email || !unique_id || !guardian_number)
      return res.status(400).json({ message: 'email, unique_id, and guardian_number are required' })

    const username       = email.split('@')[0].toLowerCase()
    const rawPassword    = `${unique_id}@${guardian_number}`
    const hashedPassword = await bcrypt.hash(rawPassword, 10)

    const { data, error } = await supabase
      .from('users')
      .insert([{
        username,
        email,
        password:         hashedPassword,
        full_name:        name,
        roll_number,
        unique_id,
        department:       branch,
        year:             parseInt(year) || 1,
        phone,
        address,
        guardian_name,
        guardian_phone:   guardian_number,
        field_of_interest,
        role: 'student'
      }])
      .select('id, username, email, full_name')
      .single()

    if (error) throw error

    try { await sendProfileCreatedMail(data, rawPassword) } catch (e) { console.error('Mail error (non-fatal):', e.message) }

    res.status(201).json({ message: 'Student added successfully', user: data })
  } catch (error) {
    console.error('Add student error:', error)
    res.status(500).json({ message: error.message || 'Failed to add student' })
  }
})

// ── Add faculty (manual) ─────────────────────────────────────────
// username  = emp_code
// password  = emp_code (faculty can change later)
router.post('/add-faculty', auth, adminAuth, async (req, res) => {
  try {
    const { full_name, emp_code, department } = req.body

    if (!emp_code)
      return res.status(400).json({ message: 'emp_code is required' })

    const username       = emp_code.trim()
    const rawPassword    = emp_code.trim()
    const hashedPassword = await bcrypt.hash(rawPassword, 10)

    const { data, error } = await supabase
      .from('users')
      .insert([{
        username,
        full_name:     full_name || '',
        password:      hashedPassword,
        employment_id: emp_code.trim(),
        department,
        role: 'faculty'
      }])
      .select()
      .single()

    if (error) throw error

    try { await sendProfileCreatedMail(data, rawPassword) } catch (e) { console.error('Mail error (non-fatal):', e.message) }

    res.json({ message: 'Faculty added successfully', user: data })
  } catch (error) {
    console.error('Add faculty error:', error)
    res.status(500).json({ message: error.message || 'Failed to add faculty' })
  }
})

// ── Upload students CSV ──────────────────────────────────────────
// Format: UNIQUE_ID, NAME, ROLL-NO, BRANCH, YEAR, ADDRESS,
//         PHONE NO, EMAIL ID, FATHER/GUARDIAN NAME,
//         FATHER/GUARDIAN NUMBER, FIELD OF INTEREST

router.post('/upload-students', auth, adminAuth, upload.single('file'), async (req, res) => {
  try {
    const results = []
    const errors  = []
    const rows    = []

    await new Promise((resolve, reject) => {
      const cleaned = req.file.buffer
        .toString('utf8')
        .replace(/^\uFEFF/, '')      // strip BOM
        .replace(/\r\n/g, '\n')      // normalize Windows line endings
        .replace(/\r/g, '\n')        // normalize old Mac line endings
      const stream = Readable.from(cleaned)
      stream.pipe(csv()).on('data', r => rows.push(r)).on('end', resolve).on('error', reject)
    })

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      const get = (...keys) => {
        for (const k of keys) {
          const found = Object.keys(row).find(rk => rk.trim().replace(/\r/g, '').toLowerCase() === k.toLowerCase())
          if (found && row[found]?.trim()) return row[found].trim().replace(/\r/g, '').replace(/\n/g, '')
        }
        return ''
      }

      const unique_id         = get('UNIQUE_ID', 'unique_id', 'unique id').replace(/\s/g, '')
      const name              = get('NAME', 'name')
      const roll_number       = get('ROLL-NO', 'roll_no', 'roll_number', 'rollno')
      const branch            = get('BRANCH', 'branch', 'department')
      const year              = get('YEAR', 'year')
      const address           = get('ADDRESS', 'address')
      const phone             = get('PHONE NO', 'phone_no', 'phone', 'phoneno').replace(/\s/g, '')
      const email             = get('EMAIL ID', 'email_id', 'email').replace(/\s/g, '')
      const guardian_name     = get('FATHER/GUARDIAN NAME', 'FATHERGUARDIAN NAME', 'guardian_name')
      const guardian_number   = get('FATHER/GUARDIAN NUMBER', 'FATHERGUARDIAN NUMBER', 'guardian_number').replace(/\s/g, '')
      const field_of_interest = get('FIELD OF INTEREST', 'field_of_interest', 'field')

      if (!email || !unique_id || !guardian_number) {
        errors.push(`Row ${i + 2}: missing email, unique_id, or guardian_number`)
        continue
      }

      const username       = email.split('@')[0].toLowerCase()
      const rawPassword    = `${unique_id}@${guardian_number}`
      const hashedPassword = await bcrypt.hash(rawPassword, 10)

      // 🔍 Remove this log after confirming it works
      console.log(`Row ${i+2}: username=${username} | password=${rawPassword}`)

      const { data, error } = await supabase.from('users').insert([{
        username,
        email,
        password:         hashedPassword,
        full_name:        name,
        roll_number,
        unique_id,
        department:       branch,
        year:             parseInt(year) || 1,
        phone,
        address,
        guardian_name,
        guardian_phone:   guardian_number,
        field_of_interest,
        role: 'student'
      }]).select('id, username, email, full_name').single()

      if (error) {
        errors.push(`Row ${i + 2} (${email}): ${error.message}`)
      } else {
        results.push(email)
        try { await sendProfileCreatedMail(data, rawPassword) } catch (e) { console.error('Mail error:', e.message) }
      }
    }

    res.json({
      message: `Uploaded ${results.length} students, ${errors.length} failed`,
      success: results,
      errors
    })
  } catch (error) {
    console.error('Upload students error:', error)
    res.status(500).json({ message: 'Failed to upload students', error: error.message })
  }
})

// ── Upload faculty CSV ───────────────────────────────────────────
// Format: SNo, Emp code, Employee Name
// username  = Emp code
// password  = Emp code (faculty changes later)
router.post('/upload-faculty', auth, adminAuth, upload.single('file'), async (req, res) => {
  try {
    const results = []
    const errors  = []
    const rows    = []

    await new Promise((resolve, reject) => {
      const stream = Readable.from(req.file.buffer.toString('utf8'))
      stream.pipe(csv()).on('data', r => rows.push(r)).on('end', resolve).on('error', reject)
    })

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      const get = (...keys) => {
        for (const k of keys) {
          const found = Object.keys(row).find(rk => rk.trim().toLowerCase() === k.toLowerCase())
          if (found && row[found]?.trim()) return row[found].trim()
        }
        return ''
      }

      const emp_code  = get('Emp code', 'emp_code', 'emp code', 'EMPCODE', 'employment_id')
      const full_name = get('Employee Name', 'employee_name', 'name', 'NAME')
      // SNo is ignored — just for reference

      if (!emp_code) {
        errors.push(`Row ${i + 2}: missing Emp code`)
        continue
      }

      const username       = emp_code.trim()
      const rawPassword    = emp_code.trim()
      const hashedPassword = await bcrypt.hash(rawPassword, 10)

      const { data, error } = await supabase.from('users').insert([{
        username,
        full_name:     full_name || '',
        password:      hashedPassword,
        employment_id: emp_code.trim(),
        role: 'faculty'
      }]).select('id, username, full_name, employment_id').single()

      if (error) {
        errors.push(`Row ${i + 2} (${emp_code}): ${error.message}`)
      } else {
        results.push(emp_code)
        try { await sendProfileCreatedMail(data, rawPassword) } catch (e) { console.error('Mail error:', e.message) }
      }
    }

    res.json({
      message: `Uploaded ${results.length} faculty, ${errors.length} failed`,
      success: results,
      errors
    })
  } catch (error) {
    console.error('Upload faculty error:', error)
    res.status(500).json({ message: 'Failed to upload faculty', error: error.message })
  }
})

module.exports = router

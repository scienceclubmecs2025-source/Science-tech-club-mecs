const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { Readable } = require('stream');

const upload = multer({ storage: multer.memoryStorage() });

// Admin middleware
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// Get dashboard stats
router.get('/dashboard', auth, adminAuth, async (req, res) => {
  try {
    const { data: users }    = await supabase.from('users').select('*');
    const { data: courses }  = await supabase.from('courses').select('*');
    const { data: events }   = await supabase.from('events').select('*');
    const { data: projects } = await supabase.from('projects').select('*');

    res.json({
      totalUsers:    users?.length    || 0,
      totalCourses:  courses?.length  || 0,
      totalEvents:   events?.length   || 0,
      totalProjects: projects?.length || 0
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard' });
  }
});

// ── Add student (manual) ─────────────────────────────────────────
router.post('/add-student', auth, adminAuth, async (req, res) => {
  try {
    const {
      unique_id, name, roll_number, branch, year,
      address, phone, email, guardian_name,
      guardian_number, field_of_interest
    } = req.body;

    if (!email || !unique_id || !guardian_number) {
      return res.status(400).json({ message: 'email, unique_id, and guardian_number are required' });
    }

    const username = email.split('@')[0];
    const password = `${guardian_number}@${unique_id}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert([{
        username,
        email,
        password: hashedPassword,
        full_name: name,
        roll_number,
        department: branch,
        year: parseInt(year) || 1,
        phone,
        address,
        guardian_name,
        guardian_number,
        field_of_interest,
        unique_id,
        role: 'student'
      }])
      .select('id, username, email, full_name')
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Student added successfully', user: data });
  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ message: error.message || 'Failed to add student' });
  }
});

// ── Add faculty (manual) ─────────────────────────────────────────
router.post('/add-faculty', auth, adminAuth, async (req, res) => {
  try {
    const { username, email, password, employment_id, department } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert([{
        username,
        email,
        password: hashedPassword,
        employment_id,
        department,
        role: 'faculty'
      }])
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Faculty added successfully', user: data });
  } catch (error) {
    console.error('Add faculty error:', error);
    res.status(500).json({ message: error.message || 'Failed to add faculty' });
  }
});

// ── Upload students CSV ──────────────────────────────────────────
router.post('/upload-students', auth, adminAuth, upload.single('file'), async (req, res) => {
  try {
    const results = [];
    const errors  = [];
    const rows    = [];

    // Parse CSV from memory buffer
    await new Promise((resolve, reject) => {
      const stream = Readable.from(req.file.buffer.toString('utf8'));
      stream
        .pipe(csv())
        .on('data', (row) => rows.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Normalize keys — handle spaces and slashes in header names
      const get = (...keys) => {
        for (const k of keys) {
          const found = Object.keys(row).find(
            rk => rk.trim().toLowerCase() === k.toLowerCase()
          );
          if (found && row[found]?.trim()) return row[found].trim();
        }
        return '';
      };

      const unique_id       = get('UNIQUE_ID', 'unique_id', 'unique id');
      const name            = get('NAME', 'name');
      const roll_number     = get('ROLL-NO', 'roll_no', 'roll_number', 'rollno');
      const branch          = get('BRANCH', 'branch', 'department');
      const year            = get('YEAR', 'year');
      const address         = get('ADDRESS', 'address');
      const phone           = get('PHONE NO', 'phone_no', 'phone', 'phoneno');
      const email           = get('EMAIL ID', 'email_id', 'email');
      const guardian_name   = get('FATHER/GUARDIAN NAME', 'father/guardian_name', 'guardian_name');
      const guardian_number = get('FATHER/GUARDIAN NUMBER', 'father/guardian_number', 'guardian_number');
      const field_of_interest = get('FIELD OF INTEREST', 'field_of_interest', 'field');

      if (!email || !unique_id || !guardian_number) {
        errors.push(`Row ${i + 2}: missing email, unique_id, or guardian_number`);
        continue;
      }

      const username = email.split('@')[0];
      const password = `${guardian_number}@${unique_id}`;
      const hashedPassword = await bcrypt.hash(password, 10);

      const { error } = await supabase.from('users').insert([{
        username,
        email,
        password: hashedPassword,
        full_name: name,
        roll_number,
        department: branch,
        year: parseInt(year) || 1,
        phone,
        address,
        guardian_name,
        guardian_number,
        field_of_interest,
        unique_id,
        role: 'student'
      }]);

      if (error) errors.push(`Row ${i + 2} (${email}): ${error.message}`);
      else results.push(email);
    }

    res.json({
      message: `Uploaded ${results.length} students, ${errors.length} failed`,
      success: results,
      errors
    });
  } catch (error) {
    console.error('Upload students error:', error);
    res.status(500).json({ message: 'Failed to upload students', error: error.message });
  }
});

// ── Upload faculty CSV ───────────────────────────────────────────
router.post('/upload-faculty', auth, adminAuth, upload.single('file'), async (req, res) => {
  try {
    const results = [];
    const errors  = [];
    const rows    = [];

    await new Promise((resolve, reject) => {
      const stream = Readable.from(req.file.buffer.toString('utf8'));
      stream
        .pipe(csv())
        .on('data', (row) => rows.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const email         = (row['email'] || row['EMAIL'] || '').trim();
      const employment_id = (row['employment_id'] || row['EMPLOYMENT_ID'] || '').trim();
      const department    = (row['department'] || row['DEPARTMENT'] || row['BRANCH'] || '').trim();

      if (!email || !employment_id) {
        errors.push(`Row ${i + 2}: missing email or employment_id`);
        continue;
      }

      const username = email.split('@')[0];
      const hashedPassword = await bcrypt.hash(employment_id, 10);

      const { error } = await supabase.from('users').insert([{
        username,
        email,
        password: hashedPassword,
        employment_id,
        department,
        role: 'faculty'
      }]);

      if (error) errors.push(`Row ${i + 2} (${email}): ${error.message}`);
      else results.push(email);
    }

    res.json({
      message: `Uploaded ${results.length} faculty, ${errors.length} failed`,
      success: results,
      errors
    });
  } catch (error) {
    console.error('Upload faculty error:', error);
    res.status(500).json({ message: 'Failed to upload faculty', error: error.message });
  }
});

module.exports = router;

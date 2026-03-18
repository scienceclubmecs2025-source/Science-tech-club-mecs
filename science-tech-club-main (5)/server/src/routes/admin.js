const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

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
    const { data: users } = await supabase.from('users').select('*');
    const { data: courses } = await supabase.from('courses').select('*');
    const { data: events } = await supabase.from('events').select('*');
    const { data: projects } = await supabase.from('projects').select('*');

    res.json({
      totalUsers: users?.length || 0,
      totalCourses: courses?.length || 0,
      totalEvents: events?.length || 0,
      totalProjects: projects?.length || 0
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard' });
  }
});

// Add student
router.post('/add-student', auth, adminAuth, async (req, res) => {
  try {
    const { username, email, password, roll_number, department, year, dob } = req.body;
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert([{
        username,
        email,
        password: hashedPassword,
        roll_number,
        department,
        year,
        dob,
        role: 'student'
      }])
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Student added successfully', user: data });
  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ message: error.message || 'Failed to add student' });
  }
});

// Add faculty
router.post('/add-faculty', auth, adminAuth, async (req, res) => {
  try {
    const { username, email, password, employment_id, department } = req.body;
    const bcrypt = require('bcryptjs');
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

// Upload students CSV
router.post('/upload-students', auth, adminAuth, upload.single('file'), async (req, res) => {
  try {
    const students = [];
    const bcrypt = require('bcryptjs');

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        students.push(row);
      })
      .on('end', async () => {
        try {
          for (const student of students) {
            const dobParts = student.dob.split('-');
            const username = `${student.surname}${dobParts[2]}${dobParts[1]}${dobParts[0].slice(-2)}`;
            const hashedPassword = await bcrypt.hash(student.roll_number, 10);

            await supabase.from('users').insert([{
              username,
              email: student.email,
              password: hashedPassword,
              roll_number: student.roll_number,
              department: student.department,
              year: parseInt(student.year),
              dob: student.dob,
              role: 'student'
            }]);
          }

          fs.unlinkSync(req.file.path);
          res.json({ message: 'Students uploaded successfully', count: students.length });
        } catch (error) {
          console.error('CSV processing error:', error);
          res.status(500).json({ message: 'Failed to process CSV' });
        }
      });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Failed to upload students' });
  }
});

// Upload faculty CSV
router.post('/upload-faculty', auth, adminAuth, upload.single('file'), async (req, res) => {
  try {
    const faculty = [];
    const bcrypt = require('bcryptjs');

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        faculty.push(row);
      })
      .on('end', async () => {
        try {
          for (const fac of faculty) {
            const username = fac.email.split('@')[0];
            const hashedPassword = await bcrypt.hash(fac.employment_id, 10);

            await supabase.from('users').insert([{
              username,
              email: fac.email,
              password: hashedPassword,
              employment_id: fac.employment_id,
              department: fac.department,
              role: 'faculty'
            }]);
          }

          fs.unlinkSync(req.file.path);
          res.json({ message: 'Faculty uploaded successfully', count: faculty.length });
        } catch (error) {
          console.error('CSV processing error:', error);
          res.status(500).json({ message: 'Failed to process CSV' });
        }
      });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Failed to upload faculty' });
  }
});

module.exports = router;

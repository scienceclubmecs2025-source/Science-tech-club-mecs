const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');
const { checkCommitteeRole } = require('../middleware/committeeAuth');

// Get students by department (dept heads)
router.get('/:department/students', auth, checkCommitteeRole('dept_head', 'dept_vice_head', 'chair'), async (req, res) => {
  try {
    const { department } = req.params;

    // Check if user manages this department (unless chair)
    if (req.user.committee_role !== 'chair' && req.user.managed_department !== department) {
      return res.status(403).json({ message: 'Can only view your own department' });
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, email, year, roll_number, profile_photo_url, created_at')
      .eq('department', department)
      .order('year', { ascending: true });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('❌ Fetch department students error:', error);
    res.status(500).json({ message: 'Failed to fetch students', error: error.message });
  }
});

// Get department statistics
router.get('/:department/stats', auth, checkCommitteeRole('dept_head', 'dept_vice_head', 'chair'), async (req, res) => {
  try {
    const { department } = req.params;

    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('department', department);

    if (error) throw error;

    // Get year-wise breakdown
    const { data: yearData, error: yearError } = await supabase
      .from('users')
      .select('year')
      .eq('department', department);

    if (yearError) throw yearError;

    const yearBreakdown = yearData.reduce((acc, { year }) => {
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {});

    res.json({
      total_students: count,
      year_breakdown: yearBreakdown
    });
  } catch (error) {
    console.error('❌ Fetch department stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
});

// Update student details (dept heads only, not vice)
router.put('/:department/students/:studentId', auth, checkCommitteeRole('dept_head', 'chair'), async (req, res) => {
  try {
    const { department, studentId } = req.params;
    const { year, roll_number } = req.body;

    // Check if user manages this department
    if (req.user.committee_role !== 'chair' && req.user.managed_department !== department) {
      return res.status(403).json({ message: 'Can only manage your own department' });
    }

    const updateData = { updated_at: new Date().toISOString() };
    if (year) updateData.year = year;
    if (roll_number) updateData.roll_number = roll_number;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', studentId)
      .eq('department', department)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('❌ Update student error:', error);
    res.status(500).json({ message: 'Failed to update student', error: error.message });
  }
});

module.exports = router;

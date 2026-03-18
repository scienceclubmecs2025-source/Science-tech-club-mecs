const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Get active report format
router.get('/active', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('report_formats')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    res.json(data || null);
  } catch (error) {
    console.error('❌ Fetch active format error:', error);
    res.status(500).json({ message: 'Failed to fetch report format', error: error.message });
  }
});

// Get all report formats
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('report_formats')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('❌ Fetch formats error:', error);
    res.status(500).json({ message: 'Failed to fetch report formats', error: error.message });
  }
});

// Upload report format (admin only)
router.post('/upload', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { title, academic_year, file_url, file_name } = req.body;

    const { data, error } = await supabase
      .from('report_formats')
      .insert([{
        title,
        academic_year,
        file_url,
        file_name,
        is_active: false
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('❌ Upload format error:', error);
    res.status(500).json({ message: 'Failed to upload format', error: error.message });
  }
});

// Activate report format (admin only)
router.put('/:id/activate', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Deactivate all formats first
    await supabase
      .from('report_formats')
      .update({ is_active: false })
      .neq('id', 0);

    // Activate the selected format
    const { data, error } = await supabase
      .from('report_formats')
      .update({ is_active: true })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('❌ Activate format error:', error);
    res.status(500).json({ message: 'Failed to activate format', error: error.message });
  }
});

// Delete report format (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { error } = await supabase
      .from('report_formats')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Format deleted' });
  } catch (error) {
    console.error('❌ Delete format error:', error);
    res.status(500).json({ message: 'Failed to delete format', error: error.message });
  }
});

module.exports = router;

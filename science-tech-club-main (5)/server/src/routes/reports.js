const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.doc', '.docx', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only .doc, .docx and .pdf files allowed'));
  }
});

// Get all report formats
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('report_formats')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Fetch report formats error:', error);
    res.status(500).json({ message: 'Failed to fetch report formats' });
  }
});

// Upload report format (admin only)
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, academic_year } = req.body;
    if (!title || !academic_year) {
      return res.status(400).json({ message: 'Title and academic year are required' });
    }

    // Upload to Supabase Storage
    const fileName = `report-formats/${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('reports')
      .getPublicUrl(fileName);

    // Save to DB
    const { data, error } = await supabase
      .from('report_formats')
      .insert([{
        title,
        academic_year,
        file_name: req.file.originalname,
        file_url: urlData.publicUrl,
        file_path: fileName,
        is_active: false,
        uploaded_by: req.user.id
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Upload report format error:', error);
    res.status(500).json({ message: 'Failed to upload format', error: error.message });
  }
});

// Activate report format
router.put('/:id/activate', auth, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Deactivate all first
    await supabase
      .from('report_formats')
      .update({ is_active: false })
      .neq('id', req.params.id);

    // Activate selected
    const { data, error } = await supabase
      .from('report_formats')
      .update({ is_active: true })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to activate format' });
  }
});

// Delete report format
router.delete('/:id', auth, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Get file path first
    const { data: format } = await supabase
      .from('report_formats')
      .select('file_path')
      .eq('id', req.params.id)
      .single();

    // Delete from storage
    if (format?.file_path) {
      await supabase.storage.from('reports').remove([format.file_path]);
    }

    // Delete from DB
    const { error } = await supabase
      .from('report_formats')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Format deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete format' });
  }
});

module.exports = router;

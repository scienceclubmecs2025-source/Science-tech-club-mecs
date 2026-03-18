const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

const DEFAULT_CONFIG = {
  site_name: 'Science & Tech Club',
  logo_url: '',
  mecs_logo_url: '',
  theme_mode: 'dark',
  primary_color: '3b82f6',
  watermark_opacity: 0.25
};

// GET /api/config — public
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('site_config')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    // Always return a valid object
    res.json(data || DEFAULT_CONFIG);
  } catch (error) {
    console.error('Config fetch error:', error);
    res.json(DEFAULT_CONFIG);
  }
});

// PUT /api/config — admin only
router.put('/', auth, async (req, res) => {
  try {
    const {
      site_name,
      logo_url,
      mecs_logo_url,
      theme_mode,
      primary_color,
      watermark_opacity
    } = req.body;

    const { data: existing } = await supabase
      .from('site_config')
      .select('id')
      .limit(1)
      .maybeSingle();

    let result;

    if (existing) {
      const { data, error } = await supabase
        .from('site_config')
        .update({
          site_name,
          logo_url,
          mecs_logo_url,
          theme_mode,
          primary_color,
          watermark_opacity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('site_config')
        .insert([{
          site_name,
          logo_url,
          mecs_logo_url,
          theme_mode,
          primary_color,
          watermark_opacity
        }])
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    res.json(result);
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({ message: 'Failed to update config', error: error.message });
  }
});

// IMPORTANT: export the router, not an object
module.exports = router;


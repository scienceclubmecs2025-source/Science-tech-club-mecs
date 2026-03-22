const express = require('express')
const router  = express.Router()
const supabase = require('../config/supabase')
const auth     = require('../middleware/auth')

const DEFAULT_CONFIG = {
  site_name:         'Science & Tech Club',
  logo_url:          '',
  mecs_logo_url:     '',
  theme_mode:        'dark',
  primary_color:     '3b82f6',
  watermark_opacity: 0.25
}

// GET /api/config — public, never throws 500
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('site_config')
      .select('*')
      .limit(1)
      .maybeSingle()

    // If table missing or any error, silently return defaults
    if (error) {
      console.warn('Config fetch warning (returning defaults):', error.message)
      return res.json(DEFAULT_CONFIG)
    }

    res.json(data || DEFAULT_CONFIG)
  } catch (err) {
    console.error('Config fetch error:', err)
    res.json(DEFAULT_CONFIG)   // always 200, never 500
  }
})

// PUT /api/config — admin only
router.put('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ message: 'Access denied' })

    const payload = {
      site_name:         req.body.site_name         ?? DEFAULT_CONFIG.site_name,
      logo_url:          req.body.logo_url          ?? '',
      mecs_logo_url:     req.body.mecs_logo_url     ?? '',
      theme_mode:        req.body.theme_mode         ?? 'dark',
      primary_color:     req.body.primary_color      ?? '3b82f6',
      watermark_opacity: parseFloat(req.body.watermark_opacity) || 0.25,
      updated_at:        new Date().toISOString()
    }

    const { data: existing } = await supabase
      .from('site_config')
      .select('id')
      .limit(1)
      .maybeSingle()

    let result

    if (existing) {
      const { data, error } = await supabase
        .from('site_config')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      result = data
    } else {
      const { data, error } = await supabase
        .from('site_config')
        .insert([payload])
        .select()
        .single()
      if (error) throw error
      result = data
    }

    res.json(result)
  } catch (err) {
    console.error('Config update error:', err)
    res.status(500).json({ message: 'Failed to update config', error: err.message })
  }
})

module.exports = router

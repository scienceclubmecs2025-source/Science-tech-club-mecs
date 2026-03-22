const express  = require('express')
const router   = express.Router()
const supabase = require('../config/supabase')
const auth     = require('../middleware/auth')

const DEFAULT_CONFIG = {
  site_name:         'Science & Tech Club',
  logo_url:          '',
  mecs_logo_url:     '',
  theme_mode:        'dark',
  primary_color:     '3b82f6',
  watermark_opacity: '0.25',
  canva_link:        '',
  instagram:         '',
  youtube:           '',
  linkedin:          '',
  twitter:           '',
  website:           '',
  whatsapp:          ''
}

const rowsToObject = (rows) => {
  const obj = { ...DEFAULT_CONFIG }
  if (Array.isArray(rows)) {
    rows.forEach(r => { if (r.key) obj[r.key] = r.value })
  }
  return obj
}

// GET /api/config — public
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('site_config')
      .select('key, value')

    if (error) {
      console.warn('Config fetch warning:', error.message)
      return res.json(DEFAULT_CONFIG)
    }

    res.json(rowsToObject(data))
  } catch (err) {
    console.error('Config fetch error:', err)
    res.json(DEFAULT_CONFIG)
  }
})

// PUT /api/config — admin only
router.put('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ message: 'Access denied' })

    const fields = {
      site_name:         req.body.site_name         ?? DEFAULT_CONFIG.site_name,
      logo_url:          req.body.logo_url          ?? '',
      mecs_logo_url:     req.body.mecs_logo_url     ?? '',
      theme_mode:        req.body.theme_mode        ?? 'dark',
      primary_color:     req.body.primary_color     ?? '3b82f6',
      watermark_opacity: String(req.body.watermark_opacity ?? '0.25'),
      canva_link:        req.body.canva_link        ?? '',
      instagram:         req.body.instagram         ?? '',
      youtube:           req.body.youtube           ?? '',
      linkedin:          req.body.linkedin          ?? '',
      twitter:           req.body.twitter           ?? '',
      website:           req.body.website           ?? '',
      whatsapp:          req.body.whatsapp          ?? ''
    }

    const now = new Date().toISOString()

    const upserts = Object.entries(fields).map(([key, value]) =>
      supabase
        .from('site_config')
        .upsert({ key, value, updated_at: now }, { onConflict: 'key' })
    )

    await Promise.all(upserts)
    res.json(fields)
  } catch (err) {
    console.error('Config update error:', err)
    res.status(500).json({ message: 'Failed to update config', error: err.message })
  }
})

module.exports = router

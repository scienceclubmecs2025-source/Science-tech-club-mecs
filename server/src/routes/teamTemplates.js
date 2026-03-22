const express  = require('express')
const router   = express.Router()
const supabase = require('../config/supabase')
const auth     = require('../middleware/auth')

router.get('/', auth, async (req, res) => {
  try {
    const { team } = req.query
    let query = supabase.from('team_templates').select('*').order('created_at', { ascending: false })
    if (team) query = query.eq('team', team)
    const { data, error } = await query
    if (error) throw error
    res.json(data || [])
  } catch (err) {
    console.error('GET /team-templates error:', err)
    res.status(500).json({ message: 'Failed to fetch templates' })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    const { title, link, team } = req.body
    if (!title || !link || !team)
      return res.status(400).json({ message: 'title, link and team are required' })
    if (req.user.role !== 'admin')
      return res.status(403).json({ message: 'Admin only' })
    const { data, error } = await supabase
      .from('team_templates')
      .insert({ title, link, team, created_by: req.user.id })
      .select().single()
    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    console.error('POST /team-templates error:', err)
    res.status(500).json({ message: 'Failed to save template' })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ message: 'Admin only' })
    const { error } = await supabase.from('team_templates').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ message: 'Deleted' })
  } catch (err) {
    console.error('DELETE /team-templates error:', err)
    res.status(500).json({ message: 'Failed to delete' })
  }
})

module.exports = router

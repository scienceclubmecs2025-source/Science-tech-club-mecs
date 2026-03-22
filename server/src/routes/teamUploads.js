import express from 'express'
import { supabase } from '../db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// ── GET /team-uploads?team=executive|representative|design  (or all) ──
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { team } = req.query
    let query = supabase
      .from('team_uploads')
      .select(`
        *,
        uploader:uploaded_by (
          id, full_name, username, committee_post
        )
      `)
      .order('created_at', { ascending: false })

    if (team) query = query.eq('team', team)

    const { data, error } = await query
    if (error) throw error
    res.json(data || [])
  } catch (err) {
    console.error('GET /team-uploads error:', err)
    res.status(500).json({ message: 'Failed to fetch uploads' })
  }
})

// ── POST /team-uploads ──
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, link, category, team } = req.body
    const userId = req.user.id

    if (!title || !link || !team) {
      return res.status(400).json({ message: 'title, link and team are required' })
    }

    // Validate the user belongs to the team they're posting to
    const allowedPosts = {
      executive:      ['Executive Head', 'Executive Member'],
      representative: ['Representative Head', 'Representative Member'],
      design:         ['Designing Head', 'Designing Team'],
    }
    const { data: user } = await supabase
      .from('users').select('committee_post, role').eq('id', userId).single()

    const allowed = allowedPosts[team] || []
    if (user?.role !== 'admin' && !allowed.includes(user?.committee_post)) {
      return res.status(403).json({ message: 'Not authorized for this team' })
    }

    const { data, error } = await supabase
      .from('team_uploads')
      .insert({ title, description, link, category, team, uploaded_by: userId })
      .select(`*, uploader:uploaded_by(id, full_name, username, committee_post)`)
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    console.error('POST /team-uploads error:', err)
    res.status(500).json({ message: 'Failed to create upload' })
  }
})

// ── DELETE /team-uploads/:id ──
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Only uploader or admin can delete
    const { data: upload } = await supabase
      .from('team_uploads').select('uploaded_by').eq('id', id).single()

    if (!upload) return res.status(404).json({ message: 'Upload not found' })

    const { data: user } = await supabase
      .from('users').select('role, committee_post').eq('id', userId).single()

    const isHead = ['Executive Head','Representative Head','Designing Head'].includes(user?.committee_post)
    if (user?.role !== 'admin' && upload.uploaded_by !== userId && !isHead) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    const { error } = await supabase.from('team_uploads').delete().eq('id', id)
    if (error) throw error
    res.json({ message: 'Deleted' })
  } catch (err) {
    console.error('DELETE /team-uploads error:', err)
    res.status(500).json({ message: 'Failed to delete' })
  }
})

export default router

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Helper — normalize tech_stack to array regardless of input type
const normalizeTechStack = (tech_stack) => {
  if (Array.isArray(tech_stack)) return tech_stack.filter(Boolean)
  if (typeof tech_stack === 'string' && tech_stack.trim())
    return tech_stack.split(',').map(s => s.trim()).filter(Boolean)
  return []
}

// Get all projects
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        creator:created_by(id, username, full_name, profile_photo_url),
        members:project_members(
          *,
          user:user_id(id, username, full_name, profile_photo_url)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Fetch projects error:', error);
    res.status(500).json({ message: 'Failed to fetch projects', error: error.message });
  }
});

// Get single project
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        creator:created_by(id, username, full_name, profile_photo_url),
        members:project_members(
          *,
          user:user_id(id, username, full_name, profile_photo_url)
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Fetch project error:', error);
    res.status(500).json({ message: 'Failed to fetch project', error: error.message });
  }
});

// Create project — any logged-in user
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, tech_stack, vacancies, github_url, status } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([{
        title,
        description,
        tech_stack:  normalizeTechStack(tech_stack),   // ✅ always an array
        vacancies:   Number(vacancies) || 0,
        github_url:  github_url || null,
        status:      status || 'active',
        created_by:  req.user.id
      }])
      .select(`
        *,
        creator:created_by(id, username, full_name, profile_photo_url)
      `)
      .single();

    if (error) {
      console.error('Supabase insert error:', error.message, error.details, error.hint);
      throw error;
    }

    // Auto-add creator as member
    await supabase.from('project_members').insert([{
      project_id: data.id,
      user_id:    req.user.id,
      role:       'owner'
    }]);

    res.status(201).json(data);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Failed to create project', error: error.message });
  }
});

// Update project
router.put('/:id', auth, async (req, res) => {
  try {
    const { data: project } = await supabase
      .from('projects')
      .select('created_by')
      .eq('id', req.params.id)
      .single();

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (project.created_by !== req.user.id && user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description, tech_stack, vacancies, github_url, status } = req.body;

    const { data, error } = await supabase
      .from('projects')
      .update({
        title,
        description,
        tech_stack:  normalizeTechStack(tech_stack),   // ✅ always an array
        vacancies:   Number(vacancies) || 0,
        github_url:  github_url || null,
        status,
        updated_at:  new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Failed to update project', error: error.message });
  }
});

// Join project
router.post('/:id/join', auth, async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (existing) return res.status(400).json({ message: 'Already a member' });

    const { data, error } = await supabase
      .from('project_members')
      .insert([{ project_id: req.params.id, user_id: req.user.id, role: 'member' }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Join project error:', error);
    res.status(500).json({ message: 'Failed to join project', error: error.message });
  }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    const { data: project } = await supabase
      .from('projects')
      .select('created_by')
      .eq('id', req.params.id)
      .single();

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (project.created_by !== req.user.id && user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await supabase.from('project_members').delete().eq('project_id', req.params.id);
    const { error } = await supabase.from('projects').delete().eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Project deleted' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Failed to delete project', error: error.message });
  }
});

module.exports = router;

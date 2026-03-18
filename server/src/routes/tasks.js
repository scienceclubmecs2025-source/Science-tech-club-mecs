const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Get all tasks for current user
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .or(`created_by.eq.${req.user.id},assigned_to.eq.${req.user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Fetch tasks error:', error);
      throw error;
    }

    res.json(data || []);
  } catch (error) {
    console.error('❌ Get tasks error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch tasks',
      error: error.message 
    });
  }
});

// Get single task by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      console.error('❌ Fetch task error:', error);
      throw error;
    }

    // Check permission
    if (data.created_by !== req.user.id && data.assigned_to !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(data);
  } catch (error) {
    console.error('❌ Get task error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch task',
      error: error.message 
    });
  }
});

// Create new task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, due_date, priority, assigned_to } = req.body;

    // Validate required fields
    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Build task data
    const taskData = {
      title: title.trim(),
      status: 'pending',
      created_by: req.user.id
    };

    // Add optional fields only if they have values
    if (description && description.trim() !== '') {
      taskData.description = description.trim();
    }

    if (priority && ['low', 'medium', 'high'].includes(priority)) {
      taskData.priority = priority;
    } else {
      taskData.priority = 'medium';
    }

    if (due_date && due_date !== '') {
      taskData.due_date = due_date;
    }

    if (assigned_to && assigned_to !== '') {
      taskData.assigned_to = assigned_to;
    }

    console.log('📝 Creating task with data:', taskData);

    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) {
      console.error('❌ Create task error:', error);
      throw error;
    }

    console.log('✅ Task created:', data.id);
    res.status(201).json(data);
  } catch (error) {
    console.error('❌ Create task error:', error);
    res.status(500).json({ 
      message: 'Failed to create task',
      error: error.message 
    });
  }
});

// Update task
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if task exists and user has permission
    const { data: task } = await supabase
      .from('tasks')
      .select('created_by, assigned_to')
      .eq('id', req.params.id)
      .single();

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.created_by !== req.user.id && task.assigned_to !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updateData = {
      updated_at: new Date().toISOString()
    };

    // Only update provided fields
    if (req.body.title !== undefined) updateData.title = req.body.title.trim();
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.priority !== undefined) updateData.priority = req.body.priority;
    if (req.body.due_date !== undefined) updateData.due_date = req.body.due_date || null;
    if (req.body.assigned_to !== undefined) updateData.assigned_to = req.body.assigned_to || null;

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Update task error:', error);
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('❌ Update task error:', error);
    res.status(500).json({ 
      message: 'Failed to update task',
      error: error.message 
    });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if task exists and user is creator
    const { data: task } = await supabase
      .from('tasks')
      .select('created_by')
      .eq('id', req.params.id)
      .single();

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Only task creator can delete' });
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('❌ Delete task error:', error);
      throw error;
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('❌ Delete task error:', error);
    res.status(500).json({ 
      message: 'Failed to delete task',
      error: error.message 
    });
  }
});

module.exports = router;

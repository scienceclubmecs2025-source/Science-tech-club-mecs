const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');
const { checkCommitteeRole } = require('../middleware/committeeAuth');

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    res.json(data || []);
  } catch (error) {
    console.error('Fetch events error:', error);
    res.status(500).json({ message: 'Failed to fetch events', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Fetch event error:', error);
    res.status(500).json({ message: 'Failed to fetch event', error: error.message });
  }
});

router.post('/', auth, checkCommitteeRole('executive', 'chair', 'secretary'), async (req, res) => {
  try {
    const { title, description, event_date, location } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title required' });
    }

    const { data, error } = await supabase
      .from('events')
      .insert([{
        title: title.trim(),
        description: description?.trim(),
        event_date,
        location: location?.trim(),
        created_by: req.user.id,
        status: 'upcoming'
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Failed to create event', error: error.message });
  }
});

router.put('/:id', auth, checkCommitteeRole('executive', 'chair', 'secretary'), async (req, res) => {
  try {
    const { title, description, event_date, location, status, poster_url, banner_url, photos, report_url } = req.body;

    const updateData = { updated_at: new Date().toISOString() };

    if (title) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description;
    if (event_date) updateData.event_date = event_date;
    if (location !== undefined) updateData.location = location;
    if (status) updateData.status = status;
    if (poster_url !== undefined) updateData.poster_url = poster_url;
    if (banner_url !== undefined) updateData.banner_url = banner_url;
    if (photos !== undefined) updateData.photos = photos;
    if (report_url !== undefined) updateData.report_url = report_url;

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Failed to update event', error: error.message });
  }
});

router.delete('/:id', auth, checkCommitteeRole('executive', 'chair', 'secretary'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Failed to delete event', error: error.message });
  }
});

module.exports = router;

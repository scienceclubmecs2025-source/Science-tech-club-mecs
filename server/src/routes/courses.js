const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Helper: extract YouTube video ID
const getYoutubeId = (url) => {
  const regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[1].length === 11 ? match[1] : null;
};

// Get all videos
router.get('/videos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('course_videos')
      .select(`
        *,
        uploader:uploaded_by(id, username, full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Fetch videos error:', error);
    res.status(500).json({ message: 'Failed to fetch videos' });
  }
});

// Get single video
router.get('/videos/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('course_videos')
      .select(`
        *,
        uploader:uploaded_by(id, username, full_name)

      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    // Increment views
    await supabase
      .from('course_videos')
      .update({ views: (data.views || 0) + 1 })
      .eq('id', req.params.id);

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch video' });
  }
});

// Upload video via YouTube link — admin/faculty/committee ONLY
router.post('/videos', auth, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('role, is_committee')
      .eq('id', req.user.id)
      .single();

    // Students cannot upload
    if (!user || (user.role === 'student' && !user.is_committee)) {
      return res.status(403).json({ message: 'Only faculty, admin, or committee members can upload videos' });
    }

    const { title, description, youtube_url } = req.body;

    if (!title || !youtube_url) {
      return res.status(400).json({ message: 'Title and YouTube URL are required' });
    }

    const youtube_id = getYoutubeId(youtube_url);
    if (!youtube_id) {
      return res.status(400).json({ message: 'Invalid YouTube URL' });
    }

    const thumbnail_url = `https://img.youtube.com/vi/${youtube_id}/hqdefault.jpg`;
    const embed_url = `https://www.youtube.com/embed/${youtube_id}`;

    const { data, error } = await supabase
      .from('course_videos')
      .insert([{
        title,
        description,
        youtube_id,
        youtube_url,
        embed_url,
        thumbnail_url,
        video_url: youtube_url,
        uploaded_by: req.user.id,
        views: 0
      }])
      .select(`
        *,
        uploader:uploaded_by(id, username, full_name, profile_photo_url)
      `)
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Failed to upload video', error: error.message });
  }
});

// Get comments for a video
router.get('/videos/:id/comments', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('video_comments')
      .select(`
        *,
        commenter:commenter_id(id, username, full_name, profile_photo_url),
        reactions:video_comment_reactions(*)
      `)
      .eq('video_id', req.params.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

// Add comment
router.post('/videos/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Content required' });

    const { data, error } = await supabase
      .from('video_comments')
      .insert([{
        video_id: req.params.id,
        commenter_id: req.user.id,
        content: content.trim()
      }])
      .select(`
        *,
        commenter:commenter_id(id, username, full_name, profile_photo_url),
        reactions:video_comment_reactions(*)
      `)
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

// React to comment
router.post('/comments/:id/react', auth, async (req, res) => {
  try {
    const { reaction } = req.body;

    // Check if already reacted
    const { data: existing } = await supabase
      .from('video_comment_reactions')
      .select('id, reaction')
      .eq('comment_id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (existing) {
      if (existing.reaction === reaction) {
        // Remove reaction (toggle off)
        await supabase.from('video_comment_reactions').delete().eq('id', existing.id);
      } else {
        // Update reaction
        await supabase.from('video_comment_reactions')
          .update({ reaction })
          .eq('id', existing.id);
      }
    } else {
      // Add new reaction
      await supabase.from('video_comment_reactions').insert([{
        comment_id: req.params.id,
        user_id: req.user.id,
        reaction
      }]);
    }

    res.json({ message: 'Reaction updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update reaction' });
  }
});

// Delete video (uploader or admin)
router.delete('/videos/:id', auth, async (req, res) => {
  try {
    const { data: video } = await supabase
      .from('course_videos')
      .select('uploaded_by')
      .eq('id', req.params.id)
      .single();

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (video.uploaded_by !== req.user.id && user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { error } = await supabase.from('course_videos').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Video deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete video' });
  }
});

module.exports = router;

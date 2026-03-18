const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Get all quizzes
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select(`*, creator:created_by(id, username, full_name)`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quizzes' });
  }
});

// Get quiz with questions
router.get('/:id', async (req, res) => {
  try {
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select(`*, creator:created_by(id, username, full_name)`)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', req.params.id)
      .order('order_index');

    res.json({ ...quiz, questions: questions || [] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quiz' });
  }
});

// Create quiz — admin, faculty, OR committee
router.post('/create', auth, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('role, is_committee')
      .eq('id', req.user.id)
      .single();

    // Allow admin, faculty, and committee members
    const canCreate =
      user.role === 'admin' ||
      user.role === 'faculty' ||
      user.is_committee === true;

    if (!canCreate) {
      return res.status(403).json({ message: 'Only admin, faculty, or committee can create quizzes' });
    }

    const { title, description, questions, time_limit, is_active } = req.body;

    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });
    if (!questions || questions.length === 0) return res.status(400).json({ message: 'At least one question is required' });

    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert([{
        title: title.trim(),
        description: description?.trim() || '',
        time_limit: time_limit || 30,
        is_active: is_active !== false,
        created_by: req.user.id
      }])
      .select()
      .single();

    if (quizError) throw quizError;

    const questionsData = questions.map((q, i) => ({
      quiz_id: quiz.id,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      points: q.points || 1,
      order_index: i
    }));

    const { error: qError } = await supabase
      .from('quiz_questions')
      .insert(questionsData);

    if (qError) throw qError;

    res.status(201).json({ ...quiz, questions: questionsData });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ message: 'Failed to create quiz', error: error.message });
  }
});

// Submit quiz
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const { answers, time_taken } = req.body;

    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', req.params.id);

    let score = 0;
    let total_points = 0;

    const results = questions.map(q => {
      total_points += q.points || 1;
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer === q.correct_answer;
      if (isCorrect) score += q.points || 1;
      return {
        question_id: q.id,
        question: q.question,
        user_answer: userAnswer,
        correct_answer: q.correct_answer,
        is_correct: isCorrect
      };
    });

    const { data: attempt, error } = await supabase
      .from('quiz_attempts')
      .insert([{
        quiz_id: req.params.id,
        user_id: req.user.id,
        score,
        total_points,
        answers,
        time_taken: time_taken || 0
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({
      score,
      total_points,
      percentage: Math.round((score / total_points) * 100),
      results,
      attempt_id: attempt.id
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit quiz' });
  }
});

// Leaderboard
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select(`*, user:user_id(id, username, full_name, profile_photo_url)`)
      .eq('quiz_id', req.params.id)
      .order('score', { ascending: false })
      .order('time_taken', { ascending: true })
      .limit(20);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
});

// Delete quiz
router.delete('/:id', auth, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });

    await supabase.from('quiz_questions').delete().eq('quiz_id', req.params.id);
    await supabase.from('quiz_attempts').delete().eq('quiz_id', req.params.id);
    await supabase.from('quizzes').delete().eq('id', req.params.id);

    res.json({ message: 'Quiz deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete quiz' });
  }
});

module.exports = router;

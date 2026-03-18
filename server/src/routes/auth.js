const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role = 'student' } = req.body;

    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .or(`username.eq.${username},email.eq.${email}`)
      .single();

    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert([
        {
          username,
          email,
          password: hashedPassword,
          role
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'User created successfully', userId: user.id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Remove password from response
    delete user.password;

    res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Verify Token (for page refresh/reload)
router.get('/verify', auth, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();
    
    if (error) throw error;
    
    // Remove password from response
    delete user.password;
    
    res.json({ user });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Logout (optional - client-side handles token removal)
router.post('/logout', auth, async (req, res) => {
  try {
    // In a stateless JWT system, logout is typically handled client-side
    // by removing the token from localStorage
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed' });
  }
});

module.exports = router;

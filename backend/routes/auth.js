const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const router  = express.Router();
const db      = require('../services/database');

const JWT_SECRET  = process.env.JWT_SECRET  || 'ecoguard_secret_2024';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '24h';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const users = await db.find('users', { email: email.toLowerCase() });
    if (!users.length) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    // Update last login
    await db.update('users', { _id: user._id }, { $set: { lastLogin: new Date().toISOString() } });

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/register (admin only in production; open for demo)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'viewer' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    const existing = await db.find('users', { email: email.toLowerCase() });
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await db.insert('users', {
      name,
      email: email.toLowerCase(),
      password: hashed,
      role,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ success: true, message: 'User created', userId: user._id });
  } catch (err) {
    console.error('[auth/register]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/auth/me (protected)
const { authenticateToken } = require('../middleware/auth');
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const users = await db.find('users', { _id: req.user.id });
    if (!users.length) return res.status(404).json({ success: false, message: 'User not found' });
    const { password, ...safe } = users[0];
    res.json({ success: true, user: safe });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

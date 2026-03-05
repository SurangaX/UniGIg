'use strict';
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../db');
const { JWT_SECRET } = require('../config');

const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function register(req, res, next) {
  try {
    const { role, name, email, password, university_or_business, skills, nic } = req.body;

    if (!['STUDENT', 'EMPLOYER'].includes(role)) {
      return res.status(400).json({ error: 'Role must be STUDENT or EMPLOYER' });
    }

    if (!nic || !nic.trim()) {
      return res.status(400).json({ error: 'NIC is required' });
    }

    // Check duplicate email
    const exists = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (exists.rows.length) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Check duplicate NIC
    const nicExists = await db.query('SELECT id FROM users WHERE nic = $1', [nic.trim()]);
    if (nicExists.rows.length) {
      return res.status(409).json({ error: 'NIC already registered' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const skillsArray   = Array.isArray(skills) ? skills : [];

    const result = await db.query(
      `INSERT INTO users (role, name, email, password_hash, university_or_business, nic, skills)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, role, name, email, university_or_business, nic, skills, created_at`,
      [role, name.trim(), email.toLowerCase().trim(), password_hash, university_or_business || null, nic.trim(), skillsArray]
    );

    const user  = result.rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password_hash: _, ...safeUser } = user;
    const token = signToken(safeUser);
    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const result = await db.query(
      'SELECT id, role, name, email, university_or_business, skills, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };

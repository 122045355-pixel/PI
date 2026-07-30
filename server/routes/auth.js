const express = require('express');
const router = express.Router();
const { db, init } = require('../db');
const { generateToken } = require('../middleware/auth');

init();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  await db.read();
  const user = db.data.users.find((u) => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ detail: 'Invalid credentials' });
  const token = generateToken(user);
  res.json({ access_token: token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
});

router.get('/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ detail: 'Missing authorization' });
  const token = auth.split(' ')[1];
  const jwt = require('jsonwebtoken');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    await db.read();
    const user = db.data.users.find((u) => u.id === payload.id);
    if (!user) return res.status(401).json({ detail: 'Invalid token' });
    res.json({ id: user.id, email: user.email, role: user.role, name: user.name });
  } catch (err) {
    res.status(401).json({ detail: 'Invalid token' });
  }
});

module.exports = router;

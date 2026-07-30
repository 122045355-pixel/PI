const jwt = require('jsonwebtoken');
const { db } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function generateToken(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
}

async function authRequired(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ detail: 'Missing authorization' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    await db.read();
    const user = db.data.users.find((u) => u.id === payload.id);
    if (!user) return res.status(401).json({ detail: 'Invalid token' });
    req.user = { id: user.id, role: user.role, email: user.email, name: user.name };
    next();
  } catch (err) {
    return res.status(401).json({ detail: 'Invalid token' });
  }
}

function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ detail: 'Missing user' });
    if (!allowed.includes(req.user.role)) return res.status(403).json({ detail: 'Forbidden' });
    next();
  };
}

module.exports = { authRequired, requireRole, generateToken };

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import { fileURLToPath, pathToFileURL } from 'url';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import nodemailer from 'nodemailer';
import helmet from 'helmet';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { getDb, saveDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT) || 3006;
const IS_PROD = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || 'dream-homes-secret-2026';
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set. Using an insecure default — set JWT_SECRET in production.');
}
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5177';

let uploadsDir = path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch {
  const tmpUploadsDir = path.join(os.tmpdir(), 'dreamhomes-uploads');
  if (!fs.existsSync(tmpUploadsDir)) {
    fs.mkdirSync(tmpUploadsDir, { recursive: true });
  }
  uploadsDir = tmpUploadsDir;
}

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});
const csvUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isCsv = file.mimetype === 'text/csv' || file.mimetype === 'application/csv' || /\.csv$/i.test(file.originalname);
    if (!isCsv) {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error('Only image files (JPEG, PNG, GIF, WEBP, AVIF) are allowed'));
    }
    cb(null, true);
  },
});

const corsOrigins = CORS_ORIGIN.split(',').map(s => s.trim());
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(helmet({
  contentSecurityPolicy: IS_PROD ? {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      connectSrc: ["'self'", 'ws:', 'wss:'],
      frameSrc: ["'self'", 'https://www.youtube.com', 'https://www.youtube-nocookie.com', 'https://maps.google.com'],
      mediaSrc: ["'self'", 'blob:', 'https:'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: null,
    },
  } : false,
}));
app.use(express.json());
const ipKey = (req) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.headers['cf-connecting-ip'] || 'anonymous';
  return ipKeyGenerator(ip);
};
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false, keyGenerator: ipKey });
app.use('/api', apiLimiter);
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false, keyGenerator: ipKey });
app.use('/api/auth', authLimiter);
app.use('/uploads', express.static(uploadsDir));

let dbInstance = null;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER || 'test@ethereal.email',
    pass: process.env.SMTP_PASS || 'testpassword'
  }
});

const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: corsOrigins, credentials: true }
});

function getDbSync() {
  return dbInstance;
}

function getLimit(req, def = 500, max = 2000) {
  const l = parseInt(req.query.limit, 10);
  return Math.min(max, Math.max(1, Number.isFinite(l) ? l : def));
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+\d][\d\s().-]{5,19}$/;

function validEmail(v) {
  return typeof v === 'string' && EMAIL_RE.test(v.trim());
}

function validName(v) {
  return typeof v === 'string' && v.trim().length >= 2 && v.trim().length <= 120;
}

function validPhone(v) {
  return v === undefined || v === null || v === '' || PHONE_RE.test(String(v));
}

function validPassword(v) {
  return typeof v === 'string' && v.length >= 8 && v.length <= 128;
}

function escHtml(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function toNum(v, min, max) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null;
}

function notify(type, message, link, userId) {
  try {
    const db = getDbSync();
    db.run("INSERT INTO notifications (userId, type, message, link) VALUES (?, ?, ?, ?)", [userId || null, type, message, link || null]);
    saveDb();
    const payload = { type, message, link, createdAt: new Date().toISOString() };
    if (userId) {
      io.to(`user:${userId}`).emit('notification', payload);
    } else {
      io.to('admins').emit('notification', payload);
    }
  } catch (err) {
    console.log('Failed to create notification:', err.message);
  }
}

function createLead({ name, email, phone, type = 'buyer', source, propertyId, propertyTitle, notes }) {
  try {
    const db = getDbSync();
    const existing = db.exec("SELECT id FROM leads WHERE email = ? AND source = ?", [email, source || '']);
    if (existing.length > 0 && existing[0].values.length > 0) return;
    db.run("INSERT INTO leads (name, email, phone, type, status, source, propertyId, propertyTitle, notes) VALUES (?, ?, ?, ?, 'new', ?, ?, ?, ?)",
      [name, email, phone || null, type, source || null, propertyId || null, propertyTitle || null, notes || null]);
    saveDb();
  } catch (err) {
    console.log('Failed to create lead:', err.message);
  }
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDbSync();
    const result = db.exec("SELECT id, name, email, isAdmin, active FROM users WHERE id = ?", [decoded.userId]);
    if (result.length === 0 || result[0].values.length === 0) return res.status(401).json({ error: 'User not found' });
    if (result[0].values[0][4] === 0) return res.status(403).json({ error: 'Account disabled' });
    req.user = { id: result[0].values[0][0], name: result[0].values[0][1], email: result[0].values[0][2], isAdmin: result[0].values[0][3] === 1 };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function adminMiddleware(req, res, next) {
  if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });
  next();
}

function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDbSync();
    const result = db.exec("SELECT id, name, email, isAdmin, active FROM users WHERE id = ?", [decoded.userId]);
    if (result.length === 0 || result[0].values.length === 0) return next();
    if (result[0].values[0][4] === 0) return next();
    req.user = { id: result[0].values[0][0], name: result[0].values[0][1], email: result[0].values[0][2], isAdmin: result[0].values[0][3] === 1 };
  } catch {
    /* invalid token: treat as anonymous */
  }
  next();
}

const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCK_WINDOW_MS = 15 * 60 * 1000;

function checkLoginRateLimit(key) {
  const now = Date.now();
  if (loginAttempts.size > 10000) {
    for (const [k, v] of loginAttempts) {
      if (now - v.firstAt > LOCK_WINDOW_MS) loginAttempts.delete(k);
    }
  }
  const entry = loginAttempts.get(key);
  if (!entry || now - entry.firstAt > LOCK_WINDOW_MS) {
    loginAttempts.set(key, { count: 0, firstAt: now });
    return { allowed: true };
  }
  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryMs: LOCK_WINDOW_MS - (now - entry.firstAt) };
  }
  return { allowed: true };
}

function recordLoginFailure(key) {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now - entry.firstAt > LOCK_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAt: now });
  } else {
    entry.count += 1;
  }
}

function clearLoginFailures(key) {
  loginAttempts.delete(key);
}

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!validName(name)) return res.status(400).json({ error: 'Name must be 2-120 characters' });
    if (!validEmail(email)) return res.status(400).json({ error: 'A valid email is required' });
    if (!validPassword(password)) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const db = getDbSync();
    const existing = db.exec("SELECT id FROM users WHERE email = ?", [email.trim().toLowerCase()]);
    if (existing.length > 0 && existing[0].values.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const hash = bcrypt.hashSync(password, 10);
    db.run("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name.trim(), email.trim().toLowerCase(), hash]);
    const result = db.exec("SELECT last_insert_rowid()");
    const userId = result[0].values[0][0];
    saveDb();
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: userId, name: name.trim(), email: email.trim().toLowerCase(), isAdmin: false } });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ error: 'Could not create account' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!validEmail(email) || !password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const key = `${req.ip || req.socket.remoteAddress || 'unknown'}:${String(email || '').toLowerCase()}`;
    const check = checkLoginRateLimit(key);
    if (!check.allowed) {
      return res.status(429).json({
        error: 'Too many login attempts. Please try again later.',
        retryAfter: Math.ceil(check.retryMs / 1000),
      });
    }
    const db = getDbSync();
    const result = db.exec("SELECT id, name, email, password, isAdmin, active FROM users WHERE email = ?", [email.trim().toLowerCase()]);
    if (result.length === 0 || result[0].values.length === 0) {
      recordLoginFailure(key);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const row = result[0].values[0];
    if (row[5] === 0) {
      return res.status(403).json({ error: 'Account disabled. Contact support.' });
    }
    const valid = bcrypt.compareSync(password, row[3]);
    if (!valid) {
      recordLoginFailure(key);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    clearLoginFailures(key);
    const token = jwt.sign({ userId: row[0] }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: row[0], name: row[1], email: row[2], isAdmin: row[4] === 1 } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email, resetUrl } = req.body;
    if (!validEmail(email)) return res.status(400).json({ error: 'A valid email is required' });
    const db = getDbSync();
    const result = db.exec("SELECT id, name FROM users WHERE email = ?", [String(email).trim().toLowerCase()]);
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(200).json({ message: 'If an account exists for that email, a reset link has been sent.' });
    }
    const row = result[0].values[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    db.run("UPDATE users SET passwordResetToken = ?, passwordResetExpires = ? WHERE id = ?", [token, expires, row[0]]);
    saveDb();

    const baseUrl = resetUrl || 'http://localhost:5177';
    const link = `${baseUrl}/reset-password/${token}`;
    console.log('=== PASSWORD RESET REQUEST ===');
    console.log('User:', row[1], '(', email, ')');
    console.log('Reset link:', link);
    console.log('===============================');

    try {
      await transporter.sendMail({
        from: '"Dream Homes" <noreply@dreamhomes.com>',
        to: email,
        subject: 'Reset your Dream Homes password',
        html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:auto">
          <div style="background:linear-gradient(135deg,#C9A84C,#A8882E);padding:24px;text-align:center">
            <h1 style="color:#fff;margin:0;font-family:Playfair Display,serif">Dream Homes</h1>
            <p style="color:rgba(255,255,255,.85);margin:4px 0 0">Luxury Real Estate</p>
          </div>
          <div style="padding:32px 24px;background:#fff">
            <h2 style="color:#1A1714">Hi ${escHtml(row[1])},</h2>
            <p style="color:#3D3529;line-height:1.6">We received a request to reset your password. Click the button below to create a new one. This link expires in <strong>1 hour</strong>.</p>
            <div style="text-align:center;margin:24px 0">
              <a href="${link}" style="background:linear-gradient(135deg,#C9A84C,#A8882E);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;display:inline-block">Reset Password</a>
            </div>
            <p style="color:#6B6258;font-size:0.85rem">If you didn't request this, you can safely ignore this email. The link above will not work after it expires.</p>
          </div>
          <div style="text-align:center;padding:16px;border-top:1px solid #E5DDD4;font-size:0.75rem;color:#9C948A">
            Dream Homes &mdash; dreamhomes.com &mdash; (800) 555-HOME
          </div>
        </div>`
      });
      console.log('Password reset email sent to', email);
    } catch (mailErr) {
      console.log('Password reset email failed:', mailErr.message);
    }

    res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });
    if (!validPassword(password)) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const db = getDbSync();
    const result = db.exec("SELECT id FROM users WHERE passwordResetToken = ? AND passwordResetExpires > ?", [token, new Date().toISOString()]);
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(400).json({ error: 'Reset token is invalid or has expired' });
    }
    const userId = result[0].values[0][0];
    const hash = bcrypt.hashSync(password, 10);
    db.run("UPDATE users SET password = ?, passwordResetToken = NULL, passwordResetExpires = NULL WHERE id = ?", [hash, userId]);
    saveDb();
    res.json({ message: 'Password updated successfully. You can now sign in.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/properties', (req, res) => {
  try {
    const db = getDbSync();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 12));
    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params = [];

    whereClause += " AND isPrivate = 0";

    if (req.query.search) {
      whereClause += " AND (title LIKE ? OR city LIKE ? OR state LIKE ? OR description LIKE ? OR address LIKE ?)";
      const s = `%${req.query.search}%`;
      params.push(s, s, s, s, s);
    }
    if (req.query.beds) {
      whereClause += " AND beds >= ?";
      params.push(parseInt(req.query.beds));
    }
    if (req.query.minPrice) {
      whereClause += " AND price >= ?";
      params.push(parseFloat(req.query.minPrice));
    }
    if (req.query.maxPrice) {
      whereClause += " AND price <= ?";
      params.push(parseFloat(req.query.maxPrice));
    }
    if (req.query.type) {
      whereClause += " AND type = ?";
      params.push(req.query.type);
    }
    if (req.query.status) {
      whereClause += " AND status = ?";
      params.push(req.query.status);
    }
    if (req.query.baths) {
      whereClause += " AND baths >= ?";
      params.push(parseInt(req.query.baths));
    }
    if (req.query.minYear) {
      whereClause += " AND yearBuilt >= ?";
      params.push(parseInt(req.query.minYear));
    }
    if (req.query.maxYear) {
      whereClause += " AND yearBuilt <= ?";
      params.push(parseInt(req.query.maxYear));
    }
    if (req.query.minSqft) {
      whereClause += " AND sqft >= ?";
      params.push(parseFloat(req.query.minSqft));
    }
    if (req.query.maxSqft) {
      whereClause += " AND sqft <= ?";
      params.push(parseFloat(req.query.maxSqft));
    }
    if (req.query.amenities) {
      const amenities = req.query.amenities.split(',');
      amenities.forEach(a => {
        whereClause += " AND (tags LIKE ? OR tags LIKE ? OR amenities LIKE ?)";
        params.push(`%${a.trim()}%`, `%${a.trim()}%`, `%${a.trim()}%`);
      });
    }
    if (req.query.availability) {
      whereClause += " AND availability = ?";
      params.push(req.query.availability);
    }
    if (req.query.retail && req.query.retail !== 'false' && req.query.retail !== '0') {
      whereClause += " AND type = 'Retail'";
    }

    const countResult = db.exec(`SELECT COUNT(*) as total FROM properties ${whereClause}`, params);
    const total = countResult[0]?.values[0]?.[0] || 0;

    let orderClause = " ORDER BY featured DESC, createdAt DESC";
    if (req.query.sort === 'price-low') orderClause = " ORDER BY price ASC";
    else if (req.query.sort === 'price-high') orderClause = " ORDER BY price DESC";
    else if (req.query.sort === 'newest') orderClause = " ORDER BY createdAt DESC";

    const stmt = db.prepare(`SELECT * FROM properties ${whereClause} ${orderClause} LIMIT ? OFFSET ?`);
    stmt.bind([...params, limit, offset]);
    const properties = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      properties.push({
        ...row,
        images: row.images ? JSON.parse(row.images) : [],
        amenities: row.amenities ? JSON.parse(row.amenities) : [],
        floorPlans: row.floorPlans ? JSON.parse(row.floorPlans) : [],
        featured: row.featured === 1
      });
    }
    stmt.free();
    res.json({ properties, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/properties/vip', authMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const result = db.exec("SELECT * FROM properties WHERE isPrivate = 1 ORDER BY featured DESC, createdAt DESC");
    if (result.length === 0) return res.json({ properties: [] });
    const cols = result[0].columns;
    const properties = result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      obj.images = obj.images ? JSON.parse(obj.images) : [];
      obj.amenities = obj.amenities ? JSON.parse(obj.amenities) : [];
      obj.floorPlans = obj.floorPlans ? JSON.parse(obj.floorPlans) : [];
      obj.featured = obj.featured === 1;
      return obj;
    });
    res.json({ properties });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tours/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'scheduled', 'completed', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const db = getDbSync();
    db.run("UPDATE tours SET status = ? WHERE id = ?", [status, parseInt(req.params.id)]);
    saveDb();
    res.json({ message: 'Tour status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/properties/export', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const result = db.exec("SELECT * FROM properties ORDER BY id DESC");
    const cols = result.length > 0 ? result[0].columns : [];
    const rows = result.length > 0 ? result[0].values : [];
    const esc = (v) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const lines = [cols.join(',')];
    rows.forEach(r => lines.push(r.map(esc).join(',')));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="properties.csv"');
    res.send(lines.join('\n'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/properties/:id', optionalAuth, (req, res) => {
  try {
    const db = getDbSync();
    const result = db.exec("SELECT * FROM properties WHERE id = ?", [parseInt(req.params.id)]);
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    const cols = result[0].columns;
    const row = result[0].values[0];
    const property = {};
    cols.forEach((col, i) => { property[col] = row[i]; });
  property.images = property.images ? JSON.parse(property.images) : [];
  property.amenities = property.amenities ? JSON.parse(property.amenities) : [];
  property.floorPlans = property.floorPlans ? JSON.parse(property.floorPlans) : [];
  property.featured = property.featured === 1;
  property.video = property.video || null;
  if (property.isPrivate === 1 && !req.user) {
    return res.status(404).json({ error: 'Property not found' });
  }
    res.json({ property });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/properties/:id/history', (req, res) => {
  try {
    const db = getDbSync();
    const result = db.exec("SELECT id, price, date, note FROM price_history WHERE propertyId = ? ORDER BY date ASC", [parseInt(req.params.id)]);
    if (result.length === 0) return res.json({ history: [] });
    const history = result[0].values.map(r => ({ id: r[0], price: r[1], date: r[2], note: r[3] }));
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/properties', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { title, address, city, state, zip, country, price, beds, baths, sqft, type, status, yearBuilt, description, agent, agentPhone, agentEmail, tags, image, images, video, floorPlan, isPrivate, badge, featured, latitude, longitude, lotSize, hoa, propertyTaxes, garage, stories, cooling, heating, parking, roof, viewType, basement, amenities, floorPlans, availability, retail } = req.body;
    const db = getDbSync();
    db.run(`INSERT INTO properties (title, address, city, state, zip, country, price, beds, baths, sqft, type, status, yearBuilt, description, agent, agentPhone, agentEmail, tags, image, images, video, floorPlan, isPrivate, badge, featured, latitude, longitude, lotSize, hoa, propertyTaxes, garage, stories, cooling, heating, parking, roof, viewType, basement, amenities, floorPlans, availability, retail)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, address, city, state, zip, country || 'US', price, beds, baths, sqft, type, status || 'For Sale', yearBuilt || null, description, agent, agentPhone || null, agentEmail || null, tags || null, image || null, JSON.stringify(images || []), video || null, floorPlan || null, isPrivate ? 1 : 0, badge || null, featured ? 1 : 0, latitude || null, longitude || null, lotSize || null, hoa || null, propertyTaxes || null, garage || null, stories || null, cooling || null, heating || null, parking || null, roof || null, viewType || null, basement || null, JSON.stringify(amenities || []), JSON.stringify(floorPlans || []), availability || null, retail || null]);
    const result = db.exec("SELECT last_insert_rowid()");
    const id = result[0].values[0][0];
    saveDb();
    res.status(201).json({ id, message: 'Property created' });
  } catch (err) {
    console.error('=== CREATE PROPERTY ERROR ===');
    console.error(err);
    res.status(500).json({ error: err?.message });
  }
});

app.put('/api/properties/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { title, address, city, state, zip, country, price, beds, baths, sqft, type, status, yearBuilt, description, agent, agentPhone, agentEmail, tags, image, images, video, floorPlan, isPrivate, badge, featured, latitude, longitude, lotSize, hoa, propertyTaxes, garage, stories, cooling, heating, parking, roof, viewType, basement, amenities, floorPlans, availability, retail } = req.body;
    const db = getDbSync();
    db.run(`UPDATE properties SET title=?, address=?, city=?, state=?, zip=?, country=?, price=?, beds=?, baths=?, sqft=?, type=?, status=?, yearBuilt=?, description=?, agent=?, agentPhone=?, agentEmail=?, tags=?, image=?, images=?, video=?, floorPlan=?, isPrivate=?, badge=?, featured=?, latitude=?, longitude=?, lotSize=?, hoa=?, propertyTaxes=?, garage=?, stories=?, cooling=?, heating=?, parking=?, roof=?, viewType=?, basement=?, amenities=?, floorPlans=?, availability=?, retail=? WHERE id=?`,
      [title, address, city, state, zip, country || 'US', price, beds, baths, sqft, type, status, yearBuilt || null, description, agent, agentPhone || null, agentEmail || null, tags || null, image || null, JSON.stringify(images || []), video || null, floorPlan || null, isPrivate ? 1 : 0, badge || null, featured ? 1 : 0, latitude || null, longitude || null, lotSize || null, hoa || null, propertyTaxes || null, garage || null, stories || null, cooling || null, heating || null, parking || null, roof || null, viewType || null, basement || null, JSON.stringify(amenities || []), JSON.stringify(floorPlans || []), availability || null, retail || null, parseInt(req.params.id)]);
    saveDb();
    res.json({ message: 'Property updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function removeUploadedFiles(refs) {
  try {
    const files = (refs || [])
      .filter(f => typeof f === 'string' && f.startsWith('/uploads/'))
      .map(f => path.join(uploadsDir, path.basename(f)));
    for (const f of files) {
      try { fs.unlinkSync(f); } catch { /* already gone */ }
    }
  } catch (err) {
    console.log('Failed to clean up uploads:', err.message);
  }
}

app.delete('/api/properties/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const row = db.exec("SELECT image, images, floorPlan, floorPlans FROM properties WHERE id = ?", [parseInt(req.params.id)]);
    if (row.length > 0 && row[0].values.length > 0) {
      const [image, images, floorPlan, floorPlans] = row[0].values[0];
      let imgArr = [];
      let fpArr = [];
      try { imgArr = images ? JSON.parse(images) : []; } catch { /* ignore */ }
      try { fpArr = floorPlans ? JSON.parse(floorPlans) : []; } catch { /* ignore */ }
      removeUploadedFiles([image, floorPlan, ...(Array.isArray(imgArr) ? imgArr : []), ...(Array.isArray(fpArr) ? fpArr : [])]);
    }
    db.run("DELETE FROM offers WHERE propertyId = ?", [parseInt(req.params.id)]);
    db.run("DELETE FROM favorites WHERE propertyId = ?", [parseInt(req.params.id)]);
    db.run("DELETE FROM tours WHERE propertyId = ?", [parseInt(req.params.id)]);
    db.run("DELETE FROM contacts WHERE propertyId = ?", [parseInt(req.params.id)]);
    db.run("DELETE FROM inquiries WHERE propertyId = ?", [parseInt(req.params.id)]);
    db.run("DELETE FROM page_views WHERE propertyId = ?", [parseInt(req.params.id)]);
    db.run("DELETE FROM open_houses WHERE propertyId = ?", [parseInt(req.params.id)]);
    db.run("DELETE FROM properties WHERE id = ?", [parseInt(req.params.id)]);
    saveDb();
    res.json({ message: 'Property deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/upload', authMiddleware, adminMiddleware, upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/upload-multiple', authMiddleware, adminMiddleware, upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
    const urls = req.files.map((f) => `/uploads/${f.filename}`);
    res.json({ urls });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/contacts', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const limit = getLimit(req);
    const result = db.exec("SELECT * FROM contacts ORDER BY createdAt DESC LIMIT ?", [limit]);
    if (result.length === 0) return res.json({ contacts: [] });
    const cols = result[0].columns;
    const contacts = result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/contacts/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['new', 'contacted', 'followed-up', 'closed'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const db = getDbSync();
    db.run("UPDATE contacts SET status = ? WHERE id = ?", [status, parseInt(req.params.id)]);
    saveDb();
    res.json({ message: 'Contact status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tours', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const limit = getLimit(req);
    const result = db.exec("SELECT t.*, p.title as propertyTitle FROM tours t LEFT JOIN properties p ON t.propertyId = p.id ORDER BY t.createdAt DESC LIMIT ?", [limit]);
    if (result.length === 0) return res.json({ tours: [] });
    const cols = result[0].columns;
    const tours = result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
    res.json({ tours });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tours/mine', authMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const result = db.exec("SELECT t.*, p.title as propertyTitle FROM tours t LEFT JOIN properties p ON t.propertyId = p.id WHERE t.email = ? ORDER BY t.createdAt DESC", [req.user.email]);
    if (result.length === 0 || result[0].values.length === 0) return res.json({ tours: [] });
    const cols = result[0].columns;
    const tours = result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
    res.json({ tours });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== OFFERS =====
app.post('/api/properties/:id/offers', optionalAuth, async (req, res) => {
  try {
    const { name, email, phone, amount, message } = req.body;
    const propertyId = parseInt(req.params.id);
    if (!validName(name)) return res.status(400).json({ error: 'Name must be 2-120 characters' });
    if (!validEmail(email)) return res.status(400).json({ error: 'A valid email is required' });
    if (!validPhone(phone)) return res.status(400).json({ error: 'Phone is invalid' });
    const amountNum = toNum(amount, 1, 1e12);
    if (!amountNum) return res.status(400).json({ error: 'A valid offer amount is required' });
    const db = getDbSync();
    const property = db.exec("SELECT id, title FROM properties WHERE id = ?", [propertyId]);
    if (property.length === 0 || property[0].values.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    const userId = req.user ? req.user.id : null;
    db.run("INSERT INTO offers (propertyId, userId, name, email, phone, amount, message) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [propertyId, userId, name.trim(), email.trim().toLowerCase(), phone || null, amountNum, message || null]);
    saveDb();
    const pTitle = property[0].values[0][1];
    const amountDisplay = amountNum.toLocaleString();
    createLead({ name: name.trim(), email: email.trim().toLowerCase(), phone, type: 'buyer', source: 'offer', propertyId, propertyTitle: pTitle, notes: `Offer: $${amountDisplay}` });
    notify('offer', `New offer of $${amountDisplay} on ${pTitle} from ${name.trim()}`, '/admin');

    console.log('=== OFFER RECEIVED ===');
    console.log('Property:', pTitle, '(', propertyId, ')');
    console.log('Buyer:', name.trim(), '(', email.trim().toLowerCase(), ')');
    console.log('Amount: $', amountDisplay);
    console.log('========================');

    try {
      await transporter.sendMail({
        from: '"Dream Homes" <noreply@dreamhomes.com>',
        to: email.trim().toLowerCase(),
        subject: 'Offer received — Dream Homes',
        html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:auto">
          <div style="background:linear-gradient(135deg,#C9A84C,#A8882E);padding:24px;text-align:center">
            <h1 style="color:#fff;margin:0;font-family:Playfair Display,serif">Dream Homes</h1>
            <p style="color:rgba(255,255,255,.85);margin:4px 0 0">Luxury Real Estate</p>
          </div>
          <div style="padding:32px 24px;background:#fff">
            <h2 style="color:#1A1714">Hi ${escHtml(name)},</h2>
            <p style="color:#3D3529;line-height:1.6">Thank you for your offer on <strong>${escHtml(property[0].values[0][1])}</strong>. Our team is reviewing it and will get back to you shortly.</p>
            <div style="background:#F2EFEA;border-radius:8px;padding:16px;margin:16px 0">
              <p style="margin:0 0 4px;color:#6B6258;font-size:0.85rem">Offer Amount: <strong style="color:#1A1714">$${amountDisplay}</strong></p>
              ${message ? `<p style="margin:0;color:#6B6258;font-size:0.85rem">Note: <strong style="color:#1A1714">"${escHtml(message)}"</strong></p>` : ''}
            </div>
            <p style="color:#3D3529">An agent will contact you about next steps.</p>
          </div>
          <div style="text-align:center;padding:16px;border-top:1px solid #E5DDD4;font-size:0.75rem;color:#9C948A">
            Dream Homes &mdash; dreamhomes.com &mdash; (800) 555-HOME
          </div>
        </div>`
      });
      console.log('Offer confirmation sent to', email);
    } catch (mailErr) {
      console.log('Offer confirmation email failed:', mailErr.message);
    }

    res.status(201).json({ message: 'Offer submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/offers', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const limit = getLimit(req);
    const result = db.exec("SELECT o.*, p.title as propertyTitle FROM offers o LEFT JOIN properties p ON o.propertyId = p.id ORDER BY o.createdAt DESC LIMIT ?", [limit]);
    if (result.length === 0) return res.json({ offers: [] });
    const cols = result[0].columns;
    const offers = result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
    res.json({ offers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/offers/mine', authMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const result = db.exec("SELECT o.*, p.title as propertyTitle FROM offers o LEFT JOIN properties p ON o.propertyId = p.id WHERE o.userId = ? OR o.email = ? ORDER BY o.createdAt DESC", [req.user.id, req.user.email]);
    if (result.length === 0 || result[0].values.length === 0) return res.json({ offers: [] });
    const cols = result[0].columns;
    const offers = result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
    res.json({ offers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/offers/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'accepted', 'countered', 'rejected'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const db = getDbSync();
    db.run("UPDATE offers SET status = ? WHERE id = ?", [status, parseInt(req.params.id)]);
    saveDb();
    res.json({ message: 'Offer status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/offers/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    db.run("DELETE FROM offers WHERE id = ?", [parseInt(req.params.id)]);
    saveDb();
    res.json({ message: 'Offer deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/favorites', authMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const result = db.exec("SELECT f.*, p.title, p.price, p.image, p.beds, p.baths, p.sqft, p.city, p.state FROM favorites f JOIN properties p ON f.propertyId = p.id WHERE f.userId = ?", [req.user.id]);
    if (result.length === 0) return res.json({ favorites: [] });
    const cols = result[0].columns;
    const favorites = result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
    res.json({ favorites });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/favorites/:propertyId', authMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const propertyId = parseInt(req.params.propertyId);
    const existing = db.exec("SELECT id FROM favorites WHERE userId = ? AND propertyId = ?", [req.user.id, propertyId]);
    if (existing.length > 0 && existing[0].values.length > 0) {
      db.run("DELETE FROM favorites WHERE userId = ? AND propertyId = ?", [req.user.id, propertyId]);
      saveDb();
      return res.json({ favorited: false, message: 'Removed from favorites' });
    }
    db.run("INSERT INTO favorites (userId, propertyId) VALUES (?, ?)", [req.user.id, propertyId]);
    saveDb();
    res.json({ favorited: true, message: 'Added to favorites' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sponsors', (req, res) => {
  try {
    const db = getDbSync();
    const result = db.exec("SELECT * FROM sponsors WHERE active = 1 ORDER BY tier ASC");
    if (result.length === 0) return res.json({ sponsors: [] });
    const cols = result[0].columns;
    const sponsors = result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
    res.json({ sponsors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ads', (req, res) => {
  try {
    const db = getDbSync();
    const result = db.exec("SELECT * FROM ads WHERE active = 1 ORDER BY createdAt DESC");
    if (result.length === 0) return res.json({ ads: [] });
    const cols = result[0].columns;
    const ads = result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
    res.json({ ads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/newsletter', (req, res) => {
  try {
    const { email } = req.body;
    if (!validEmail(email)) return res.status(400).json({ error: 'A valid email is required' });
    const db = getDbSync();
    const existing = db.exec("SELECT id FROM newsletters WHERE email = ?", [email.trim().toLowerCase()]);
    if (existing.length > 0 && existing[0].values.length > 0) {
      return res.status(400).json({ error: 'Email already subscribed' });
    }
    db.run("INSERT INTO newsletters (email) VALUES (?)", [email.trim().toLowerCase()]);
    saveDb();
    createLead({ name: email.trim(), email: email.trim().toLowerCase(), type: 'buyer', source: 'newsletter', notes: 'Newsletter subscriber' });
    res.status(201).json({ message: 'Subscribed to newsletter' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/newsletter', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const limit = getLimit(req);
    const result = db.exec("SELECT * FROM newsletters ORDER BY createdAt DESC LIMIT ?", [limit]);
    if (result.length === 0) return res.json({ subscribers: [] });
    const cols = result[0].columns;
    const subscribers = result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
    res.json({ subscribers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== MORTGAGE PRE-QUALIFICATION =====
app.post('/api/pre-qualifications', async (req, res) => {
  try {
    const { name, email, phone, homePrice, downPayment, interestRate, loanTerm, monthlyPayment, notes } = req.body;
    if (!validName(name)) return res.status(400).json({ error: 'Name must be 2-120 characters' });
    if (!validEmail(email)) return res.status(400).json({ error: 'A valid email is required' });
    if (!validPhone(phone)) return res.status(400).json({ error: 'Phone is invalid' });
    const db = getDbSync();
    db.run("INSERT INTO pre_qualifications (name, email, phone, homePrice, downPayment, interestRate, loanTerm, monthlyPayment, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [name.trim(), email.trim().toLowerCase(), phone || null, toNum(homePrice, 0, 1e12), toNum(downPayment, 0, 1e12), toNum(interestRate, 0, 100), toNum(loanTerm, 1, 50), toNum(monthlyPayment, 0, 1e12), notes || null]);
    saveDb();
    createLead({ name: name.trim(), email: email.trim().toLowerCase(), phone, type: 'buyer', source: 'prequal', notes: `Home price: ${homePrice ? '$' + parseFloat(homePrice).toLocaleString() : 'N/A'}` });
    notify('prequal', `New pre-qualification request from ${name.trim()}`, '/admin');
    console.log('=== PRE-QUALIFICATION REQUEST ===');
    console.log('Name:', name.trim());
    console.log('Email:', email.trim().toLowerCase());
    console.log('Home Price:', homePrice ? '$' + parseFloat(homePrice).toLocaleString() : 'N/A');
    console.log('Monthly est.:', monthlyPayment ? '$' + parseFloat(monthlyPayment).toLocaleString() : 'N/A');
    console.log('==================================');
    try {
      await transporter.sendMail({
        from: '"Dream Homes" <noreply@dreamhomes.com>',
        to: email,
        subject: 'Your Dream Homes pre-qualification request',
        html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:auto">
          <div style="background:linear-gradient(135deg,#C9A84C,#A8882E);padding:24px;text-align:center">
            <h1 style="color:#fff;margin:0;font-family:Playfair Display,serif">Dream Homes</h1>
            <p style="color:rgba(255,255,255,.85);margin:4px 0 0">Luxury Real Estate</p>
          </div>
          <div style="padding:32px 24px;background:#fff">
            <h2 style="color:#1A1714">Hi ${escHtml(name)},</h2>
            <p style="color:#3D3529;line-height:1.6">Thank you for your interest in getting pre-qualified. A Dream Homes mortgage specialist will reach out within one business day to discuss your options and connect you with a trusted lender.</p>
          </div>
          <div style="text-align:center;padding:16px;border-top:1px solid #E5DDD4;font-size:0.75rem;color:#9C948A">
            Dream Homes &mdash; dreamhomes.com &mdash; (800) 555-HOME
          </div>
        </div>`
      });
    } catch (mailErr) {
      console.log('Pre-qualification email failed:', mailErr.message);
    }
    res.status(201).json({ message: 'Pre-qualification request submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/pre-qualifications', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const limit = getLimit(req);
    const result = db.exec("SELECT * FROM pre_qualifications ORDER BY createdAt DESC LIMIT ?", [limit]);
    if (result.length === 0) return res.json({ requests: [] });
    const cols = result[0].columns;
    const requests = result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/pre-qualifications/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['new', 'contacted', 'qualified', 'disqualified'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const db = getDbSync();
    db.run("UPDATE pre_qualifications SET status = ? WHERE id = ?", [status, parseInt(req.params.id)]);
    saveDb();
    res.json({ message: 'Pre-qualification status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== LEADS (CRM PIPELINE) =====
app.get('/api/leads', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const limit = getLimit(req);
    const result = db.exec("SELECT * FROM leads ORDER BY updatedAt DESC, id DESC LIMIT ?", [limit]);
    if (result.length === 0) return res.json({ leads: [] });
    const cols = result[0].columns;
    const leads = result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
    res.json({ leads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/leads', (req, res) => {
  try {
    const { name, email, phone, type, source, notes } = req.body;
    if (!validName(name)) return res.status(400).json({ error: 'Name must be 2-120 characters' });
    if (!validEmail(email)) return res.status(400).json({ error: 'A valid email is required' });
    if (!validPhone(phone)) return res.status(400).json({ error: 'Phone is invalid' });
    const db = getDbSync();
    db.run("INSERT INTO leads (name, email, phone, type, status, source, notes) VALUES (?, ?, ?, ?, 'new', ?, ?)",
      [name.trim(), email.trim().toLowerCase(), phone || null, type || 'buyer', source || 'manual', notes || null]);
    saveDb();
    res.status(201).json({ message: 'Lead created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/valuations', (req, res) => {
  try {
    const { address, city, state, beds, sqft, name, email, phone } = req.body;
    if (!city || !state) return res.status(400).json({ error: 'City and state are required' });
    const db = getDbSync();

    const estimateSqftFromBeds = (b) => {
      const table = { 1: 750, 2: 1100, 3: 1700, 4: 2300, 5: 3000, 6: 3800 };
      const bedsNum = parseInt(b);
      return table[bedsNum] || 1700;
    };
    const providedSqft = parseFloat(sqft);
    const estimateSqft = providedSqft > 0 ? providedSqft : estimateSqftFromBeds(beds);

    const collectPerSqft = (whereSql, params) => {
      const rows = db.exec(`
        SELECT price, sqft FROM properties
        WHERE price > 0 AND sqft > 0 ${whereSql}
        LIMIT 250`, params);
      const out = [];
      if (rows.length > 0 && rows[0].values.length > 0) {
        for (const r of rows[0].values) out.push(r[0] / r[1]);
      }
      return out;
    };

    let perSqftList = collectPerSqft("AND LOWER(city) = LOWER(?) AND LOWER(state) = LOWER(?)", [city, state]);
    let scope = 'city';
    if (perSqftList.length < 3) {
      perSqftList = collectPerSqft("AND LOWER(state) = LOWER(?)", [state]);
      scope = 'state';
    }
    if (perSqftList.length < 3) {
      perSqftList = collectPerSqft("", []);
      scope = 'national';
    }

    const sorted = [...perSqftList].sort((a, b) => a - b);
    const medianPerSqft = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 520;

    const estimate = Math.max(10000, Math.round(estimateSqft * medianPerSqft / 1000) * 1000);
    const rangeLow = Math.round(estimate * 0.92 / 1000) * 1000;
    const rangeHigh = Math.round(estimate * 1.08 / 1000) * 1000;

    if (name && email && phone) {
      if (validName(name) && validEmail(email) && validPhone(phone)) {
        const notes = `Valuation request for ${address || 'unknown address'}, ${city}, ${state} — estimated $${estimate.toLocaleString()}`;
        db.run("INSERT INTO leads (name, email, phone, type, status, source, notes) VALUES (?, ?, ?, 'seller', 'new', 'valuation', ?)",
          [name.trim(), email.trim().toLowerCase(), phone, notes]);
        notify('valuation', `Valuation request from ${name.trim()} for ${city}, ${state}`, '/admin');
      }
    }
    saveDb();

    res.json({
      estimate,
      rangeLow,
      rangeHigh,
      perSqft: Math.round(medianPerSqft),
      comparables: sorted.length,
      scope,
      sqft: estimateSqft,
      message: 'Valuation estimate generated from comparable listings',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/leads/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { status, type, agent, notes, budget } = req.body;
    const db = getDbSync();
    db.run("UPDATE leads SET status = COALESCE(?, status), type = COALESCE(?, type), agent = COALESCE(?, agent), notes = COALESCE(?, notes), budget = COALESCE(?, budget), updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [status || null, type || null, agent || null, notes || null, budget ?? null, parseInt(req.params.id)]);
    saveDb();
    res.json({ message: 'Lead updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/leads/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    db.run("DELETE FROM leads WHERE id = ?", [parseInt(req.params.id)]);
    saveDb();
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== OPEN HOUSES =====
app.get('/api/open-houses', (req, res) => {
  try {
    const db = getDbSync();
    const result = db.exec(`
      SELECT oh.*, p.title as propertyTitle, p.image as propertyImage, p.address as propertyAddress,
        (SELECT COUNT(*) FROM open_house_rsvps r WHERE r.openHouseId = oh.id) as rsvpCount
      FROM open_houses oh
      LEFT JOIN properties p ON p.id = oh.propertyId
      WHERE oh.date >= date('now')
      ORDER BY oh.date ASC, oh.startTime ASC
    `);
    if (result.length === 0) return res.json({ openHouses: [] });
    const cols = result[0].columns;
    const openHouses = result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
    res.json({ openHouses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/open-houses/all', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const result = db.exec(`
      SELECT oh.*, p.title as propertyTitle, p.image as propertyImage,
        (SELECT COUNT(*) FROM open_house_rsvps r WHERE r.openHouseId = oh.id) as rsvpCount
      FROM open_houses oh
      LEFT JOIN properties p ON p.id = oh.propertyId
      ORDER BY oh.date DESC, oh.startTime DESC
    `);
    if (result.length === 0) return res.json({ openHouses: [] });
    const cols = result[0].columns;
    const openHouses = result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
    res.json({ openHouses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/open-houses', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { propertyId, title, date, startTime, endTime, description } = req.body;
    if (!propertyId || !date || !startTime) return res.status(400).json({ error: 'Property, date and start time are required' });
    const db = getDbSync();
    db.run("INSERT INTO open_houses (propertyId, title, date, startTime, endTime, description) VALUES (?, ?, ?, ?, ?, ?)",
      [parseInt(propertyId), title || null, date, startTime, endTime || null, description || null]);
    saveDb();
    res.status(201).json({ message: 'Open house created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/open-houses/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { title, date, startTime, endTime, description, status } = req.body;
    const db = getDbSync();
    db.run("UPDATE open_houses SET title = ?, date = ?, startTime = ?, endTime = ?, description = ?, status = ? WHERE id = ?",
      [title || null, date, startTime, endTime || null, description || null, status || 'upcoming', parseInt(req.params.id)]);
    saveDb();
    res.json({ message: 'Open house updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/open-houses/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    db.run("DELETE FROM open_house_rsvps WHERE openHouseId = ?", [parseInt(req.params.id)]);
    db.run("DELETE FROM open_houses WHERE id = ?", [parseInt(req.params.id)]);
    saveDb();
    res.json({ message: 'Open house deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/open-houses/:id/rsvp', async (req, res) => {
  try {
    const { name, email, phone, guests } = req.body;
    if (!validName(name)) return res.status(400).json({ error: 'Name must be 2-120 characters' });
    if (!validEmail(email)) return res.status(400).json({ error: 'A valid email is required' });
    if (!validPhone(phone)) return res.status(400).json({ error: 'Phone is invalid' });
    const db = getDbSync();
    db.run("INSERT INTO open_house_rsvps (openHouseId, name, email, phone, guests) VALUES (?, ?, ?, ?, ?)",
      [parseInt(req.params.id), name.trim(), email.trim().toLowerCase(), phone || null, parseInt(guests) || 1]);
    saveDb();
    const oh = db.exec("SELECT date, startTime, endTime FROM open_houses WHERE id = ?", [parseInt(req.params.id)]);
    if (oh.length > 0 && oh[0].values.length > 0) {
      notify('open-house', `New RSVP from ${name} (${oh[0].values[0][0]} ${oh[0].values[0][1]})`, '/admin');
    }
    createLead({ name, email, phone, type: 'buyer', source: 'open-house', notes: `Open house RSVP ${oh.length > 0 && oh[0].values.length > 0 ? oh[0].values[0][0] : ''}` });
    res.status(201).json({ message: 'RSVP confirmed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/open-houses/:id/rsvps', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const result = db.exec("SELECT * FROM open_house_rsvps WHERE openHouseId = ? ORDER BY createdAt DESC", [parseInt(req.params.id)]);
    if (result.length === 0) return res.json({ rsvps: [] });
    const cols = result[0].columns;
    const rsvps = result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
    res.json({ rsvps });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ADMIN NOTIFICATIONS =====
app.get('/api/notifications', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const result = db.exec("SELECT * FROM notifications WHERE userId IS NULL ORDER BY createdAt DESC LIMIT 50");
    if (result.length === 0) return res.json({ notifications: [] });
    const cols = result[0].columns;
    const notifications = result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/notifications/mine', authMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const result = db.exec("SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 50", [req.user.id]);
    if (result.length === 0) return res.json({ notifications: [] });
    const cols = result[0].columns;
    const notifications = result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/notifications/unread-count', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const result = db.exec("SELECT COUNT(*) as c FROM notifications WHERE read = 0 AND userId IS NULL");
    res.json({ count: result[0].values[0][0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/:id/read', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    db.run("UPDATE notifications SET read = 1 WHERE id = ? AND userId IS NULL", [parseInt(req.params.id)]);
    saveDb();
    res.json({ message: 'Notification marked read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/read-all', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    db.run("UPDATE notifications SET read = 1 WHERE read = 0 AND userId IS NULL");
    saveDb();
    res.json({ message: 'All notifications marked read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== USER MANAGEMENT =====
app.get('/api/users', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const result = db.exec("SELECT id, name, email, isAdmin, active, createdAt FROM users ORDER BY createdAt ASC");
    if (result.length === 0) return res.json({ users: [] });
    const cols = result[0].columns;
    const users = result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { active, isAdmin, password } = req.body;
    const id = parseInt(req.params.id);
    if (id === req.user.id && active === 0) {
      return res.status(400).json({ error: 'You cannot deactivate your own account' });
    }
    const db = getDbSync();
    if (typeof active === 'number') {
      db.run("UPDATE users SET active = ? WHERE id = ?", [active ? 1 : 0, id]);
    }
    if (typeof isAdmin === 'boolean') {
      db.run("UPDATE users SET isAdmin = ? WHERE id = ?", [isAdmin ? 1 : 0, id]);
    }
    if (password) {
      if (!validPassword(password)) return res.status(400).json({ error: 'Password must be at least 8 characters' });
      const hash = bcrypt.hashSync(password, 10);
      db.run("UPDATE users SET password = ? WHERE id = ?", [hash, id]);
    }
    saveDb();
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }
    const db = getDbSync();
    const row = db.exec("SELECT isAdmin FROM users WHERE id = ?", [id]);
    if (row.length > 0 && row[0].values.length > 0 && row[0].values[0][0] === 1) {
      return res.status(400).json({ error: 'Admins must be demoted before deletion' });
    }
    db.run("DELETE FROM favorites WHERE userId = ?", [id]);
    db.run("DELETE FROM saved_searches WHERE userId = ?", [id]);
    db.run("DELETE FROM offers WHERE userId = ?", [id]);
    db.run("DELETE FROM notifications WHERE userId = ?", [id]);
    db.run("DELETE FROM users WHERE id = ?", [id]);
    saveDb();
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== CSV IMPORT + BULK =====
app.post('/api/properties/import', authMiddleware, adminMiddleware, csvUpload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const content = fs.readFileSync(req.file.path, 'utf8');
    fs.unlinkSync(req.file.path);
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return res.status(400).json({ error: 'CSV must have a header row and at least one data row' });
    const parseCsvLine = (line) => {
      const cells = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
          if (ch === '"') {
            if (line[i + 1] === '"') { cur += '"'; i++; }
            else inQuotes = false;
          } else cur += ch;
        } else if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          cells.push(cur.trim());
          cur = '';
        } else {
          cur += ch;
        }
      }
      cells.push(cur.trim());
      return cells;
    };
    const headers = parseCsvLine(lines[0]);
    const db = getDbSync();
    const cols = "title, address, city, state, zip, country, price, beds, baths, sqft, type, status, yearBuilt, description, agent, tags, image, badge, featured";
    const colList = cols.split(', ');
    let inserted = 0;
    for (let i = 1; i < lines.length; i++) {
      const cells = parseCsvLine(lines[i]);
      const row = {};
      headers.forEach((h, idx) => { row[h] = cells[idx] !== undefined ? cells[idx] : ''; });
      const pick = (name) => row[name] !== undefined ? row[name] : '';
      db.run(`INSERT INTO properties (${colList.join(', ')}) VALUES (${colList.map(() => '?').join(', ')})`,
        [pick('title'), pick('address'), pick('city'), pick('state'), pick('zip'), pick('country') || 'US', pick('price') || 0, pick('beds') || 1, pick('baths') || 1, pick('sqft') || 0, pick('type') || 'House', pick('status') || 'For Sale', pick('yearBuilt') || null, pick('description'), pick('agent'), pick('tags'), pick('image'), pick('badge'), pick('featured') ? 1 : 0]);
      inserted++;
    }
    saveDb();
    res.status(201).json({ message: `${inserted} properties imported` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== BULK PROPERTY ACTIONS =====
app.post('/api/properties/bulk', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { ids, field, value } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'No properties selected' });
    const placeholders = ids.map(() => '?').join(',');
    const db = getDbSync();
    if (field === 'delete') {
      const delRows = db.exec(`SELECT image, images, floorPlan FROM properties WHERE id IN (${placeholders})`, ids);
      if (delRows.length > 0) {
        const idx = delRows[0].columns;
        delRows[0].values.forEach(row => {
          const obj = {};
          idx.forEach((c, i) => { obj[c] = row[i]; });
          let imgArr = [];
          try { imgArr = obj.images ? JSON.parse(obj.images) : []; } catch { /* ignore */ }
          removeUploadedFiles([obj.image, obj.floorPlan, ...(Array.isArray(imgArr) ? imgArr : [])]);
        });
      }
      db.run(`DELETE FROM properties WHERE id IN (${placeholders})`, ids);
    } else if (field === 'featured') {
      db.run(`UPDATE properties SET featured = ? WHERE id IN (${placeholders})`, [value ? 1 : 0, ...ids]);
    } else if (field === 'isPrivate') {
      db.run(`UPDATE properties SET isPrivate = ? WHERE id IN (${placeholders})`, [value ? 1 : 0, ...ids]);
    } else {
      return res.status(400).json({ error: 'Unsupported field' });
    }
    saveDb();
    res.json({ message: `${ids.length} properties updated` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== SMTP TEST =====
app.post('/api/settings/smtp-test', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { to } = req.body;
    const target = to || process.env.ADMIN_EMAIL || 'admin@dreamhomes.com';
    const info = await transporter.sendMail({
      from: `"Dream Homes" <${process.env.SMTP_USER || 'noreply@dreamhomes.com'}>`,
      to: target,
      subject: 'Dream Homes SMTP Test',
      text: 'This is a test email from your Dream Homes server. If you are reading this, SMTP is configured correctly.'
    });
    res.json({ message: `Test email sent (${info.messageId})` });
  } catch (err) {
    res.status(500).json({ error: `SMTP test failed: ${err.message}` });
  }
});

// ===== TESTIMONIALS =====
app.get('/api/testimonials', (req, res) => {
  try {
    const db = getDbSync();
    const result = db.exec("SELECT * FROM testimonials WHERE active = 1 ORDER BY createdAt DESC");
    if (result.length === 0) return res.json({ testimonials: [] });
    const cols = result[0].columns;
    const testimonials = result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
    res.json({ testimonials });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/testimonials/admin', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const result = db.exec("SELECT * FROM testimonials ORDER BY createdAt DESC");
    if (result.length === 0) return res.json({ testimonials: [] });
    const cols = result[0].columns;
    const testimonials = result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
    res.json({ testimonials });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/testimonials', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { name, role, content, rating, avatar } = req.body;
    const db = getDbSync();
    db.run("INSERT INTO testimonials (name, role, content, rating, avatar) VALUES (?, ?, ?, ?, ?)",
      [name, role, content, rating || 5, avatar || null]);
    const result = db.exec("SELECT last_insert_rowid()");
    saveDb();
    res.status(201).json({ id: result[0].values[0][0], message: 'Testimonial created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/testimonials/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { name, role, content, rating, avatar, active } = req.body;
    const db = getDbSync();
    db.run("UPDATE testimonials SET name=?, role=?, content=?, rating=?, avatar=?, active=? WHERE id=?",
      [name, role, content, rating, avatar, active !== undefined ? (active ? 1 : 0) : 1, parseInt(req.params.id)]);
    saveDb();
    res.json({ message: 'Testimonial updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/testimonials/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    db.run("DELETE FROM testimonials WHERE id = ?", [parseInt(req.params.id)]);
    saveDb();
    res.json({ message: 'Testimonial deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== BLOG / NEWS =====
app.get('/api/blog', (req, res) => {
  try {
    const db = getDbSync();
    const result = db.exec("SELECT * FROM blog_posts WHERE published = 1 ORDER BY createdAt DESC");
    if (result.length === 0) return res.json({ posts: [] });
    const cols = result[0].columns;
    const posts = result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      if (obj.tags && typeof obj.tags === 'string') obj.tags = JSON.parse(obj.tags);
      return obj;
    });
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/blog/admin', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const result = db.exec("SELECT * FROM blog_posts ORDER BY createdAt DESC");
    if (result.length === 0) return res.json({ posts: [] });
    const cols = result[0].columns;
    const posts = result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      if (obj.tags && typeof obj.tags === 'string') obj.tags = JSON.parse(obj.tags);
      return obj;
    });
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/blog/:id', (req, res) => {
  try {
    const db = getDbSync();
    const result = db.exec("SELECT * FROM blog_posts WHERE id = ? AND published = 1", [parseInt(req.params.id)]);
    if (result.length === 0 || result[0].values.length === 0) return res.status(404).json({ error: 'Post not found' });
    const cols = result[0].columns;
    const row = result[0].values[0];
    const post = {};
    cols.forEach((col, i) => { post[col] = row[i]; });
    if (post.tags && typeof post.tags === 'string') post.tags = JSON.parse(post.tags);
    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/blog', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { title, slug, content, excerpt, image, author, tags, published } = req.body;
    const db = getDbSync();
    db.run("INSERT INTO blog_posts (title, slug, content, excerpt, image, author, tags, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [title, slug, content, excerpt, image, author, JSON.stringify(tags || []), published ? 1 : 0]);
    const result = db.exec("SELECT last_insert_rowid()");
    saveDb();
    res.status(201).json({ id: result[0].values[0][0], message: 'Blog post created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/blog/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { title, slug, content, excerpt, image, author, tags, published } = req.body;
    const db = getDbSync();
    db.run("UPDATE blog_posts SET title=?, slug=?, content=?, excerpt=?, image=?, author=?, tags=?, published=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?",
      [title, slug, content, excerpt, image, author, JSON.stringify(tags || []), published ? 1 : 0, parseInt(req.params.id)]);
    saveDb();
    res.json({ message: 'Blog post updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/blog/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    db.run("DELETE FROM blog_posts WHERE id = ?", [parseInt(req.params.id)]);
    saveDb();
    res.json({ message: 'Blog post deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== SAVED SEARCHES =====
app.get('/api/saved-searches', authMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const result = db.exec("SELECT * FROM saved_searches WHERE userId = ? ORDER BY createdAt DESC", [req.user.id]);
    if (result.length === 0) return res.json({ savedSearches: [] });
    const cols = result[0].columns;
    const savedSearches = result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      if (obj.filters && typeof obj.filters === 'string') obj.filters = JSON.parse(obj.filters);
      return obj;
    });
    res.json({ savedSearches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/saved-searches', authMiddleware, (req, res) => {
  try {
    const { name, filters, alertEnabled } = req.body;
    const db = getDbSync();
    db.run("INSERT INTO saved_searches (userId, name, filters, alertEnabled) VALUES (?, ?, ?, ?)",
      [req.user.id, name, JSON.stringify(filters || {}), alertEnabled ? 1 : 0]);
    const result = db.exec("SELECT last_insert_rowid()");
    saveDb();
    res.status(201).json({ id: result[0].values[0][0], message: 'Search saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/saved-searches/:id', authMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const result = db.exec("SELECT userId FROM saved_searches WHERE id = ?", [parseInt(req.params.id)]);
    if (result.length === 0 || result[0].values.length === 0) return res.status(404).json({ error: 'Not found' });
    if (result[0].values[0][0] !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    db.run("DELETE FROM saved_searches WHERE id = ?", [parseInt(req.params.id)]);
    saveDb();
    res.json({ message: 'Saved search deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/saved-searches/:id', authMiddleware, (req, res) => {
  try {
    const { alertEnabled } = req.body;
    const db = getDbSync();
    const result = db.exec("SELECT userId FROM saved_searches WHERE id = ?", [parseInt(req.params.id)]);
    if (result.length === 0 || result[0].values.length === 0) return res.status(404).json({ error: 'Not found' });
    if (result[0].values[0][0] !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    db.run("UPDATE saved_searches SET alertEnabled = ?, lastAlertAt = CASE WHEN ? = 1 THEN lastAlertAt ELSE NULL END WHERE id = ?",
      [alertEnabled ? 1 : 0, alertEnabled ? 1 : 0, parseInt(req.params.id)]);
    saveDb();
    res.json({ message: 'Saved search updated', alertEnabled: !!alertEnabled });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function buildSearchQuery(filters) {
  const where = [];
  const params = [];
  if (filters.search) {
    const s = `%${filters.search}%`;
    where.push("(title LIKE ? OR city LIKE ? OR state LIKE ? OR description LIKE ? OR address LIKE ?)");
    params.push(s, s, s, s, s);
  }
  if (filters.beds) { where.push("beds >= ?"); params.push(parseInt(filters.beds)); }
  if (filters.baths) { where.push("baths >= ?"); params.push(parseInt(filters.baths)); }
  if (filters.minPrice) { where.push("price >= ?"); params.push(parseFloat(filters.minPrice)); }
  if (filters.maxPrice) { where.push("price <= ?"); params.push(parseFloat(filters.maxPrice)); }
  if (filters.type) { where.push("type = ?"); params.push(filters.type); }
  if (filters.status) { where.push("status = ?"); params.push(filters.status); }
  if (filters.minYear) { where.push("yearBuilt >= ?"); params.push(parseInt(filters.minYear)); }
  if (filters.maxYear) { where.push("yearBuilt <= ?"); params.push(parseInt(filters.maxYear)); }
  if (filters.minSqft) { where.push("sqft >= ?"); params.push(parseFloat(filters.minSqft)); }
  if (filters.maxSqft) { where.push("sqft <= ?"); params.push(parseFloat(filters.maxSqft)); }
  if (filters.amenities && filters.amenities.length > 0) {
    filters.amenities.forEach(a => {
      where.push("(tags LIKE ? OR tags LIKE ?)");
      params.push(`%${a.trim()}%`, `%${a.trim()}%`);
    });
  }
  return { whereClause: where.length ? `WHERE ${where.join(" AND ")}` : 'WHERE 1=1', params };
}

async function runSavedSearchAlerts() {
  const db = getDbSync();
  if (!db) return;
  const nowIso = new Date().toISOString();
  try {
    const result = db.exec(`
      SELECT ss.id, ss.userId, ss.name, ss.filters, ss.lastAlertAt, u.email, u.name as userName
      FROM saved_searches ss
      JOIN users u ON u.id = ss.userId
      WHERE ss.alertEnabled = 1
    `);
    if (result.length === 0 || result[0].values.length === 0) {
      console.log('[Saved Search Alerts] No enabled alerts found');
      return;
    }
    const cols = result[0].columns;
    const searches = result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      if (obj.filters) try { obj.filters = JSON.parse(obj.filters); } catch { obj.filters = {}; }
      return obj;
    });

    let checked = 0;
    for (const s of searches) {
      const { whereClause, params } = buildSearchQuery(s.filters || {});
      const since = new Date(s.lastAlertAt || s.createdAt || '1970-01-01').toISOString().slice(0, 19).replace('T', ' ');
      const stmt = db.prepare(`SELECT id, title, price, city, state, image FROM properties ${whereClause} AND createdAt > ? ORDER BY createdAt DESC LIMIT 10`);
      stmt.bind([...params, since]);
      const matches = [];
      while (stmt.step()) matches.push(stmt.getAsObject());
      stmt.free();

      if (matches.length > 0) {
        const propertyRows = matches.map(p => `
          <div style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #E5DDD4;border-radius:8px;margin-bottom:8px">
            ${p.image ? `<img src="${p.image}" alt="${p.title}" width="80" height="60" style="border-radius:6px;object-fit:cover" />` : ''}
            <div>
              <p style="margin:0 0 4px;font-weight:600;color:#1A1714">${p.title}</p>
              <p style="margin:0;color:#6B6258;font-size:0.85rem">${p.city}, ${p.state} &mdash; <strong>$${parseFloat(p.price).toLocaleString()}</strong></p>
              <a href="${(process.env.FRONTEND_URL || 'http://localhost:5177')}/property/${p.id}" style="color:#A8882E;font-size:0.85rem">View property &rarr;</a>
            </div>
          </div>`).join('');

        console.log(`[Saved Search Alerts] ${matches.length} new match(es) for "${s.name}" (${s.email})`);
        try {
          await transporter.sendMail({
            from: '"Dream Homes" <noreply@dreamhomes.com>',
            to: s.email,
            subject: `${matches.length} new ${matches.length === 1 ? 'property' : 'properties'} match your search on Dream Homes`,
            html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:auto">
              <div style="background:linear-gradient(135deg,#C9A84C,#A8882E);padding:24px;text-align:center">
                <h1 style="color:#fff;margin:0;font-family:Playfair Display,serif">Dream Homes</h1>
                <p style="color:rgba(255,255,255,.85);margin:4px 0 0">Luxury Real Estate</p>
              </div>
              <div style="padding:32px 24px;background:#fff">
                <h2 style="color:#1A1714">Hi ${s.userName},</h2>
                <p style="color:#3D3529;line-height:1.6">We found new listings matching your saved search <strong>"${s.name}"</strong>:</p>
                ${propertyRows}
                <p style="color:#6B6258;font-size:0.85rem">Manage your saved searches and alerts from your <a href="${process.env.FRONTEND_URL || 'http://localhost:5177'}/profile" style="color:#A8882E">profile page</a>.</p>
              </div>
              <div style="text-align:center;padding:16px;border-top:1px solid #E5DDD4;font-size:0.75rem;color:#9C948A">
                Dream Homes &mdash; dreamhomes.com &mdash; (800) 555-HOME
              </div>
            </div>`
          });
        } catch (mailErr) {
          console.log(`[Saved Search Alerts] Email failed for "${s.name}":`, mailErr.message);
        }
      }
      db.run("UPDATE saved_searches SET lastAlertAt = ? WHERE id = ?", [nowIso, s.id]);
      checked++;
    }
    saveDb();
    console.log(`[Saved Search Alerts] Finished: checked ${checked} alert(s) at ${nowIso}`);
  } catch (err) {
    console.log('[Saved Search Alerts] Error:', err.message);
  }
}

app.post('/api/saved-searches/run-alerts', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    runSavedSearchAlerts().then(() => {
      res.json({ message: 'Saved search alerts run completed' });
    }).catch((err) => {
      res.status(500).json({ error: err.message });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ANALYTICS =====
app.post('/api/analytics/view', (req, res) => {
  try {
    const { propertyId, page, referrer } = req.body;
    const db = getDbSync();
    db.run("INSERT INTO page_views (propertyId, page, referrer) VALUES (?, ?, ?)",
      [propertyId || null, page || '/', referrer || null]);
    saveDb();
    res.status(201).json({ message: 'View tracked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/analytics/inquiry', (req, res) => {
  try {
    const { propertyId, name, email, phone, message } = req.body;
    const db = getDbSync();
    db.run("INSERT INTO inquiries (propertyId, name, email, phone, message) VALUES (?, ?, ?, ?, ?)",
      [propertyId || null, name, email, phone, message]);
    saveDb();
    res.status(201).json({ message: 'Inquiry recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/stats', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const totalViews = db.exec("SELECT COUNT(*) as count FROM page_views");
    const totalInquiries = db.exec("SELECT COUNT(*) as count FROM inquiries");
    const viewsPerProperty = db.exec("SELECT pv.propertyId, p.title, COUNT(*) as views FROM page_views pv LEFT JOIN properties p ON pv.propertyId = p.id WHERE pv.propertyId IS NOT NULL GROUP BY pv.propertyId ORDER BY views DESC LIMIT 10");
    const topProperties = db.exec("SELECT p.id, p.title, p.image, p.price, COUNT(pv.id) as views FROM properties p LEFT JOIN page_views pv ON p.id = pv.propertyId GROUP BY p.id ORDER BY views DESC LIMIT 5");
    const inquiryTrends = db.exec("SELECT strftime('%Y-%m-%d', createdAt) as date, COUNT(*) as count FROM inquiries GROUP BY date ORDER BY date DESC LIMIT 30");

    const toArray = (result) => {
      if (result.length === 0) return [];
      const cols = result[0].columns;
      return result[0].values.map(row => {
        const obj = {};
        cols.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
      });
    };

    res.json({
      totalViews: totalViews[0]?.values[0]?.[0] || 0,
      totalInquiries: totalInquiries[0]?.values[0]?.[0] || 0,
      viewsPerProperty: toArray(viewsPerProperty),
      topProperties: toArray(topProperties),
      inquiryTrends: toArray(inquiryTrends)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== AGENTS DIRECTORY =====
app.get('/api/agents', (req, res) => {
  try {
    const db = getDbSync();
    const result = db.exec(`
      SELECT a.*,
        (SELECT COUNT(*) FROM properties p WHERE p.agent = a.name) as listingCount,
        (SELECT COALESCE(SUM(p.price), 0) FROM properties p WHERE p.agent = a.name AND p.status != 'Sold') as portfolioValue
      FROM agents a
      WHERE a.active = 1
      ORDER BY a.name
    `);
    if (result.length === 0) return res.json({ agents: [] });
    const cols = result[0].columns;
    const agents = result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
    res.json({ agents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/agents/:id', (req, res) => {
  try {
    const db = getDbSync();
    const idOrName = req.params.id;
    let result = null;
    const numericId = parseInt(idOrName);
    if (!Number.isNaN(numericId)) {
      result = db.exec("SELECT * FROM agents WHERE id = ? AND active = 1", [numericId]);
    }
    if (!result || result.length === 0 || result[0].values.length === 0) {
      result = db.exec("SELECT * FROM agents WHERE name = ? AND active = 1", [idOrName]);
    }
    if (result.length === 0 || result[0].values.length === 0) return res.status(404).json({ error: 'Agent not found' });
    const cols = result[0].columns;
    const row = result[0].values[0];
    const agent = {};
    cols.forEach((col, i) => { agent[col] = row[i]; });

    const listingsResult = db.exec("SELECT * FROM properties WHERE agent = ? AND isPrivate = 0 ORDER BY featured DESC, createdAt DESC", [agent.name]);
    const listings = [];
    if (listingsResult.length > 0) {
      const lcols = listingsResult[0].columns;
      listingsResult[0].values.forEach(r => {
        const obj = {};
        lcols.forEach((c, i) => { obj[c] = r[i]; });
        obj.images = obj.images ? JSON.parse(obj.images) : [];
        obj.featured = obj.featured === 1;
        listings.push(obj);
      });
    }
    res.json({ agent, listings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== NOTIFICATIONS / EMAIL =====
app.post('/api/notifications/send-test', (req, res) => {
  try {
    const { to, subject, text } = req.body;
    console.log('=== EMAIL NOTIFICATION (no SMTP configured) ===');
    console.log('To:', to || 'test@dreamhomes.com');
    console.log('Subject:', subject || 'Dream Homes Test Notification');
    console.log('Body:', text || 'This is a test notification from Dream Homes.');
    console.log('==============================================');
    res.json({ message: 'Notification logged to console' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Log notifications when contact or tour is submitted
app.post('/api/contacts', async (req, res) => {
  try {
    const { name, email, phone, message, propertyId } = req.body;
    if (!validName(name)) return res.status(400).json({ error: 'Name must be 2-120 characters' });
    if (!validEmail(email)) return res.status(400).json({ error: 'A valid email is required' });
    if (!validPhone(phone)) return res.status(400).json({ error: 'Phone is invalid' });
    if (!message || String(message).trim().length < 5) return res.status(400).json({ error: 'Message is too short' });
    const db = getDbSync();
    db.run("INSERT INTO contacts (name, email, phone, message, propertyId) VALUES (?, ?, ?, ?, ?)", [name.trim(), email.trim().toLowerCase(), phone || null, String(message).trim(), propertyId || null]);
    saveDb();
    let pTitle = null;
    if (propertyId) {
      const p = db.exec("SELECT title FROM properties WHERE id = ?", [parseInt(propertyId)]);
      if (p.length > 0 && p[0].values.length > 0) pTitle = p[0].values[0][0];
    }
    createLead({ name: name.trim(), email: email.trim().toLowerCase(), phone, type: 'buyer', source: 'contact', propertyId, propertyTitle: pTitle, notes: message });
    notify('contact', `New inquiry from ${name.trim()}${pTitle ? ` about ${pTitle}` : ''}`, '/admin');
    console.log('=== CONTACT FORM NOTIFICATION ===');
    console.log('Name:', name.trim());
    console.log('Email:', email.trim().toLowerCase());
    console.log('Phone:', phone || 'N/A');
    console.log('Message:', message);
    console.log('Property ID:', propertyId || 'N/A');
    console.log('=================================');

    try {
      await transporter.sendMail({
        from: '"Dream Homes" <noreply@dreamhomes.com>',
        to: email.trim().toLowerCase(),
        subject: 'Thank you for contacting Dream Homes',
        html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:auto">
          <div style="background:linear-gradient(135deg,#C9A84C,#A8882E);padding:24px;text-align:center">
            <h1 style="color:#fff;margin:0;font-family:Playfair Display,serif">Dream Homes</h1>
            <p style="color:rgba(255,255,255,.85);margin:4px 0 0">Luxury Real Estate</p>
          </div>
          <div style="padding:32px 24px;background:#fff">
            <h2 style="color:#1A1714">Hi ${escHtml(name)},</h2>
            <p style="color:#3D3529;line-height:1.6">Thank you for reaching out to Dream Homes! We have received your inquiry and one of our experienced agents will contact you shortly.</p>
            <div style="background:#F2EFEA;border-radius:8px;padding:16px;margin:16px 0">
              <p style="margin:0 0 8px;font-weight:600;color:#1A1714">Your message:</p>
              <p style="margin:0;color:#3D3529;font-size:0.9rem">"${escHtml(message)}"</p>
            </div>
            <p style="color:#6B6258;font-size:0.85rem">Reference: #${Date.now().toString(36).toUpperCase()}</p>
          </div>
          <div style="text-align:center;padding:16px;border-top:1px solid #E5DDD4;font-size:0.75rem;color:#9C948A">
            Dream Homes &mdash; dreamhomes.com &mdash; (800) 555-HOME
          </div>
        </div>`
      });
      console.log('Auto-reply sent to', email.trim().toLowerCase());
    } catch (mailErr) {
      console.log('Auto-reply failed:', mailErr.message);
    }

    res.status(201).json({ message: 'Contact form submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tours', async (req, res) => {
  try {
    const { name, email, phone, propertyId, preferredDate, preferredTime, message } = req.body;
    if (!validName(name)) return res.status(400).json({ error: 'Name must be 2-120 characters' });
    if (!validEmail(email)) return res.status(400).json({ error: 'A valid email is required' });
    if (!validPhone(phone)) return res.status(400).json({ error: 'Phone is invalid' });
    const db = getDbSync();
    db.run("INSERT INTO tours (name, email, phone, propertyId, preferredDate, preferredTime, message) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name.trim(), email.trim().toLowerCase(), phone || null, propertyId, preferredDate, preferredTime, message]);
    saveDb();
    let pTitle = null;
    if (propertyId) {
      const p = db.exec("SELECT title FROM properties WHERE id = ?", [parseInt(propertyId)]);
      if (p.length > 0 && p[0].values.length > 0) pTitle = p[0].values[0][0];
    }
    createLead({ name: name.trim(), email: email.trim().toLowerCase(), phone, type: 'buyer', source: 'tour', propertyId, propertyTitle: pTitle, notes: `Tour: ${preferredDate || 'any date'} ${preferredTime || ''}` });
    notify('tour', `Tour request from ${name.trim()}${pTitle ? ` for ${pTitle}` : ''}`, '/admin');
    console.log('=== TOUR SCHEDULED NOTIFICATION ===');
    console.log('Name:', name.trim());
    console.log('Email:', email.trim().toLowerCase());
    console.log('Phone:', phone || 'N/A');
    console.log('Property ID:', propertyId);
    console.log('Date:', preferredDate || 'N/A');
    console.log('Time:', preferredTime || 'N/A');
    console.log('Message:', message || 'N/A');
    console.log('====================================');

    try {
      await transporter.sendMail({
        from: '"Dream Homes" <noreply@dreamhomes.com>',
        to: email.trim().toLowerCase(),
        subject: 'Tour Request Confirmed — Dream Homes',
        html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:auto">
          <div style="background:linear-gradient(135deg,#C9A84C,#A8882E);padding:24px;text-align:center">
            <h1 style="color:#fff;margin:0;font-family:Playfair Display,serif">Dream Homes</h1>
            <p style="color:rgba(255,255,255,.85);margin:4px 0 0">Luxury Real Estate</p>
          </div>
          <div style="padding:32px 24px;background:#fff">
            <h2 style="color:#1A1714">Hi ${escHtml(name)},</h2>
            <p style="color:#3D3529;line-height:1.6">Your tour request has been received! Here are the details:</p>
            <div style="background:#F2EFEA;border-radius:8px;padding:16px;margin:16px 0">
              ${preferredDate ? `<p style="margin:0 0 4px;color:#6B6258;font-size:0.85rem">Date: <strong style="color:#1A1714">${escHtml(preferredDate)}</strong></p>` : ''}
              ${preferredTime ? `<p style="margin:0 0 4px;color:#6B6258;font-size:0.85rem">Time: <strong style="color:#1A1714">${escHtml(preferredTime)}</strong></p>` : ''}
              ${propertyId ? `<p style="margin:0 0 4px;color:#6B6258;font-size:0.85rem">Property ID: <strong style="color:#1A1714">${escHtml(propertyId)}</strong></p>` : ''}
              ${message ? `<p style="margin:0;color:#6B6258;font-size:0.85rem">Note: <strong style="color:#1A1714">"${escHtml(message)}"</strong></p>` : ''}
            </div>
            <p style="color:#3D3529">An agent will confirm your appointment shortly.</p>
          </div>
          <div style="text-align:center;padding:16px;border-top:1px solid #E5DDD4;font-size:0.75rem;color:#9C948A">
            Dream Homes &mdash; dreamhomes.com &mdash; (800) 555-HOME
          </div>
        </div>`
      });
      console.log('Tour confirmation sent to', email.trim().toLowerCase());
    } catch (mailErr) {
      console.log('Tour confirmation email failed:', mailErr.message);
    }

    res.status(201).json({ message: 'Tour scheduled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== CHAT (Socket.io + REST) =====
app.get('/api/chat/messages', authMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const limit = getLimit(req);
    const result = db.exec("SELECT * FROM (SELECT * FROM chat_messages ORDER BY createdAt DESC LIMIT ?) ORDER BY createdAt ASC", [limit]);
    if (result.length === 0) return res.json({ messages: [] });
    const cols = result[0].columns;
    const messages = result[0].values.map(row => {
      const obj = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

io.on('connection', (socket) => {
  console.log('Chat client connected:', socket.id);
  let currentUser = null;

  socket.on('join', (data = {}) => {
    try {
      if (!data.token) throw new Error('Missing token');
      const decoded = jwt.verify(data.token, JWT_SECRET);
      const db = getDbSync();
      const result = db.exec("SELECT id, name, email, isAdmin FROM users WHERE id = ?", [decoded.userId]);
      if (result.length === 0 || result[0].values.length === 0) throw new Error('User not found');
      const row = result[0].values[0];
      currentUser = { id: row[0], name: row[1], email: row[2], isAdmin: row[3] === 1 };
      if (currentUser.isAdmin) socket.join('admins');
      socket.join(`user:${currentUser.id}`);
      console.log(`User joined chat: ${currentUser.name} (${currentUser.id})`);
      socket.emit('joined', { ok: true, user: { id: currentUser.id, name: currentUser.name, isAdmin: currentUser.isAdmin } });
    } catch (err) {
      console.log('Chat join rejected:', err.message);
      socket.emit('auth-error', { message: 'Authentication failed. Please sign in.' });
    }
  });

  socket.on('message', (data) => {
    if (!data || typeof data.message !== 'string' || !data.message.trim()) return;
    const db = getDbSync();
    const identity = currentUser
      ? { id: currentUser.id, name: currentUser.name }
      : { id: 'guest', name: 'Guest' };
    db.run("INSERT INTO chat_messages (userId, userName, message) VALUES (?, ?, ?)",
      [identity.id, identity.name, data.message.trim()]);
    const result = db.exec("SELECT last_insert_rowid()");
    const msgId = result[0].values[0][0];
    saveDb();
    io.emit('new-message', {
      id: msgId,
      userId: identity.id,
      userName: identity.name,
      message: data.message.trim(),
      createdAt: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log('Chat client disconnected:', socket.id);
  });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 10MB)' : `Upload failed: ${err.message}`;
    return res.status(400).json({ error: msg });
  }
  if (err && err.message && (String(err.message).includes('Only image files') || String(err.message).includes('Only CSV files'))) {
    return res.status(400).json({ error: err.message });
  }
  console.error('Unhandled error:', err?.message || err);
  res.status(500).json({ error: 'Internal server error' });
});

async function startServer() {
  dbInstance = await getDb();
  server.listen(PORT, () => console.log(`Dream Homes API running on port ${PORT}`));
  const alertMinutes = Math.max(5, parseInt(process.env.ALERT_INTERVAL_MINUTES) || 60);
  setTimeout(() => runSavedSearchAlerts(), 30 * 1000);
  setInterval(() => runSavedSearchAlerts(), alertMinutes * 60 * 1000);
  console.log(`[Saved Search Alerts] Scheduled to run every ${alertMinutes} minutes`);
}

export async function ensureDb() {
  if (!dbInstance) {
    dbInstance = await getDb();
  }
  return dbInstance;
}

export default app;

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  startServer();
}

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import nodemailer from 'nodemailer';
import { getDb, saveDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT) || 3006;
const JWT_SECRET = process.env.JWT_SECRET || 'dream-homes-secret-2026';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5177';

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const corsOrigins = CORS_ORIGIN.split(',').map(s => s.trim());
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());
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

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDbSync();
    const result = db.exec("SELECT id, name, email, isAdmin FROM users WHERE id = ?", [decoded.userId]);
    if (result.length === 0 || result[0].values.length === 0) return res.status(401).json({ error: 'User not found' });
    req.user = { id: result[0].values[0][0], name: result[0].values[0][1], email: result[0].values[0][2], isAdmin: result[0].values[0][3] === 1 };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function adminMiddleware(req, res, next) {
  if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });
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
    const db = getDbSync();
    const existing = db.exec("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0 && existing[0].values.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const hash = bcrypt.hashSync(password, 10);
    db.run("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, hash]);
    saveDb();
    const result = db.exec("SELECT last_insert_rowid()");
    const userId = result[0].values[0][0];
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: userId, name, email, isAdmin: false } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const key = `${req.ip || req.socket.remoteAddress || 'unknown'}:${String(email || '').toLowerCase()}`;
    const check = checkLoginRateLimit(key);
    if (!check.allowed) {
      return res.status(429).json({
        error: 'Too many login attempts. Please try again later.',
        retryAfter: Math.ceil(check.retryMs / 1000),
      });
    }
    const db = getDbSync();
    const result = db.exec("SELECT id, name, email, password, isAdmin FROM users WHERE email = ?", [email]);
    if (result.length === 0 || result[0].values.length === 0) {
      recordLoginFailure(key);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const row = result[0].values[0];
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

app.get('/api/properties', (req, res) => {
  try {
    const db = getDbSync();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 12));
    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params = [];

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
      whereClause += " AND (sqft >= ? OR size >= ?)";
      params.push(parseFloat(req.query.minSqft), parseFloat(req.query.minSqft));
    }
    if (req.query.maxSqft) {
      whereClause += " AND (sqft <= ? OR size <= ?)";
      params.push(parseFloat(req.query.maxSqft), parseFloat(req.query.maxSqft));
    }
    if (req.query.amenities) {
      const amenities = req.query.amenities.split(',');
      amenities.forEach(a => {
        whereClause += " AND (tags LIKE ? OR tags LIKE ?)";
        params.push(`%${a.trim()}%`, `%${a.trim()}%`);
      });
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
        featured: row.featured === 1
      });
    }
    stmt.free();
    res.json({ properties, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/properties/:id', (req, res) => {
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
  property.featured = property.featured === 1;
  property.video = property.video || null;
    res.json({ property });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/properties', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { title, address, city, state, zip, country, price, beds, baths, sqft, type, status, yearBuilt, description, agent, agentPhone, agentEmail, tags, image, images, video, badge, featured, latitude, longitude, lotSize, hoa, propertyTaxes, garage, stories, cooling, heating, parking, roof, viewType, basement } = req.body;
    const db = getDbSync();
    db.run(`INSERT INTO properties (title, address, city, state, zip, country, price, beds, baths, sqft, type, status, yearBuilt, description, agent, agentPhone, agentEmail, tags, image, images, video, badge, featured, latitude, longitude, lotSize, hoa, propertyTaxes, garage, stories, cooling, heating, parking, roof, viewType, basement)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, address, city, state, zip, country || 'US', price, beds, baths, sqft, type, status || 'For Sale', yearBuilt, description, agent, agentPhone, agentEmail, tags, image, JSON.stringify(images || []), video || null, badge, featured ? 1 : 0, latitude, longitude, lotSize || null, hoa || null, propertyTaxes || null, garage || null, stories || null, cooling || null, heating || null, parking || null, roof || null, viewType || null, basement || null]);
    saveDb();
    const result = db.exec("SELECT last_insert_rowid()");
    const id = result[0].values[0][0];
    res.status(201).json({ id, message: 'Property created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/properties/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { title, address, city, state, zip, country, price, beds, baths, sqft, type, status, yearBuilt, description, agent, agentPhone, agentEmail, tags, image, images, video, badge, featured, latitude, longitude, lotSize, hoa, propertyTaxes, garage, stories, cooling, heating, parking, roof, viewType, basement } = req.body;
    const db = getDbSync();
    db.run(`UPDATE properties SET title=?, address=?, city=?, state=?, zip=?, country=?, price=?, beds=?, baths=?, sqft=?, type=?, status=?, yearBuilt=?, description=?, agent=?, agentPhone=?, agentEmail=?, tags=?, image=?, images=?, video=?, badge=?, featured=?, latitude=?, longitude=?, lotSize=?, hoa=?, propertyTaxes=?, garage=?, stories=?, cooling=?, heating=?, parking=?, roof=?, viewType=?, basement=? WHERE id=?`,
      [title, address, city, state, zip, country || 'US', price, beds, baths, sqft, type, status, yearBuilt, description, agent, agentPhone, agentEmail, tags, image, JSON.stringify(images || []), video || null, badge, featured ? 1 : 0, latitude, longitude, lotSize || null, hoa || null, propertyTaxes || null, garage || null, stories || null, cooling || null, heating || null, parking || null, roof || null, viewType || null, basement || null, parseInt(req.params.id)]);
    saveDb();
    res.json({ message: 'Property updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/properties/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDbSync();
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
    const result = db.exec("SELECT * FROM contacts ORDER BY createdAt DESC");
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

app.get('/api/tours', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const result = db.exec("SELECT t.*, p.title as propertyTitle FROM tours t LEFT JOIN properties p ON t.propertyId = p.id ORDER BY t.createdAt DESC");
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
    const db = getDbSync();
    const existing = db.exec("SELECT id FROM newsletters WHERE email = ?", [email]);
    if (existing.length > 0 && existing[0].values.length > 0) {
      return res.status(400).json({ error: 'Email already subscribed' });
    }
    db.run("INSERT INTO newsletters (email) VALUES (?)", [email]);
    saveDb();
    res.status(201).json({ message: 'Subscribed to newsletter' });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

app.post('/api/testimonials', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { name, role, content, rating, avatar } = req.body;
    const db = getDbSync();
    db.run("INSERT INTO testimonials (name, role, content, rating, avatar) VALUES (?, ?, ?, ?, ?)",
      [name, role, content, rating || 5, avatar || null]);
    saveDb();
    const result = db.exec("SELECT last_insert_rowid()");
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
    saveDb();
    const result = db.exec("SELECT last_insert_rowid()");
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
    saveDb();
    const result = db.exec("SELECT last_insert_rowid()");
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
    const result = db.exec("SELECT DISTINCT agent, agentPhone, agentEmail FROM properties WHERE agent IS NOT NULL AND agent != '' ORDER BY agent");
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
    const db = getDbSync();
    db.run("INSERT INTO contacts (name, email, phone, message, propertyId) VALUES (?, ?, ?, ?, ?)", [name, email, phone, message, propertyId || null]);
    saveDb();
    console.log('=== CONTACT FORM NOTIFICATION ===');
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Phone:', phone || 'N/A');
    console.log('Message:', message);
    console.log('Property ID:', propertyId || 'N/A');
    console.log('=================================');

    try {
      await transporter.sendMail({
        from: '"Dream Homes" <noreply@dreamhomes.com>',
        to: email,
        subject: 'Thank you for contacting Dream Homes',
        html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:auto">
          <div style="background:linear-gradient(135deg,#C9A84C,#A8882E);padding:24px;text-align:center">
            <h1 style="color:#fff;margin:0;font-family:Playfair Display,serif">Dream Homes</h1>
            <p style="color:rgba(255,255,255,.85);margin:4px 0 0">Luxury Real Estate</p>
          </div>
          <div style="padding:32px 24px;background:#fff">
            <h2 style="color:#1A1714">Hi ${name},</h2>
            <p style="color:#3D3529;line-height:1.6">Thank you for reaching out to Dream Homes! We have received your inquiry and one of our experienced agents will contact you shortly.</p>
            <div style="background:#F2EFEA;border-radius:8px;padding:16px;margin:16px 0">
              <p style="margin:0 0 8px;font-weight:600;color:#1A1714">Your message:</p>
              <p style="margin:0;color:#3D3529;font-size:0.9rem">"${message}"</p>
            </div>
            <p style="color:#6B6258;font-size:0.85rem">Reference: #${Date.now().toString(36).toUpperCase()}</p>
          </div>
          <div style="text-align:center;padding:16px;border-top:1px solid #E5DDD4;font-size:0.75rem;color:#9C948A">
            Dream Homes &mdash; dreamhomes.com &mdash; (800) 555-HOME
          </div>
        </div>`
      });
      console.log('Auto-reply sent to', email);
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
    const db = getDbSync();
    db.run("INSERT INTO tours (name, email, phone, propertyId, preferredDate, preferredTime, message) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, email, phone, propertyId, preferredDate, preferredTime, message]);
    saveDb();
    console.log('=== TOUR SCHEDULED NOTIFICATION ===');
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Phone:', phone || 'N/A');
    console.log('Property ID:', propertyId);
    console.log('Date:', preferredDate || 'N/A');
    console.log('Time:', preferredTime || 'N/A');
    console.log('Message:', message || 'N/A');
    console.log('====================================');

    try {
      await transporter.sendMail({
        from: '"Dream Homes" <noreply@dreamhomes.com>',
        to: email,
        subject: 'Tour Request Confirmed — Dream Homes',
        html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:auto">
          <div style="background:linear-gradient(135deg,#C9A84C,#A8882E);padding:24px;text-align:center">
            <h1 style="color:#fff;margin:0;font-family:Playfair Display,serif">Dream Homes</h1>
            <p style="color:rgba(255,255,255,.85);margin:4px 0 0">Luxury Real Estate</p>
          </div>
          <div style="padding:32px 24px;background:#fff">
            <h2 style="color:#1A1714">Hi ${name},</h2>
            <p style="color:#3D3529;line-height:1.6">Your tour request has been received! Here are the details:</p>
            <div style="background:#F2EFEA;border-radius:8px;padding:16px;margin:16px 0">
              ${preferredDate ? `<p style="margin:0 0 4px;color:#6B6258;font-size:0.85rem">Date: <strong style="color:#1A1714">${preferredDate}</strong></p>` : ''}
              ${preferredTime ? `<p style="margin:0 0 4px;color:#6B6258;font-size:0.85rem">Time: <strong style="color:#1A1714">${preferredTime}</strong></p>` : ''}
              ${propertyId ? `<p style="margin:0 0 4px;color:#6B6258;font-size:0.85rem">Property ID: <strong style="color:#1A1714">${propertyId}</strong></p>` : ''}
              ${message ? `<p style="margin:0;color:#6B6258;font-size:0.85rem">Note: <strong style="color:#1A1714">"${message}"</strong></p>` : ''}
            </div>
            <p style="color:#3D3529">An agent will confirm your appointment shortly.</p>
          </div>
          <div style="text-align:center;padding:16px;border-top:1px solid #E5DDD4;font-size:0.75rem;color:#9C948A">
            Dream Homes &mdash; dreamhomes.com &mdash; (800) 555-HOME
          </div>
        </div>`
      });
      console.log('Tour confirmation sent to', email);
    } catch (mailErr) {
      console.log('Tour confirmation email failed:', mailErr.message);
    }

    res.status(201).json({ message: 'Tour scheduled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== CHAT (Socket.io + REST) =====
app.get('/api/chat/messages', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDbSync();
    const result = db.exec("SELECT * FROM chat_messages ORDER BY createdAt ASC");
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

  socket.on('join', (data) => {
    currentUser = { userId: data.userId, name: data.name };
    console.log(`User joined chat: ${data.name} (${data.userId})`);
  });

  socket.on('message', (data) => {
    const db = getDbSync();
    db.run("INSERT INTO chat_messages (userId, userName, message) VALUES (?, ?, ?)",
      [data.userId, data.userName, data.message]);
    saveDb();
    const result = db.exec("SELECT last_insert_rowid()");
    const msgId = result[0].values[0][0];
    io.emit('new-message', {
      id: msgId,
      userId: data.userId,
      userName: data.userName,
      message: data.message,
      createdAt: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log('Chat client disconnected:', socket.id);
  });
});

async function startServer() {
  dbInstance = await getDb();
  server.listen(PORT, () => console.log(`Dream Homes API running on port ${PORT}`));
}

startServer();

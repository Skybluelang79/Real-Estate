import initSqlJs from 'sql.js';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

// Safe file-URL resolution that works when bundled to CJS by serverless
// tooling (where `import.meta.url` is unavailable/undefined).
const __filename = (() => {
  try {
    if (import.meta && import.meta.url) return fileURLToPath(import.meta.url);
  } catch { /* bundled to CJS */ }
  return process.argv[1] || path.resolve('.');
})();
const __dirname = path.dirname(__filename);

let DB_PATH = process.env.DB_PATH || path.join(__dirname, 'dreamhomes.db');
try {
  fs.accessSync(path.dirname(DB_PATH), fs.constants.W_OK);
} catch {
  DB_PATH = path.join(os.tmpdir(), 'dreamhomes.db');
}
let db = null;

async function initializeDatabase() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    isAdmin INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip TEXT NOT NULL,
    price REAL NOT NULL,
    beds INTEGER NOT NULL,
    baths INTEGER NOT NULL,
    sqft INTEGER NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'For Sale',
    yearBuilt INTEGER,
    description TEXT,
    agent TEXT,
    agentPhone TEXT,
    agentEmail TEXT,
    tags TEXT,
    image TEXT,
    images TEXT,
    video TEXT,
    badge TEXT,
    featured INTEGER DEFAULT 0,
    latitude REAL,
    longitude REAL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  try { db.run("ALTER TABLE properties ADD COLUMN video TEXT"); } catch { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN floorPlan TEXT"); } catch { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN isPrivate INTEGER DEFAULT 0"); } catch { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN country TEXT DEFAULT 'US'"); } catch { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN lotSize REAL"); } catch { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN hoa REAL"); } catch { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN propertyTaxes REAL"); } catch { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN garage INTEGER"); } catch { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN stories INTEGER"); } catch { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN cooling TEXT"); } catch { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN heating TEXT"); } catch { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN parking TEXT"); } catch { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN roof TEXT"); } catch { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN viewType TEXT"); } catch { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN basement TEXT"); } catch { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN status TEXT DEFAULT 'For Sale'"); } catch { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN amenities TEXT"); } catch { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN floorPlans TEXT"); } catch { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN availability TEXT"); } catch { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN retail TEXT"); } catch { /* already exists */ }

  try { db.run("ALTER TABLE users ADD COLUMN passwordResetToken TEXT"); } catch { /* already exists */ }
  try { db.run("ALTER TABLE users ADD COLUMN passwordResetExpires TEXT"); } catch { /* already exists */ }
  try { db.run("ALTER TABLE users ADD COLUMN active INTEGER DEFAULT 1"); } catch { /* already exists */ }
  try { db.run("ALTER TABLE saved_searches ADD COLUMN lastAlertAt TEXT"); } catch { /* already exists */ }

  db.run(`CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    type TEXT DEFAULT 'buyer',
    status TEXT DEFAULT 'new',
    source TEXT,
    notes TEXT,
    agent TEXT,
    propertyId INTEGER,
    propertyTitle TEXT,
    budget REAL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS open_houses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    propertyId INTEGER NOT NULL,
    title TEXT,
    date TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT,
    description TEXT,
    status TEXT DEFAULT 'upcoming',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS open_house_rsvps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    openHouseId INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    guests INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    type TEXT,
    message TEXT NOT NULL,
    link TEXT,
    read INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  try { db.run("ALTER TABLE notifications ADD COLUMN userId INTEGER"); } catch { /* already exists */ }

  db.run(`CREATE TABLE IF NOT EXISTS offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    propertyId INTEGER NOT NULL,
    userId INTEGER,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    amount REAL NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    email TEXT,
    phone TEXT,
    title TEXT,
    bio TEXT,
    photo TEXT,
    specialties TEXT,
    experience TEXT,
    sales TEXT,
    active INTEGER DEFAULT 1
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS pre_qualifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    homePrice REAL,
    downPayment REAL,
    interestRate REAL,
    loanTerm INTEGER,
    monthlyPayment REAL,
    notes TEXT,
    status TEXT DEFAULT 'new',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    propertyId INTEGER,
    status TEXT DEFAULT 'new',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    propertyId INTEGER NOT NULL,
    preferredDate TEXT,
    preferredTime TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    propertyId INTEGER NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userId, propertyId)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sponsors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    logo TEXT,
    website TEXT,
    description TEXT,
    tier TEXT DEFAULT 'standard',
    active INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    image TEXT,
    link TEXT,
    active INTEGER DEFAULT 1,
    expiresAt TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS newsletters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    active INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT,
    content TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    avatar TEXT,
    active INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    image TEXT,
    author TEXT,
    tags TEXT,
    published INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS saved_searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    name TEXT,
    filters TEXT,
    alertEnabled INTEGER DEFAULT 0,
    lastAlertAt TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS page_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    propertyId INTEGER,
    page TEXT,
    referrer TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    propertyId INTEGER NOT NULL,
    price REAL NOT NULL,
    date TEXT NOT NULL,
    note TEXT
  )`);
  db.run("CREATE INDEX IF NOT EXISTS idx_price_history_property ON price_history (propertyId)");

  const historyCount = db.exec("SELECT COUNT(*) as c FROM price_history");
  if (historyCount.length === 0 || historyCount[0].values[0][0] === 0) {
    const props = db.exec("SELECT id, price, createdAt FROM properties");
    if (props.length > 0 && props[0].values.length > 0) {
      const rows = props[0].values;
      const baseDate = new Date('2025-01-01');
      for (const r of rows) {
        const pid = r[0];
        const price = parseFloat(r[1]) || 0;
        if (!pid || price <= 0) continue;
        const fmt = (d) => d.toISOString().slice(0, 10);
        const monthsAgo = (m) => { const d = new Date(baseDate); d.setMonth(d.getMonth() + m); return fmt(d); };
        db.run("INSERT INTO price_history (propertyId, price, date, note) VALUES (?, ?, ?, ?)", [pid, Math.round(price * 0.82), monthsAgo(18), 'Listed']);
        db.run("INSERT INTO price_history (propertyId, price, date, note) VALUES (?, ?, ?, ?)", [pid, Math.round(price * 0.92), monthsAgo(8), 'Price adjustment']);
        db.run("INSERT INTO price_history (propertyId, price, date, note) VALUES (?, ?, ?, ?)", [pid, price, fmt(new Date()), 'Current listing price']);
      }
    }
  }

  db.run(`CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    propertyId INTEGER,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run("CREATE INDEX IF NOT EXISTS idx_properties_status ON properties (status)");
  db.run("CREATE INDEX IF NOT EXISTS idx_properties_type ON properties (type)");
  db.run("CREATE INDEX IF NOT EXISTS idx_properties_price ON properties (price)");
  db.run("CREATE INDEX IF NOT EXISTS idx_properties_city ON properties (city)");
  db.run("CREATE INDEX IF NOT EXISTS idx_properties_isPrivate ON properties (isPrivate)");
  db.run("CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status)");
  db.run("CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email)");
  db.run("CREATE INDEX IF NOT EXISTS idx_offers_property ON offers (propertyId)");
  db.run("CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites (userId)");
  db.run("CREATE INDEX IF NOT EXISTS idx_page_views_property ON page_views (propertyId)");

  db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    userName TEXT,
    message TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  await seedData();
  seedAgents();
  saveDb();
  return db;
}

function seedAgents() {
  const existing = db.exec("SELECT COUNT(*) as count FROM agents");
  if (existing[0] && existing[0].values[0][0] > 0) return;

  const agents = [
    { name: 'Sarah Johnson', email: 'sarah@dreamhomes.com', phone: '(310) 555-0123', title: 'Broker Associate · Luxury Waterfront', bio: 'A 15-year veteran of the California luxury market, Sarah has closed over $250M in sales. Her white-glove service and deep knowledge of Malibu and the coast have made her the trusted advisor to executives, athletes and entrepreneurs seeking exceptional oceanfront estates.', specialties: 'Waterfront, Estates, Off-Market', experience: '15+ years', sales: '$250M+ in sales', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=faces' },
    { name: 'Michael Chen', email: 'michael@dreamhomes.com', phone: '(213) 555-0456', title: 'Senior Advisor · Downtown & Urban Living', bio: 'Michael is a specialist in high-rise condominiums and urban living. From penthouse penthouses to developer previews, he guides clients through the downtown landscape with precision and discretion.', specialties: 'Penthouses, Condos, New Developments', experience: '10+ years', sales: '$120M+ in sales', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces' },
    { name: 'Emily Rodriguez', email: 'emily@dreamhomes.com', phone: '(626) 555-0789', title: 'Marketing & Staging Director', bio: 'Emily combines editorial staging with data-driven marketing to maximize exposure for every listing. Her homes average 3x the market time premium and routinely sell above asking.', specialties: 'Marketing, Staging, First-Time Buyers', experience: '8+ years', sales: '$80M+ in sales', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=faces' },
    { name: 'David Park', email: 'david@dreamhomes.com', phone: '(310) 555-0100', title: 'Luxury Advisor · Skyline & Penthouse', bio: 'David represents the upper echelon of Beverly Hills living. Known for quietly marketing ultra-high-net-worth properties, he has negotiated some of the most significant penthouse transactions on the Westside.', specialties: 'Penthouse, Skyline Views, UHNW', experience: '12+ years', sales: '$300M+ in sales', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces' },
    { name: 'Jessica Williams', email: 'jessica@dreamhomes.com', phone: '(818) 555-0456', title: 'Advisor · Family Communities', bio: 'Jessica helps families find the perfect place to call home, with a focus on top school districts and family-friendly neighborhoods across the San Gabriel Valley.', specialties: 'Family Homes, Schools, Relocation', experience: '9+ years', sales: '$95M+ in sales', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=faces' },
    { name: 'Amanda Foster', email: 'amanda@dreamhomes.com', phone: '(310) 555-0222', title: 'Advisor · Beachfront & Coastal', bio: 'Amanda lives and breathes coastal living. From beachfront condos to ocean-view retreats, she connects buyers with the relaxed, resort-style lifestyle of the Santa Monica coastline.', specialties: 'Beachfront, Coastal Living, Condos', experience: '6+ years', sales: '$60M+ in sales', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=faces' },
    { name: 'Olivia Bennett', email: 'olivia@dreamhomes.com', phone: '(310) 555-0310', title: 'International Services Director', bio: 'Olivia leads our international division, serving cross-border buyers and investors with multilingual support, currency guidance and a global network of trusted partners.', specialties: 'International, Investments, Relocation', experience: '11+ years', sales: '$180M+ in sales', photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=faces' },
    { name: 'Thomas Carter', email: 'thomas@dreamhomes.com', phone: '(213) 555-0888', title: 'Investment & 1031 Exchange Advisor', bio: 'Thomas specializes in income-producing properties and 1031 exchanges, helping investors build and preserve wealth through strategic real estate acquisitions.', specialties: 'Investments, 1031 Exchange, Portfolio', experience: '14+ years', sales: '$220M+ in sales', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=faces' },
  ];

  agents.forEach(a => {
    db.run("INSERT INTO agents (name, email, phone, title, bio, photo, specialties, experience, sales, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)",
      [a.name, a.email, a.phone, a.title, a.bio, a.photo, a.specialties, a.experience, a.sales]);
  });
}

async function seedData() {
  const existingUsers = db.exec("SELECT COUNT(*) as count FROM users");
  const count = existingUsers[0] && existingUsers[0].values[0][0] > 0;

  if (!count) {
    const adminHash = bcrypt.hashSync('admin123', 10);
    const userHash = bcrypt.hashSync('user123', 10);

    db.run("INSERT INTO users (name, email, password, isAdmin) VALUES (?, ?, ?, ?)", ['Admin', 'admin@dreamhomes.com', adminHash, 1]);
    db.run("INSERT INTO users (name, email, password, isAdmin) VALUES (?, ?, ?, ?)", ['Demo User', 'user@dreamhomes.com', userHash, 0]);

    const properties = [
      {
        title: 'Luxury Villa with Ocean View',
        address: '123 Ocean Drive',
        city: 'Malibu',
        state: 'CA',
        zip: '90265',
        country: 'US',
        price: 1200000,
        beds: 4,
        baths: 3,
        sqft: 3200,
        type: 'Villa',
        status: 'For Sale',
        yearBuilt: 2020,
        description: 'Stunning luxury villa with breathtaking ocean views, modern amenities, and a private pool. This magnificent property features floor-to-ceiling windows, a gourmet kitchen, and a spacious master suite.',
        agent: 'Sarah Johnson',
        agentPhone: '(310) 555-0123',
        agentEmail: 'sarah@dreamhomes.com',
        tags: 'ocean view,luxury,pool,villa',
        image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
        images: JSON.stringify(['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200']),
        video: 'https://www.youtube.com/embed/0S8DXqXbmK0',
        badge: 'Premium',
        featured: 1,
        latitude: 34.0259,
        longitude: -118.7798,
        lotSize: 0.75, hoa: 350, propertyTaxes: 14400, garage: 3, stories: 2, cooling: 'Central AC', heating: 'Forced Air', parking: 'Garage - Attached', roof: 'Tile', viewType: 'Ocean', basement: 'Finished',
        amenities: JSON.stringify(['Pool', 'Ocean View', 'Smart Home', 'Home Theater', 'Gourmet Kitchen', 'Guest House']),
        floorPlans: JSON.stringify(['https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200']),
        availability: 'Available Now',
        retail: null
      },
      {
        title: 'Modern Downtown Apartment',
        address: '456 Main Street, Unit 12B',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90012',
        country: 'US',
        price: 450000,
        beds: 2,
        baths: 2,
        sqft: 1100,
        type: 'Apartment',
        status: 'For Sale',
        yearBuilt: 2022,
        description: 'Sleek modern apartment in the heart of downtown with stunning city views. Features an open floor plan, high-end finishes, and smart home technology throughout.',
        agent: 'Michael Chen',
        agentPhone: '(213) 555-0456',
        agentEmail: 'michael@dreamhomes.com',
        tags: 'modern,downtown,city view,apartment',
        image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        images: JSON.stringify(['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200', 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1200']),
        video: 'https://www.youtube.com/embed/Y2GpSlYGUjM',
        badge: 'New',
        featured: 1,
        latitude: 34.0522,
        longitude: -118.2437,
        lotSize: null, hoa: 450, propertyTaxes: 5400, garage: 1, stories: 1, cooling: 'Central AC', heating: 'Electric', parking: 'Underground Garage', roof: 'Flat', viewType: 'City', basement: null,
        amenities: JSON.stringify(['Gym', 'Concierge', 'Rooftop Deck', 'Smart Home', 'Security', 'Bike Storage']),
        floorPlans: JSON.stringify(['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200']),
        availability: 'Available Now',
        retail: null
      },
      {
        title: 'Cozy Cottage in the Hills',
        address: '789 Maple Lane',
        city: 'Pasadena',
        state: 'CA',
        zip: '91101',
        country: 'US',
        price: 275000,
        beds: 2,
        baths: 1,
        sqft: 850,
        type: 'Cottage',
        status: 'For Sale',
        yearBuilt: 1965,
        description: 'Charming cottage nestled in the peaceful hills of Pasadena with a beautiful garden. Perfect starter home with original hardwood floors and a cozy fireplace.',
        agent: 'Emily Rodriguez',
        agentPhone: '(626) 555-0789',
        agentEmail: 'emily@dreamhomes.com',
        tags: 'cozy,garden,hills,starter home',
        image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800',
        images: JSON.stringify(['https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200']),
        video: 'https://www.youtube.com/embed/3cwACz0Cdgs',
        badge: 'Hot Deal',
        featured: 0,
        latitude: 34.1478,
        longitude: -118.1445,
        lotSize: 0.25, hoa: null, propertyTaxes: 3300, garage: 1, stories: 1, cooling: 'Window Unit', heating: 'Radiator', parking: 'Driveway', roof: 'Shingle', viewType: 'Mountain', basement: 'Partial',
        amenities: JSON.stringify(['Garden', 'Fireplace', 'Hardwood Floors', 'Detached Garage']),
        floorPlans: JSON.stringify(['https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200']),
        availability: 'Available Now',
        retail: null
      },
      {
        title: 'Penthouse Suite with City Panorama',
        address: '100 Skyline Tower, PH1',
        city: 'Beverly Hills',
        state: 'CA',
        zip: '90210',
        country: 'US',
        price: 2800000,
        beds: 3,
        baths: 3,
        sqft: 4500,
        type: 'Penthouse',
        status: 'For Sale',
        yearBuilt: 2023,
        description: 'Exclusive penthouse suite with panoramic city views from every room. Features a private rooftop terrace, wine cellar, and home theater. Unparalleled luxury living.',
        agent: 'David Park',
        agentPhone: '(310) 555-0100',
        agentEmail: 'david@dreamhomes.com',
        tags: 'penthouse,luxury,city view,exclusive',
        image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
        images: JSON.stringify(['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200', 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200']),
        video: 'https://www.youtube.com/embed/NeuhTZ-YqCQ',
        badge: 'Exclusive',
        featured: 1,
        latitude: 34.0736,
        longitude: -118.4004,
        lotSize: null, hoa: 1200, propertyTaxes: 33600, garage: 2, stories: 1, cooling: 'Central AC', heating: 'Radiant', parking: 'Valet Garage', roof: 'Flat', viewType: 'Panoramic City', basement: null,
        amenities: JSON.stringify(['Rooftop Terrace', 'Wine Cellar', 'Home Theater', 'Concierge', 'Private Elevator']),
        floorPlans: JSON.stringify(['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200', 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200']),
        availability: 'Available Now',
        retail: null
      },
      {
        title: 'Suburban Family Home',
        address: '456 Oak Avenue',
        city: 'Glendale',
        state: 'CA',
        zip: '91204',
        country: 'US',
        price: 620000,
        beds: 4,
        baths: 2,
        sqft: 2200,
        type: 'House',
        status: 'For Sale',
        yearBuilt: 1998,
        description: 'Spacious family home in a quiet suburban neighborhood with excellent schools nearby. Features a large backyard, updated kitchen, and two-car garage.',
        agent: 'Jessica Williams',
        agentPhone: '(818) 555-0456',
        agentEmail: 'jessica@dreamhomes.com',
        tags: 'family,suburban,schools,backyard',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
        images: JSON.stringify(['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200', 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200', 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200']),
        video: 'https://www.youtube.com/embed/5NEC9NLBZqk',
        badge: 'Family Favorite',
        featured: 0,
        latitude: 34.1425,
        longitude: -118.2551,
        lotSize: 0.35, hoa: 80, propertyTaxes: 7440, garage: 2, stories: 2, cooling: 'Central AC', heating: 'Forced Air', parking: 'Garage - Attached', roof: 'Composition', viewType: 'Neighborhood', basement: 'Unfinished',
        amenities: JSON.stringify(['Backyard', 'Updated Kitchen', 'Two-Car Garage', 'Family Room']),
        floorPlans: JSON.stringify(['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200']),
        availability: 'Available Now',
        retail: null
      },
      {
        title: 'Beachfront Condo with Direct Beach Access',
        address: '222 Pacific Coast Highway',
        city: 'Santa Monica',
        state: 'CA',
        zip: '90401',
        country: 'US',
        price: 385000,
        beds: 1,
        baths: 1,
        sqft: 720,
        type: 'Condo',
        status: 'For Sale',
        yearBuilt: 2019,
        description: 'Wake up to the sound of waves in this stunning beachfront condo. Direct beach access, resort-style amenities, and the best of coastal living right at your doorstep.',
        agent: 'Amanda Foster',
        agentPhone: '(310) 555-0222',
        agentEmail: 'amanda@dreamhomes.com',
        tags: 'beachfront,condo,coastal,resort',
        image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
        images: JSON.stringify(['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200']),
        video: 'https://www.youtube.com/embed/wOb_LtY95HI',
        badge: 'Beach Life',
        featured: 0,
        latitude: 34.0195,
        longitude: -118.4912,
        lotSize: null, hoa: 600, propertyTaxes: 4620, garage: 1, stories: 1, cooling: 'Central AC', heating: 'Electric', parking: 'Gated Community', roof: 'Flat', viewType: 'Ocean', basement: null,
        amenities: JSON.stringify(['Beach Access', 'Resort Pool', 'Gym', 'Doorman', 'Elevator']),
        floorPlans: JSON.stringify(['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200']),
        availability: 'Available Now',
        retail: null
      },
      {
        title: 'Retail Storefront on Main Street',
        address: '3100 Main Street, Suite A',
        city: 'Santa Monica',
        state: 'CA',
        zip: '90405',
        country: 'US',
        price: 950000,
        beds: 0,
        baths: 2,
        sqft: 2400,
        type: 'Retail',
        status: 'For Sale',
        yearBuilt: 2016,
        description: 'Prime retail storefront in a high-traffic commercial corridor. Frontage on Main Street with large display windows, storage room, and excellent visibility. Ideal for a boutique, cafe, or showroom.',
        agent: 'Thomas Carter',
        agentPhone: '(213) 555-0888',
        agentEmail: 'thomas@dreamhomes.com',
        tags: 'retail,storefront,commercial,prime location',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
        images: JSON.stringify(['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200', 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200']),
        video: null,
        badge: 'Premium',
        featured: 0,
        latitude: 34.0183,
        longitude: -118.4681,
        lotSize: null, hoa: null, propertyTaxes: 11400, garage: null, stories: 1, cooling: 'Central AC', heating: 'Forced Air', parking: 'Street Parking', roof: 'Flat', viewType: 'Street', basement: null,
        amenities: JSON.stringify(['Storefront', 'Display Windows', 'Storage Room', 'High Foot Traffic']),
        floorPlans: JSON.stringify(['https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200']),
        availability: 'Available Now',
        retail: 'Storefront · 2,400 sqft · 40 ft frontage'
      }
    ];

    properties.forEach(p => {
      db.run(`INSERT INTO properties (title, address, city, state, zip, country, price, beds, baths, sqft, type, status, yearBuilt, description, agent, agentPhone, agentEmail, tags, image, images, video, badge, featured, latitude, longitude, lotSize, hoa, propertyTaxes, garage, stories, cooling, heating, parking, roof, viewType, basement, amenities, floorPlans, availability, retail)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.title, p.address, p.city, p.state, p.zip, p.country || 'US', p.price, p.beds, p.baths, p.sqft, p.type, p.status, p.yearBuilt, p.description, p.agent, p.agentPhone, p.agentEmail, p.tags, p.image, p.images, p.video, p.badge, p.featured, p.latitude, p.longitude,
         p.lotSize || null, p.hoa || null, p.propertyTaxes || null, p.garage || null, p.stories || null, p.cooling || null, p.heating || null, p.parking || null, p.roof || null, p.viewType || null, p.basement || null,
         p.amenities || null, p.floorPlans || null, p.availability || null, p.retail || null]);
    });

    const sponsors = [
      { name: 'National Bank', logo: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=200', website: 'https://nationalbank.com', description: 'Trusted banking partner for home mortgages and financing solutions.', tier: 'gold' },
      { name: 'HomeShield Insurance', logo: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=200', website: 'https://homeshield.com', description: 'Comprehensive home insurance coverage to protect your investment.', tier: 'silver' },
      { name: 'EcoGreen Solar', logo: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=200', website: 'https://ecogreensolar.com', description: 'Sustainable solar energy solutions for modern eco-friendly homes.', tier: 'bronze' }
    ];

    sponsors.forEach(s => {
      db.run("INSERT INTO sponsors (name, logo, website, description, tier) VALUES (?, ?, ?, ?, ?)", [s.name, s.logo, s.website, s.description, s.tier]);
    });

    const ads = [
      { title: 'Mortgage Rates Starting at 4.5%', description: 'Get pre-approved today and lock in the lowest rates. Trusted by thousands of homebuyers.', image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800', link: '/financing' },
      { title: 'Free Home Valuation', description: 'Curious what your home is worth? Get a free instant valuation from our expert agents.', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800', link: '/valuation' },
      { title: 'Moving Day Special - 20% Off', description: 'Partner with TopMove Movers for a stress-free relocation. Use code DREAMHOMES20.', image: 'https://images.unsplash.com/photo-1600517806299-e3e0ee53c5d6?w=800', link: '/moving' }
    ];

    ads.forEach(a => {
      db.run("INSERT INTO ads (title, description, image, link) VALUES (?, ?, ?, ?)", [a.title, a.description, a.image, a.link]);
    });

    const testimonialsData = [
      { name: 'John & Lisa Thompson', role: 'Home Buyers', content: 'Dream Homes made our first home purchase an absolute joy. Their team guided us through every step and found us the perfect home for our family.', rating: 5, active: 1 },
      { name: 'Robert Chen', role: 'Property Investor', content: 'I\'ve worked with many real estate agencies, but Dream Homes stands out for their professionalism and market knowledge. Highly recommended.', rating: 5, active: 1 },
      { name: 'Maria Garcia', role: 'Home Seller', content: 'Our home sold in just 2 weeks thanks to Dream Homes\' exceptional marketing strategy. They got us well above asking price!', rating: 5, active: 1 },
    ];
    testimonialsData.forEach(t => {
      db.run("INSERT INTO testimonials (name, role, content, rating, active) VALUES (?, ?, ?, ?, ?)", [t.name, t.role, t.content, t.rating, t.active]);
    });

    const blogData = [
      { title: '10 Tips for First-Time Home Buyers', slug: 'tips-for-first-time-home-buyers', content: '<p>Buying your first home is an exciting journey. Here are 10 essential tips to help you navigate the process...</p><h3>1. Start Saving Early</h3><p>A down payment is one of the biggest hurdles for first-time buyers. Start saving as early as possible...</p><h3>2. Check Your Credit Score</h3><p>Your credit score plays a crucial role in determining your mortgage rate...</p><h3>3. Get Pre-Approved</h3><p>Before you start house hunting, get pre-approved for a mortgage...</p>', excerpt: 'Essential advice for navigating the home buying process with confidence.', author: 'Sarah Johnson', tags: JSON.stringify(['buying','first-time','tips']), published: 1 },
      { title: 'The Ultimate Guide to Home Staging', slug: 'ultimate-guide-home-staging', content: '<p>Home staging can significantly increase your property\'s appeal and sale price. Here\'s everything you need to know...</p><h3>Why Stage Your Home?</h3><p>Staged homes sell 73% faster on average and for up to 10% more...</p><h3>Living Room Tips</h3><p>Create a warm, inviting atmosphere with neutral colors and strategic furniture placement...</p>', excerpt: 'Learn how to make your property irresistible to potential buyers.', author: 'Emily Rodriguez', tags: JSON.stringify(['staging','selling','home improvement']), published: 1 },
      { title: 'Understanding Mortgage Rates in 2026', slug: 'understanding-mortgage-rates-2026', content: '<p>Mortgage rates continue to shape the real estate market. Here\'s what you need to know about current trends...</p><h3>Current Rate Environment</h3><p>As of 2026, mortgage rates have seen significant shifts...</p><h3>Fixed vs Adjustable</h3><p>Understanding the difference between fixed-rate and adjustable-rate mortgages is crucial...</p>', excerpt: 'A comprehensive look at current mortgage trends and what they mean for buyers.', author: 'Michael Chen', tags: JSON.stringify(['mortgage','rates','finance']), published: 1 },
    ];
    blogData.forEach(b => {
      db.run("INSERT INTO blog_posts (title, slug, content, excerpt, author, tags, published) VALUES (?, ?, ?, ?, ?, ?, ?)", [b.title, b.slug, b.content, b.excerpt, b.author, b.tags, b.published]);
    });
  }
}

function saveDb() {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    const tmpPath = `${DB_PATH}.tmp`;
    fs.writeFileSync(tmpPath, buffer);
    fs.renameSync(tmpPath, DB_PATH);
  } catch (err) {
    console.warn('saveDb: could not persist database:', err.message);
  }
}

export async function getDb() {
  if (!db) {
    await initializeDatabase();
  }
  return db;
}

export { saveDb };

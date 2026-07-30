import initSqlJs from 'sql.js';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'dreamhomes.db');
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

  try { db.run("ALTER TABLE properties ADD COLUMN video TEXT"); } catch (e) { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN country TEXT DEFAULT 'US'"); } catch (e) { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN lotSize REAL"); } catch (e) { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN hoa REAL"); } catch (e) { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN propertyTaxes REAL"); } catch (e) { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN garage INTEGER"); } catch (e) { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN stories INTEGER"); } catch (e) { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN cooling TEXT"); } catch (e) { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN heating TEXT"); } catch (e) { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN parking TEXT"); } catch (e) { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN roof TEXT"); } catch (e) { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN viewType TEXT"); } catch (e) { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN basement TEXT"); } catch (e) { /* already exists */ }
  try { db.run("ALTER TABLE properties ADD COLUMN status TEXT DEFAULT 'For Sale'"); } catch (e) { /* already exists */ }

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
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS page_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    propertyId INTEGER,
    page TEXT,
    referrer TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    propertyId INTEGER,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    userName TEXT,
    message TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  await seedData();
  saveDb();
  return db;
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
        lotSize: 0.75, hoa: 350, propertyTaxes: 14400, garage: 3, stories: 2, cooling: 'Central AC', heating: 'Forced Air', parking: 'Garage - Attached', roof: 'Tile', viewType: 'Ocean', basement: 'Finished'
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
        lotSize: null, hoa: 450, propertyTaxes: 5400, garage: 1, stories: 1, cooling: 'Central AC', heating: 'Electric', parking: 'Underground Garage', roof: 'Flat', viewType: 'City', basement: null
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
        lotSize: 0.25, hoa: null, propertyTaxes: 3300, garage: 1, stories: 1, cooling: 'Window Unit', heating: 'Radiator', parking: 'Driveway', roof: 'Shingle', viewType: 'Mountain', basement: 'Partial'
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
        lotSize: null, hoa: 1200, propertyTaxes: 33600, garage: 2, stories: 1, cooling: 'Central AC', heating: 'Radiant', parking: 'Valet Garage', roof: 'Flat', viewType: 'Panoramic City', basement: null
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
        lotSize: 0.35, hoa: 80, propertyTaxes: 7440, garage: 2, stories: 2, cooling: 'Central AC', heating: 'Forced Air', parking: 'Garage - Attached', roof: 'Composition', viewType: 'Neighborhood', basement: 'Unfinished'
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
        lotSize: null, hoa: 600, propertyTaxes: 4620, garage: 1, stories: 1, cooling: 'Central AC', heating: 'Electric', parking: 'Gated Community', roof: 'Flat', viewType: 'Ocean', basement: null
      }
    ];

    properties.forEach(p => {
      db.run(`INSERT INTO properties (title, address, city, state, zip, country, price, beds, baths, sqft, type, status, yearBuilt, description, agent, agentPhone, agentEmail, tags, image, images, video, badge, featured, latitude, longitude, lotSize, hoa, propertyTaxes, garage, stories, cooling, heating, parking, roof, viewType, basement)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.title, p.address, p.city, p.state, p.zip, p.country || 'US', p.price, p.beds, p.baths, p.sqft, p.type, p.status, p.yearBuilt, p.description, p.agent, p.agentPhone, p.agentEmail, p.tags, p.image, p.images, p.video, p.badge, p.featured, p.latitude, p.longitude,
         p.lotSize || null, p.hoa || null, p.propertyTaxes || null, p.garage || null, p.stories || null, p.cooling || null, p.heating || null, p.parking || null, p.roof || null, p.viewType || null, p.basement || null]);
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
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

export async function getDb() {
  if (!db) {
    await initializeDatabase();
  }
  return db;
}

export { saveDb };

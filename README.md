# Dream Homes

A full-stack real-estate platform built with React, Express, and SQLite. Users can browse properties, schedule tours, make offers, and communicate with agents via a built-in live chat. Admins manage listings, leads, users, notifications, and analytics from a dedicated dashboard.

## Features

- **Property listings** with map view, search/filter, mortgage calculator, and virtual tour scheduling
- **User accounts** with JWT authentication, profile management, and saved-property collections
- **Agent dashboard** for managing bookings, offers, open houses, leads, and contacts
- **Admin panel** with analytics, user management, notifications, CSV import/export, and newsletter tools
- **Live chat** with real-time messaging (Socket.IO) and WhatsApp/Call integration
- **PWA support** with service worker, offline-ready install prompt, and top banner ad system
- **PDF generation** for custom property packages (jsPDF + html2canvas)

## Tech Stack

| Layer | Tools |
|---|---|
| Frontend | React 19, React Router 8, Vite 8, TanStack Query, Leaflet |
| Backend | Express 5, Socket.IO, JWT, bcryptjs, multer, nodemailer |
| Database | SQLite via sql.js (local) / PostgreSQL (Render deploy) |
| Deploy | Netlify (frontend + serverless functions), Render (backend) |

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Local Development

```bash
git clone https://github.com/Skybluelang79/Real-Estate.git
cd Real-Estate
npm install
```

Create a `.env` file in the project root (see `.env.example`):

```env
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5177
PORT=3006
```

Start the full stack (frontend + backend) in one command:

```bash
npm run dev
```

- **Frontend:** http://localhost:5177
- **API server:** http://localhost:3006

To run only the frontend or only the backend:

```bash
npm run dev:front    # Vite dev server only
npm run dev:server   # Express API only
```

### Default Accounts

| Email | Password | Role |
|---|---|---|
| admin@dreamhomes.com | admin123 | Admin |

New user accounts are created via the **Sign Up** page.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start frontend + backend together |
| `npm run dev:front` | Start Vite dev server only |
| `npm run dev:server` | Start Express API only |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run oxlint |
| `npm run test` | Run test suite (vitest) |
| `npm run test:watch` | Run tests in watch mode |

## Project Structure

```
Real-Estate/
  src/
    api/            # React Query data-fetching hooks
    components/     # Reusable UI (Header, Footer, ChatWidget, admin panels…)
    context/        # Auth, Theme, Language, Compare contexts
    hooks/          # Custom hooks (usePageTitle, useDebounce…)
    pages/          # Route pages (Home, Properties, SignIn, Admin…)
    utils/          # Formatters, mortgage helpers, geo utils
  server/
    index.js        # Express API + Socket.IO server
    db.js           # SQLite persistence (sql.js + file fallback)
  netlify/
    functions/      # Serverless wrapper for Netlify deploy
  public/           # Static assets, manifest, service worker
```

## License

Private — all rights reserved.

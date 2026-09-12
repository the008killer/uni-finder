# UniFinder - German University Course Discovery

A full-stack web platform helping international students search, filter, and discuss Bachelor and Master programs across 390+ universities in Germany.

**Live Application:** [https://adhikariashwin0.com.np/unifinder/](https://adhikariashwin0.com.np/unifinder/)
---

## Features

- **Smart Course Search & Filtering**
  - Instant full-text search with 400ms debouncing across courses, universities, cities, and subjects.
  - Broad filter sidebar: Degree (`Bachelor`, `Master`), Language (`English`, `German`, `Mixed`), University Type (`Public`, `Private`, `Church`), Subject Area, and Max Tuition Fee.
  - Shimmer skeleton loaders and layout-shift prevention.

- **Real Academic Data (DE Region)**
  - 388+ German universities (official HRK / Destatis registry)
  - 1,500+ study programs with tuition fees, duration, semester start, and language proficiency levels (A1–C2).
  - Dynamic university logos with monogram avatar fallbacks.

- **Real-Time Peer Chat Rooms (Socket.io)**
  - Course-specific chat rooms automatically generated for every program.
  - 4 discussion sections: `#General`, `#Admissions`, `#Courses & Studies`, and `#Student Life`.
  - Floating WhatsApp-style date separators and localized 24h timestamps.
  - Join/Leave groups and direct group navigation.

- **Authentication & Security**
  - JWT token authentication with **Email OR Username** login.
  - Password strength validation meter (min 8 chars, uppercase, lowercase, number, symbol).
  - Native RFC 6238 **Two-Factor Authentication (2FA)** with QR code scanner (Google Authenticator / Authy compatible, zero external auth libraries).
  - Password reset delivery via HTTPS API.
  - API rate-limiting on sensitive auth routes.

- **Bookmarks & Real-Time Notifications**
  - One-click quick bookmarking directly from search cards and detail views.
  - Real-time in-app notification bell for chat messages and `@mention` alerts.
  - User profile management with avatar customization and tab routing.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, React Router (HashRouter), Axios, Socket.io-client |
| **Backend** | Node.js, Express.js, Socket.io, JWT, bcryptjs, native `crypto` (TOTP engine) |
| **Database** | PostgreSQL (Neon Serverless) with indexed query architecture |
| **Mailing** | Resend HTTPS API (Port 443 cloud-compatible) |
| **Hosting** | GitHub Pages (Frontend), Render (Backend), Neon (Database) |

---

## Project Structure

```text
uni-finder/
├── client/                     # React Frontend (Vite)
│   ├── src/
│   │   ├── components/         # Layout, Navbar, Icons, Skeletons, UserAvatar
│   │   ├── context/            # AuthContext (Global Session & State)
│   │   ├── hooks/              # useChat, useNotifications
│   │   ├── pages/              # Home, Search, ProgramDetail, UniDetail, Chat, Profile, Login...
│   │   ├── services/           # Axios API services
│   │   └── utils/              # Helpers, Date formatting, Password strength
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── config/             # Database (pg pool) & Mailer configuration
│   │   ├── controllers/        # Auth, Program, Uni, Chat, Bookmark, 2FA, Notification
│   │   ├── db/                 # Migrations & Data Seeders (Germany TSV + DAAD CSV + Austria)
│   │   ├── middleware/         # JWT Auth protection & Rate limiting
│   │   ├── routes/             # REST API Route declarations
│   │   └── socket/             # Socket.io real-time chat & notification events
│   ├── server.js               # Entry point & WebSocket server
│   └── package.json
└── README.md
```

## Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- A free cloud PostgreSQL database (e.g. Neon.tech)

### Clone the Repository
```bash
git clone https://github.com/the008killer/uni-finder.git
cd uni-finder
```

### Setup the Backend
```bash
cd server
npm install
```
Create a .env file in the server/ directory:

```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_super_secret_key
CLIENT_URL=http://localhost:5173
RESEND_API_KEY=your_resend_api_key_optional
```
Run database migrations and data seeders:

```Bash
# Run table migrations
node src/db/migrate.js

# Seed universities and study programs
node src/db/seeds/seedUniversities.js
node src/db/seeds/seedCourses.js
```
Start the backend server:

```Bash
npm run dev
```

### Setup the Frontend

Open a new terminal:

```Bash
cd client
npm install
npm run dev
```

Open http://localhost:5173 in your browser!

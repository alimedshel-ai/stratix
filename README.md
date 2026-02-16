# Stratix — Strategic Management Platform
> Rebuilt with Express.js, vanilla JavaScript, and Bootstrap 5 RTL | Schema restructured: Sector → Industry → Entity → Users

## ✅ Architecture & Features Completed

### 🏗️ Recent Restructuring
- **Previous:** Sector → Company → Entity → Department → Users  
- **Current:** Sector → Industry → Entity → Users (Simplified)
- All APIs updated, database migrated, demo data seeded

### 📊 Working APIs & Pages (14+ Modules)

| Module | API Endpoint | Page | Status |
|--------|------|------|--------|
| **Authentication** | `/api/auth` | `/login` | ✅ Working |
| **Sectors** | `/api/sectors` | `/sectors` | ✅ Complete |
| **Industries** | `/api/industries` | `/industries` | ✅ Complete |
| **Entities** | `/api/entities` | `/entities` | ✅ Complete |
| **Users** | `/api/users` | `/users` | ✅ Complete |
| **Assessments** | `/api/assessments` | `/assessments` | ✅ Complete |
| **Objectives** | `/api/strategic/objectives` | - | ✅ API Ready |
| **KPIs** | `/api/strategic/kpis` | `/kpis` | ✅ Complete |
| **Initiatives** | `/api/strategic/initiatives` | - | ✅ API Ready |
| **Reviews** | `/api/reviews/reviews` | - | ✅ API Ready |
| **Dashboard** | - | `/dashboard` | ✅ Updated |

### 🎯 Key Features Implemented

## Tech Stack

- **Server**: Express.js
- **Frontend**: HTML5 + Vanilla JavaScript + Bootstrap 5
- **Database**: SQLite + Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation

1. **Clone and navigate to the project:**
   ```bash
   cd /Users/ali/startix\ featires
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Initialize the database:**
   ```bash
   npx prisma db push
   ```

4. **Seed demo data:**
   ```bash
   node scripts/seed.js
   ```

## Running the Application

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Demo Credentials

After running the seed script, use these credentials to login:

- **Admin Account**
  - Email: `admin@stratix.com`
  - Password: `Admin123!`
  - Role: `SUPER_ADMIN`

- **User Account**
  - Email: `user@stratix.com`
  - Password: `User123!`
  - Role: `VIEWER`

## Project Structure

```
.
├── public/              # Static files & HTML pages
│   ├── login.html      # Login page
│   └── dashboard.html  # Main dashboard/welcome page
├── routes/             # API routes
│   └── auth.js         # Authentication routes
├── middleware/         # Custom middleware
│   └── auth.js         # JWT verification middleware
├── prisma/             # Database schema
│   └── schema.prisma   # Prisma data model
├── scripts/            # Utility scripts
│   └── seed.js         # Database seeding
├── server.js           # Main Express application
└── package.json        # Project dependencies
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user
- `GET /api/auth/profile` - Get current user profile (requires auth)

### Protected Routes
- `GET /api/user/profile` - Get authenticated user profile (requires JWT token)

## Authentication Flow

1. User visits `/login`
2. Enters credentials (or uses demo account)
3. Frontend sends credentials to `/api/auth/login`
4. Backend verifies credentials and returns JWT token
5. Frontend stores token in localStorage
6. User is redirected to `/dashboard`
7. Dashboard loads and verifies token
8. User profile is loaded from `/api/user/profile` endpoint

## Security Features

- ✅ Password hashing with bcryptjs
- ✅ JWT token-based authentication
- ✅ Token verification middleware
- ✅ CORS protection
- ✅ Environment variables for sensitive data
- ✅ Session persistence via localStorage

## Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-in-production"
PORT=3000
NODE_ENV="development"
```

## Next Steps

This initial implementation includes:
- ✅ Authentication system
- ✅ Login page with demo credentials
- ✅ Welcome dashboard
- ✅ User profile loading

Coming soon:
- Companies Management
- Sectors & Entities
- Assessments
- KPIs & Strategic Goals
- Alerts & Intelligence
- Reports & Analytics

## Development Notes

- The frontend uses pure HTML/CSS/JavaScript (no frameworks)
- Bootstrap 5 is used for styling and components
- All API communication uses Fetch API
- Tokens are stored in localStorage (client-side)
- Database uses SQLite for simplicity (can be upgraded to PostgreSQL)

## License

ISC

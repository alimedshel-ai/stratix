# Stratix Platform — Quick Reference Guide

## 🚀 Getting Started

### Start the Server
```bash
cd /Users/ali/startix\ featires
npm start
```
Server runs on `http://localhost:3000`

### Login to Platform
1. Visit `http://localhost:3000/login`
2. Use any demo credential:
   - **admin@stratix.com** → SUPER_ADMIN (full access)
   - **ceo@future.com** → ENTITY_ADMIN (entity-level access)
   - **strategy@future.com** → STRATEGY_MANAGER (strategy access)
   - **user@stratix.com** → VIEWER (read-only)
3. Password: `password` (same for all accounts)

---

## 📊 Main Modules

### 1. Organizations
- **Sectors** (`/sectors`) — Top-level classifications
- **Industries** (`/industries`) — Business sectors
- **Entities** (`/entities`) — Organizations/departments

### 2. People
- **Users** (`/users`) — User management with roles & entity assignment

### 3. Planning
- **Assessments** (`/assessments`) — Strategic assessment framework
- **Objectives** (API: `/api/strategic/objectives`) — Strategic goals
- **KPIs** (`/kpis`) — Performance indicators with tracking

### 4. Execution
- **Initiatives** (API: `/api/strategic/initiatives`) — Projects & initiatives
- **Reviews** (API: `/api/reviews/reviews`) — Progress reviews

---

## 📱 Available Pages

| Feature | URL | Notes |
|---------|-----|-------|
| Dashboard | `/dashboard` | Main navigation hub |
| Sectors | `/sectors` | Manage sectors |
| Industries | `/industries` | Manage industries |
| Entities | `/entities` | Manage organizations |
| Users | `/users` | Manage users & roles |
| Assessments | `/assessments` | Create assessments & dimensions |
| KPIs | `/kpis` | Track KPIs with progress |
| Settings | `/settings` | Placeholder (config) |

---

## 🔌 API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Authentication
```
POST /auth/login
{
  "email": "admin@stratix.com",
  "password": "password"
}

Response:
{
  "token": "eyJhbGc...",
  "user": { "id", "email", "name", "role" }
}
```

### Common Patterns
All management endpoints follow this pattern:

```
GET    /{module}              — List with pagination
GET    /{module}/:id          — Get single item
POST   /{module}              — Create new
PATCH  /{module}/:id          — Update
DELETE /{module}/:id          — Delete
```

### Available Modules
- `/sectors` — Sector management
- `/industries` — Industry management
- `/entities` — Entity management
- `/users` — User management
- `/assessments` — Assessment management
- `/strategic/objectives` — Strategic objectives
- `/strategic/kpis` — KPI management
- `/strategic/initiatives` — Initiative management
- `/reviews/reviews` — Review management

---

## 🔍 API Query Examples

### List with Pagination
```bash
curl http://localhost:3000/api/users?page=1&limit=10 \
  -H "Authorization: Bearer {token}"
```

### Search
```bash
curl http://localhost:3000/api/users?search=admin \
  -H "Authorization: Bearer {token}"
```

### Filter
```bash
curl http://localhost:3000/api/assessments?status=DRAFT \
  -H "Authorization: Bearer {token}"
```

### Get Single Item
```bash
curl http://localhost:3000/api/users/cmloezdxv001a10spc5ozsr1b \
  -H "Authorization: Bearer {token}"
```

### Create New
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "name": "New User",
    "password": "password123",
    "role": "VIEWER",
    "entityId": "cmloezdtz000610spy342m4fs"
  }'
```

### Update
```bash
curl -X PATCH http://localhost:3000/api/users/{id} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Updated Name" }'
```

### Delete
```bash
curl -X DELETE http://localhost:3000/api/users/{id} \
  -H "Authorization: Bearer {token}"
```

---

## 📊 Demo Data Overview

### Organizational Hierarchy
```
Private Sector
├── Technology Industry
│   └── Future Solutions Entity
│       ├── User 1: CEO (ENTITY_ADMIN)
│       ├── User 2: Strategy Mgr (STRATEGY_MANAGER)
│       ├── User 3: Admin (SUPER_ADMIN)
│       └── User 4: Viewer (VIEWER)
└── Manufacturing Industry
    └── Horizon Factory Entity
        └── (No users assigned)
```

### Strategic Plan Data (Future Solutions)
```
Strategy Version: "2026 Strategic Plan"
├── Objective 1: "Improve product quality"
│   ├── KPI 1: Bug Resolution Rate (92/95%)
│   └── KPI 2: Customer Satisfaction (85/90%)
└── Objective 2: "Increase market share by 25%"
    └── KPI 3: Revenue Growth (750k/$1M)
```

### Assessment Data
```
Assessment: "Engineering Capability Assessment"
└── Dimension: "Code Quality"
    └── Criteria: (scorable items)
```

---

## 🛠️ Common Tasks

### Create New User
1. Go to `/users`
2. Click "مستخدم جديد" (New User)
3. Fill form:
   - Name (Arabic + English)
   - Email
   - Password
   - Role (dropdown)
   - Entity (select from list)
4. Click "حفظ" (Save)

### Create New KPI
1. Go to `/kpis`
2. Click "مؤشر جديد" (New KPI)
3. Fill form:
   - Name (English)
   - Name (Arabic)
   - Strategic Version/Plan
   - Objective (optional)
   - Target value
   - Unit (%, $, etc.)
   - Status
4. Click "حفظ" (Save)

### Create Assessment
1. Go to `/assessments`
2. Click "تقييم جديد" (New Assessment)
3. Fill: Title, Description, Entity, Status
4. Click "حفظ" (Save)
5. In Details view, click "بعد جديد" (New Dimension)
6. Add dimension with criteria

### Update KPI Actual Value
1. Go to `/kpis`
2. Click edit button on KPI card
3. Fill "القيمة الفعلية" (Actual Value)
4. Update status if needed
5. Click "حفظ" (Save)

---

## 🔐 Role Permissions

| Action | SUPER_ADMIN | ENTITY_ADMIN | STRATEGY_MANAGER | VIEWER |
|--------|:-:|:-:|:-:|:-:|
| View All Data | ✅ | ✅ | ✅ | ✅ |
| Create Items | ✅ | ✅ | ✅ | ❌ |
| Edit Items | ✅ | ✅ | ✅ | ❌ |
| Delete Items | ✅ | ✅ | ✅ | ❌ |
| Manage Users | ✅ | ✅ | ❌ | ❌ |
| Manage Industries | ✅ | ❌ | ❌ | ❌ |

---

## 🐛 Troubleshooting

### Server Won't Start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill existing process
killall node

# Start fresh
npm start
```

### Database Issues
```bash
# Reset database
rm prisma/dev.db

# Reinitialize
npx prisma db push

# Reseed data
node scripts/seed.js
```

### Login Problems
- Verify email matches demo accounts
- Check password (use "password")
- Clear browser cache
- Try incognito mode

### API Errors
- Verify Authorization header: `Bearer {token}`
- Check request format (POST needs Content-Type: application/json)
- Verify all required fields are provided
- Check HTTP status codes in response

---

## 📚 File Locations

- **Server Config:** `/Users/ali/startix featires/server.js`
- **Database Schema:** `/Users/ali/startix featires/prisma/schema.prisma`
- **Routes:** `/Users/ali/startix featires/routes/`
- **Pages:** `/Users/ali/startix featires/public/`
- **Database File:** `/Users/ali/startix featires/prisma/dev.db`
- **Demo Data:** `/Users/ali/startix featires/scripts/seed.js`

---

## 🚀 Performance Tips

- **Pagination:** Always use `?limit=10` to avoid large responses
- **Filtering:** Use specific filters to reduce data
- **Search:** Use `?search=term` instead of fetching all
- **Relationships:** API includes related data only when needed
- **Browser:** Clear cache if seeing old data

---

## 📞 Support

**Documentation Files:**
- `README.md` — Complete feature documentation
- `SESSION_SUMMARY.md` — Detailed implementation report
- `FEATURES_COMPLETE.txt` — Feature checklist
- This file — Quick reference

**Server Logs:**
- Check terminal where `npm start` is running
- Look for error messages with [ERROR] prefix

**Testing:**
- Use curl/Postman for API testing
- Check browser DevTools for frontend issues
- Verify authentication token is valid

---

**Version:** 1.0.0  
**Platform:** Stratix Strategic Management  
**Status:** ✅ Production Ready  
**Last Updated:** February 16, 2026

# PeakGuide — Backend API

This is the **Node.js + Express REST API** for the PeakGuide application.

The API serves mountain peaks, ranges, authentication, admin features, and public contact messages.

It is designed as a **clean, scalable backend architecture** suitable for real-world production applications.

---

## 🌍 Live API

Base URL:

- https://peakguide-api.onrender.com

# Health check:

- [GET /api/health](https://peakguide-api.onrender.com/api/health)

---

## 🎯 Backend Goals

The API was built to demonstrate:

- Clean REST architecture
- Secure JWT authentication (cookie-based)
- Role-based authorization (admin / user)
- Structured routing and middleware layers
- PostgreSQL integration
- Safe test environment separation
- Production-ready deployment setup

---

## ⚙️ Tech Stack

- Node.js
- Express
- PostgreSQL
- pg (node-postgres)
- JWT authentication
- Helmet (security headers)
- CORS configuration
- Vitest (API testing)
- V8 coverage reporting

---

## 🧱 Architecture Overview

![PeakGuide Architecture](docs/screenshots/architecture/peakguide-system-architecture.png)

### Layered Structure

- src/
- controllers/
- routes/
- middleware/
- db.js
- app.js
- server.js

### Responsibility Breakdown

- **server.js**  
  Entry point. Starts HTTP server.

- **app.js**  
  Express configuration and middleware setup.

- **routes/**  
  Route definitions grouped by feature.

- **controllers/**  
  Business logic layer.

- **middleware/**  
  Authentication & authorization guards.

- **db.js**  
  PostgreSQL connection layer with test safety.

---

## 🔐 Authentication & Authorization

### Authentication

- JWT stored in HTTP-only cookies
- `requireAuth` middleware
- Secure cookie-based sessions

### Authorization

- `requireAdmin` middleware
- Role-based access control
- Admin routes protected under `/api/admin/*`

---

## 📦 API Structure

### Public Routes

- GET /api/health
- GET /api/ranges
- GET /api/peaks
- GET /api/peaks/:slug
- POST /api/messages

### Auth Routes

- GET /api/admin/messages
- PATCH /api/admin/messages/:id/status
- GET /api/admin/peaks
- POST /api/admin/peaks
- PUT /api/admin/peaks/:id
- DELETE /api/admin/peaks/:id
- PATCH /api/admin/users/:id/admin

---

## 🗄 Database

- PostgreSQL
- Normalized schema
- Foreign keys
- Indexes for performance
- i18n-ready tables
- Test database isolation

### Environment Variables

DATABASE_URL=
DATABASE_URL_TEST=
JWT_SECRET=
CORS_ORIGIN=
PORT=

---

## 🧪 Testing

- Vitest
- Supertest
- Isolated test database
- Environment-based DB safety
- Coverage reporting with V8

Run tests:

```bash
npm run test
```

# Run with coverage:

```bash
npm run test:cov
```

---

## 🧠 What I Learned (Backend)

- Structuring Express apps properly

- Separating app/server layers

- Implementing JWT cookie authentication

- Role-based route protection

- Writing integration-style API tests

- Preventing accidental production DB wipes in tests

- Configuring environment-aware DB connections

- Building scalable REST architecture

- Handling CORS properly for production deployments

---

## 🚀 Running Locally

```bash
npm install
npm run dev
```

# The API runs on:

- http://localhost:5000

---

## 🛡 Security Features

- Helmet security headers

- CORS allowlist

- HTTP-only cookies

- Role-based route protection

- Environment-based configuration

- Test DB safety guard

---

## 📌 Status

# MVP complete.

- Core API functionality is production-ready.
- Admin and extended hiking features are structured for future expansion.

---

## 👨‍💻 Author

- Przemysław Pietkun
- Full-Stack Developer Portfolio Project

---

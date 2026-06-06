# PeakGuide — Legacy Backend API

## ⚠️ Legacy Express Backend

This repository contains the original **Node.js + Express backend** created during the early development of PeakGuide.

The project has since been migrated to:

* Supabase Authentication
* Supabase PostgreSQL
* Supabase REST API
* Supabase Role-Based Access Control

This codebase is retained for:

* Educational purposes
* Architecture reference
* Portfolio demonstration
* Backend learning showcase

It is **not used in the current production deployment**.

---

## 🎯 Backend Goals

This backend was built to demonstrate:

* Clean REST API architecture
* JWT Authentication
* Role-based authorization
* Express middleware design
* PostgreSQL integration
* Testable application structure
* Production deployment practices

---

## ⚙️ Tech Stack

* Node.js
* Express
* PostgreSQL
* Prisma ORM
* pg (node-postgres)
* JWT Authentication
* Helmet
* CORS
* Cookie Parser
* Vitest
* Supertest

---

## 🧱 Architecture Overview

![PeakGuide Architecture](../docs/screenshots/architecture/architecture-overview.png)

### Layered Structure

* src/
* controllers/
* routes/
* middleware/
* db/
* prisma/
* tests/

### Responsibility Breakdown

#### server.js

Application bootstrap and HTTP server startup.

#### app.js

Express configuration, middleware registration, and route mounting.

#### routes/

Feature-based route definitions.

#### controllers/

Business logic and request handling.

#### middleware/

Authentication and authorization guards.

#### db/

Database access and Prisma configuration.

#### prisma/

Database schema and migrations.

---

## 🔐 Authentication & Authorization

### Authentication

* JWT Tokens
* HTTP-only Cookies
* Session Validation Middleware

### Authorization

* Role-Based Access Control
* Admin Route Protection
* Route Guard Middleware

---

## 📦 API Structure

### Public Routes

* GET /api/health
* GET /api/ranges
* GET /api/peaks
* GET /api/peaks/:slug
* POST /api/messages

### Authentication Routes

* POST /api/auth/register
* POST /api/auth/login
* POST /api/auth/logout
* GET /api/auth/me

### Admin Routes

* GET /api/admin/messages

* PATCH /api/admin/messages/:id/status

* DELETE /api/admin/messages/:id

* GET /api/admin/peaks

* POST /api/admin/peaks

* PUT /api/admin/peaks/:id

* DELETE /api/admin/peaks/:id

* GET /api/admin/users

* PATCH /api/admin/users/:id/admin

* DELETE /api/admin/users/:id

---

## 🗄 Database Design

Features demonstrated:

* PostgreSQL relational schema
* Prisma ORM integration
* Database migrations
* Foreign key relationships
* Internationalization tables (i18n)
* Geographic data support
* Test database isolation

### Environment Variables

```env
DATABASE_URL=
DATABASE_URL_TEST=
JWT_SECRET=
CORS_ORIGIN=
PORT=
```

---

## 🧪 Testing

Testing stack:

* Vitest
* Supertest
* API smoke tests
* Route guard tests
* Public endpoint tests

Run tests:

```bash
npm run test
```

Run coverage:

```bash
npm run test:cov
```

---

## 🧠 What I Learned

* Designing scalable Express applications
* Separating app and server layers
* Implementing JWT authentication
* Building role-based authorization systems
* Writing integration-style API tests
* Managing environment-specific database configurations
* Protecting production environments from test operations
* Structuring maintainable REST APIs
* Configuring CORS for production deployments
* Working with PostgreSQL and Prisma ORM

---

## 🚀 Running Locally

```bash
npm install
npm run dev
```

Default local URL:

```text
http://localhost:5000
```

---

## 🛡 Security Features

* Helmet Security Headers
* CORS Allowlist
* HTTP-only Cookies
* JWT Authentication
* Route-Level Authorization
* Environment-Based Configuration
* Test Database Safety Guards

---

## 📌 Status

### Archived / Reference Project

This backend successfully powered the original PeakGuide MVP and remains available as a reference implementation.

The current production version of PeakGuide uses:

* Supabase Authentication
* Supabase PostgreSQL
* Supabase APIs

---

## 👨‍💻 Author

###Przemysław Pietkun

**Front-end/Full-Stack Developer**

- [GitHub](https://github.com/Silentmaster86)

- [LinkedIn](https://www.linkedin.com/in/przemyslaw-pietkun-front-end-dev)

- [Portfolio](https://przemyslawpietkun.co.uk)

---

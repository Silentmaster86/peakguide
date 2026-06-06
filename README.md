# PeakGuide

**PeakGuide** is a full-stack web application for exploring the **Crown of Polish Mountains (Korona Gór Polski)** and other mountain peaks.

This project was built as a **portfolio-grade MVP**, focusing on clean architecture, real API integration, multilingual support, and scalable backend design — similar to a production travel or outdoor platform.

---

## 🌍 Live Demo

[Frontend](https://peak-guide.netlify.app/)
---

## 🎯 Project Purpose

PeakGuide was created to demonstrate:

- Full-stack architecture using React and Supabase
- Real database integration (no mock data)
- Multilingual content management (UI + database i18n)
- Role-based administration system
- Scalable project structure
- Production-style deployment workflow
- Geographic data handling for mountain locations

The goal was to build something closer to a **real-world product** rather than just a UI portfolio demo.

---

## 🧱 Tech Stack

### Frontend

- React (Vite)
- React Router
- Custom hooks (`useAsync`, `useMediaQuery`)
- Responsive design
- Leaflet / React Leaflet
- Multilingual UI (PL / EN / UA / ZH)
- ESLint

### Backend Services

- Supabase Authentication
- Supabase PostgreSQL
- Supabase ROW Level Security (RLS)
- Supabase REST API
- Supabase Storage (planned)

### Database

- `peaks_i18n`
- `mountain_ranges_i18n`
- `trails_i18n`
- `pois_i18n`

### Testing

- Vitest
- Supertest
- API smoke tests

### Deployment

- Netlify — Frontend
- Supabase — Authentication, Database & Storage

---

## ✨ Core Features (MVP)

### Public Features

- 🌍 Multilingual Interface (PL / EN / UA / ZH)
- ⛰️ Mountain Peaks Catalogue
- 🏔️ Mountain Range Directory
- 📄 Detailed Peak Pages
- 🔎 Filtering by Mountain Range
- 🧭 Breadcrumb Navigation
- 📱 Responsive Design
- 🖼️ Language-Specific Backgrounds
- 🗺️ Geographic Coordinates Integration

### Admin (API-ready structure)

- 🔐 Role-Based Access Control
- 👥 User Management
- 📨 Contact Message Management
- ⛰️ Peak Management
- ⚙️ Expandable Admin Dashboard

---

## 🏗️ Project Structure

peakguide_front/          # React + Supabase application
legacy_peakguide_api/     # Archived Express backend
docs/

---

## 🧩 Architecture Overview

### Frontend

- Feature-based structure
- Reusable UI components
- Dedicated API layer
- Custom hooks for business logic
- Role-aware rendering
- Route-based navigation

### Backend Services

PeakGuide currently uses Supabase as its backend platform:

- Authentication
- Database
- Role Management
- Row Level Security
- REST API Access

A legacy Express + Prisma backend is preserved in the repository for educational and
reference purposes.

---

## 📸 Screenshots

## Frontend

### Home page

![Home](/docs/screenshots/front/01-home.png)

### Peaks list page

![Peaks List](/docs/screenshots/front/02-peak-list.png)

### Peak details page

![Peak details](/docs/screenshots/front/03-peak-details.png)

### Peak map page

![Map](/docs/screenshots/front/04-map.png)

### Admin Panel page

![Admin Panel](/docs/screenshots/front/05-admin-panel.png)

### Mobile Home page

![Mobile Home](/docs/screenshots/front/06-mobile-home.png)

### Mobile peaks list page

![Mobile peaks list](/docs/screenshots/front/07-mobile-peaks.png)

---

## 🏔️ Future Development

- 🥾 Hiking routes & trailheads

- 🗺️ GPX track support

- ⏱️ Estimated hiking time

- ⭐ User progress tracking

- 📷 Image Uploads via Supabase Storage

- 📍 Nearby Points of Interest

- 🛠️ Extended Admin Tools

The current architecture is intentionally designed to support these future expansion.

---

## 🧠 What I Learned

Through this project I gained practical experience in:

- Building scalable React applications
- Designing multilingual database structures
- Working with PostgreSQL and geographic data
- Implementing role-based authorization
- Integrating Supabase Authentication
- Managing application deployment with Netlify and Supabase
- Migrating a project from a custom Express backend to a modern Backend-as-a-Service architecture
- Structuring projects using production-oriented patterns

---

## 📌 Status

### Production-Ready MVP — Actively Expanding

The core browsing experience is complete and stable.

Current development focuses on:

- Hiking routes
- Trail management
- Points of interest
- User progress tracking
- Extended administration tools

---

## 👨‍💻 Author

### Przemysław Pietkun

**Frontend / Full-Stack Developer**

- [GitHub](https://github.com/Silentmaster86)

- [LinkedIn](https://www.linkedin.com/in/przemyslaw-pietkun-front-end-dev)

- [Portfolio](https://przemyslawpietkun.co.uk)

---

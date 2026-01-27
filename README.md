# PeakGuide

**PeakGuide** is a full-stack web application for exploring the *Crown of Polish Mountains (Korona Gór Polski)* and other mountain peaks.

The project is designed as a **portfolio-grade MVP**, focusing on clean UI/UX, real API integration, and scalable architecture — similar to what you would build for a production travel or outdoor platform.

Live users can browse peaks and mountain ranges, view detailed peak pages, and navigate through a hierarchical structure (Peaks → Ranges → Peak).

---

## 🎯 Project Goals

The main goals of this project are to:

- Build a realistic full-stack application (not just a UI demo)
- Practice production-style frontend + backend integration
- Design clean navigation and information architecture
- Showcase modern React patterns and API usage
- Create a scalable base for future features (routes, trailheads, GPX, user tracking)

---

## 🧱 Tech Stack

### Frontend
- React (Vite)
- React Router
- Custom hooks (`useAsync`, `useMediaQuery`)
- Responsive UI with modern card-based layout
- Multilingual UI (PL / EN / UA / ZH – UI ready)

### Backend
- Node.js
- Express
- REST API

### Database
- PostgreSQL
- Normalized schema with i18n tables (`peaks_i18n`, `mountain_ranges_i18n`)

### Authentication
- JWT (planned / partially implemented)

### Deployment
- Render — API + PostgreSQL
- Netlify — Frontend

---

## ✨ Current Features (MVP)

- 🌍 Multilingual interface (PL / EN / UA / ZH for UI)
- ⛰️ Peaks list with elevation and range
- 🏔️ Mountain ranges list and range details
- 📄 Detailed peak pages:
  - Description
  - Elevation
  - Range
  - Coordinates
  - Google Maps link
- 🧭 Breadcrumb navigation (Peaks → Ranges → Peak)
- 🔎 Filtering peaks by range
- 📱 Responsive layout (desktop + mobile)
- 🖼️ Themed backgrounds per language

---

## 🛣️ Planned Features

These are intentionally marked as *coming soon* in the UI:

- 🥾 Hiking routes
- 🅿️ Trailheads / starting points
- 🗺️ GPX tracks
- ⏱️ Estimated hiking time
- ⭐ User progress (planned / done peaks)
- 🔐 Full user accounts & progress tracking
- 🛠️ Admin panel for CRUD (peaks, ranges, routes)

---

## 🧩 Architecture Highlights

- Feature-based page structure
- Separation of UI language and API language fallback
- Reusable UI components (cards, toolbars, breadcrumbs)
- REST API with language-aware queries
- Designed for easy expansion (routes, trailheads, user data)

---

## 🚀 Why This Project

This project simulates a real-world outdoor / travel platform and demonstrates:

- Frontend + backend integration
- Clean UX for hierarchical data
- Practical React patterns
- SQL schema design with internationalization
- Production-style deployment workflow

It is intended as a **junior / mid-level full-stack portfolio project**.

---

## 📌 Status

**MVP — actively developed**

The core browsing experience (peaks + ranges + details) is complete.  
Next milestones focus on routes, trailheads, and user progress features.

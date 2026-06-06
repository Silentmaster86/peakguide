# PeakGuide — Frontend

This is the **React frontend** for the PeakGuide application.

PeakGuide is a full-stack project for exploring the **Crown of Polish Mountains (Korona Gór Polski)** and other mountain peaks, built as a portfolio-grade MVP.

This repository contains the client-side application responsible for:

* User Interface rendering
* Routing and navigation
* Authentication handling
* Multilingual content presentation
* Database communication
* Responsive user experience

---

## 🌍 Live Demo

[Frontend](https://peak-guide.netlify.app/)

---

## 🎯 Frontend Goals

The frontend was built to demonstrate:

* Modern React architecture
* Real database integration (no mock data)
* Multilingual UI management
* Responsive production-style design
* Reusable component architecture
* Authentication and role-based rendering
* Scalable project organization

---

## ⚙️ Tech Stack

* React
* Vite
* React Router
* Supabase Auth
* Supabase Database
* Fetch API
* Custom Hooks
* React Leaflet
* ESLint
* Responsive CSS

---

# 🧩 Architecture Overview

![PeakGuide Architecture](../docs/screenshots/architecture/architecture-overview.png)

### Folder Structure (Simplified)

* src/
* components/
* pages/
* features/
* hooks/
* api/
* auth/
* contexts/
* lib/

### Key Architectural Decisions

* **Feature-based structure** — separation by responsibility
* **Authentication isolated from UI**
* **Reusable UI components**
* **Custom hooks for logic separation**
* **Dedicated API layer**
* **Multilingual content abstraction**
* **Role-based rendering**
* **Admin dashboard designed for future expansion**

---

## ✨ Core Features

### Public Features

* 🌍 Multilingual UI (PL / EN / UA / ZH)
* ⛰️ Peaks catalogue
* 🏔️ Mountain ranges catalogue
* 📄 Detailed peak pages
* 🔎 Range-based filtering
* 🧭 Breadcrumb navigation
* 🗺️ Interactive map integration
* 📱 Fully responsive design
* 🖼️ Language-specific themed backgrounds

### Admin Features

* 🔐 Protected admin area
* 👥 User management
* 📨 Message management
* ⛰️ Peak management
* 🎛️ Role-based interface rendering
* ⚙️ Expandable admin dashboard architecture

---

## 🔐 Authentication

Authentication is handled entirely through **Supabase Auth**.

Features include:

* Email / Password Authentication
* Protected Routes
* Session Persistence
* Role-Based Access Control
* Admin Permissions via Profiles Table

---

## 📸 Screenshots

### Home Page

![Home](/docs/screenshots/front/01-home.png)

### Peaks List Page

![Peak List](/docs/screenshots/front/02-peaks-list.png)

### Peak Details Page

![Peak Details](/docs/screenshots/front/03-peak-details.png)

### Peak Map Page

![Map](/docs/screenshots/front/04-map.png)

### Admin Panel

![Admin Panel](/docs/screenshots/front/05-admin-panel.png)

### Mobile Home Page

![Mobile Home](/docs/screenshots/front/06-mobile-home.png)

### Mobile Peaks List Page

![Mobile Peaks List](/docs/screenshots/front/07-mobile-peaks.png)

---

## 🧠 What I Learned

* Structuring scalable React applications
* Separating business logic from UI components
* Building reusable component systems
* Managing multilingual application state
* Implementing Supabase Authentication
* Handling role-based rendering and permissions
* Integrating geographic data and interactive maps
* Designing interfaces for hierarchical data structures
* Preparing applications for future feature expansion

---

## 🚀 Running Locally

```bash
npm install
npm run dev
```

### Environment Variables

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## 📌 Status

### MVP Complete — Actively Expanding

The core browsing experience is stable and production-ready.

Current development focuses on:

* Extended admin tools
* Hiking routes
* Trail information
* User progress tracking
* Additional mountain datasets

---

## 👨‍💻 Author

###Przemysław Pietkun

**Frontend / Full-Stack Developer**

[GitHub](https://github.com/Silentmaster86)

[LinkedIn](https://www.linkedin.com/in/przemyslaw-pietkun-front-end-dev)

[Portfolio](https://przemyslawpietkun.co.uk)

---

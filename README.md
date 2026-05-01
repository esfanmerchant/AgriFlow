# AgriFlow — Frontend

A 3D, animated **React frontend** for **AgriFlow** — a fertilizer & agri-supply marketplace connecting farmers and suppliers.

> This repo is **frontend-only**. The backend (FastAPI + PostgreSQL) will be added separately by a teammate.

## ✨ Features
- 🌾 **3D hero scene** (Three.js) — procedural wheat field, floating fertilizer bag, growth orb, sparkles
- 🪟 **Glassmorphism + animated mesh background**
- 🎬 **Framer Motion** page transitions, count-up stats, animated bar charts
- 🃏 **3D tilt cards** — every card responds to your cursor in real-time
- 🛡️ Three role-based dashboards: **Farmer / Supplier / Admin**
- 📦 All data is mock data inside the page components — no API calls anywhere

## 🚀 Quick start
```bash
npm install
npm run dev
```
Open http://localhost:5173

## 🔌 For the backend dev
- Mock data lives directly inside each page in `src/pages/` (look for arrays like `products`, `orders`, `usersList`, `payments`).
- Auth is local-only, in [src/context/AuthContext.jsx](src/context/AuthContext.jsx) — replace `login` / `signup` with real `fetch` calls.
- Schema reference: [CixiVK.sql](CixiVK.sql).

## 🏗️ Build for production
```bash
npm run build
npm run preview
```

## 📁 Where things live
- **Pages:** `src/pages/`
- **3D:** `src/components/three/`
- **Auth:** `src/context/AuthContext.jsx`
- **Theme:** `tailwind.config.js` + `src/index.css`

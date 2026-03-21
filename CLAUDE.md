# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Styles by Maggie" — a hair salon business website. Full-stack app with a React SPA frontend and a planned Express/MongoDB backend. The backend (`server.js`) is currently empty and awaiting implementation.

## Structure

```
stylesbymaggie/
├── frontend/   # React + Vite SPA
└── backend/    # Express + MongoDB API (not yet implemented)
```

## Commands

### Frontend (`cd frontend`)
```bash
npm run dev       # Dev server with HMR
npm run build     # Production build to dist/
npm run lint      # ESLint
npm run preview   # Preview production build
npm start         # Serve built dist/ on port 8080
```

### Backend (`cd backend`)
```bash
npm run dev   # nodemon server.js (auto-restart)
npm start     # node server.js (production)
```

## Architecture

**Frontend** (`frontend/src/`):
- `main.jsx` — React root, wraps app in `<BrowserRouter>`
- `App.jsx` — renders `<ParticlesComponent>` (animated background), `<Nav>`, and `<Routes>`
- `components/` — `Nav.jsx`, `Particles.jsx`
- `pages/` — one file per route: Home, About, Contact, Services, Login, Feedback, AdminDashboard, ManagerDashboard

**Routing** uses React Router v7. Routes are defined in `App.jsx`. Several pages are imported but not yet wired to routes.

**Styling** is pure Tailwind CSS v4 (via `@tailwindcss/vite` plugin). Custom pink theme color is defined in `App.css`. No CSS modules or styled-components.

**Backend** (planned): Express 5, Mongoose, JWT auth (`jsonwebtoken` + `bcryptjs`), Morgan logging. Backend `.env` is gitignored — create it locally with `MONGO_URI`, `JWT_SECRET`, etc.

## Conventions

- Components use **named exports**: `export const Home = () => {}`
- All components are functional with hooks
- Axios is the HTTP client for API calls

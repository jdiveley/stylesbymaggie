# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Testing

There is no test suite. The backend `test` script is a placeholder that exits with an error.

## Project Overview

**Styles by Maggie** — a hair salon website. React SPA frontend + Express/MongoDB backend.

## Commands

### Frontend (`cd frontend`)
```bash
npm run dev       # Dev server on port 5175 (HMR)
npm run build     # Production build to dist/
npm run lint      # ESLint
npm run preview   # Preview production build
npm start         # Serve built dist/ on port 8080
```

### Backend (`cd backend`)
```bash
npm run dev       # nodemon server.js (auto-restart)
npm start         # node server.js (production)
node seed.js      # Create default admin/manager accounts (run once)
```

## Environment Setup

Copy `.env.example` → `.env` in both `frontend/` and `backend/` before running.

**`backend/.env` required keys:**
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — random 64-char hex string
- `GOOGLE_CLIENT_ID` — from Google Cloud Console OAuth 2.0 credentials
- `PORT` — defaults to 3000
- `CLIENT_ORIGIN` — production frontend URL (CORS)

**`frontend/.env` required keys:**
- `VITE_API_BASE_URL` — defaults to `http://localhost:3000/api`
- `VITE_GOOGLE_CLIENT_ID` — same value as backend's `GOOGLE_CLIENT_ID`

## Architecture

### Frontend (`frontend/src/`)

**Entry flow:** `main.jsx` wraps the app in `<GoogleOAuthProvider>` → `<BrowserRouter>` → `<AuthProvider>` → `<App>`. Toaster notifications are mounted at root level.

**Auth layer:**
- `context/AuthContext.jsx` — global auth state (`user`, `loading`). Exposes `login(identifier, password)`, `register()`, `loginWithGoogle(idToken)`, `logout()`. On mount it re-hydrates from `localStorage` via `GET /api/auth/me`.
- `lib/axios.js` — single axios instance with `baseURL=VITE_API_BASE_URL`. Request interceptor attaches `Authorization: Bearer <token>` from localStorage. Response interceptor clears token and redirects to `/login` on 401.
- `components/ProtectedRoute.jsx` — accepts optional `roles` array. Redirects unauthenticated users to `/login` (preserving `from` location); redirects wrong-role users to `/`.

**Routing** (all in `App.jsx`):
- Public: `/`, `/about`, `/contact`, `/services`, `/login`, `/feedback`
- Auth required: `/book`, `/account/password`
- Admin only: `/admin`
- Admin, owner, or stylist: `/manager`

**Styling:** Tailwind CSS v4 via `@tailwindcss/vite`. Custom theme tokens defined in `frontend/src/index.css` under `@theme {}` — **this is the only place to define custom colors**. Current palette: `sage-50/100/200/400/500/600` and `gold-400/500`. The `App.css` file is intentionally minimal.

**Particle background:** `components/Particles.jsx` uses `@tsparticles/react`. The background color is `#0d1a0f` (dark green) with gold (`#C9A84C`) particles. It renders absolutely behind all content; page content sits in a `relative z-10` wrapper.

### Backend (`backend/`)

**ES Modules throughout** — `"type": "module"` in `package.json`. All imports use `.js` extensions.

**Data models** (`models/`):
- `User` — `username` (sparse unique), `email` (sparse unique), `passwordHash`, `googleId`, `role` (`customer|stylist|owner|admin`)
- `Stylist` — linked to `User` via `userId` ref; stores `workingDays` (0–6), `workingHours` (`{start, end}` as `HH:mm` strings), `specialties`
- `Service` — `priceCents` (integer, not float), `durationMinutes`, `category` (`cut|color|treatment|styling|other`), `displayOrder`
- `Booking` — refs to `User` (customer), `Stylist`, and `Service`; `startTime`/`endTime` stored as `HH:mm` strings; `status` enum `pending|confirmed|completed|cancelled|no-show`

**Auth flow:**
- Local login accepts `identifier` (username OR email) + `password`. Both `username` and `email` fields use `sparse: true` unique indexes so either can be null.
- Google login: frontend sends Google ID token → `POST /api/auth/google` → backend verifies with `google-auth-library` `OAuth2Client.verifyIdToken()` → upserts user → returns JWT.
- JWT payload: `{ userId, role }`, 7-day expiry.
- `middleware/auth.js` exports `requireAuth` (verifies JWT, attaches `req.user`) and `requireRole(...roles)` (checks `req.user.role`).

**Role hierarchy:** `customer` → `stylist` → `owner` → `admin`. The `owner` role is Maggie (the salon owner): can manage all stylists' availability, manage services (durations/pricing), and access the Manager Dashboard. `admin` is the developer account (jdiveley) with full system access.

**Key route behaviours:**
- `GET /api/stylists/:id/availability?date=YYYY-MM-DD&serviceId=` — generates time slots from stylist's working hours in increments of `service.durationMinutes`, then filters out booked slots. Returns `[]` for non-working days.
- `GET /api/stylists/me` — returns the authenticated user's own stylist profile. **Must be registered before `/:id`** to avoid Express treating `me` as an ID.
- `PATCH /api/stylists/:id/availability` — updates `workingDays` and `workingHours`. Allowed if caller is the stylist themselves, or has `owner`/`admin` role.
- `POST /api/bookings` — checks for slot conflicts before creating.
- `PATCH /api/services/reorder` — bulk updates `displayOrder` from `[{ id, displayOrder }]` array. **Must be registered before `/:id` routes** to avoid Express matching `reorder` as an ID.
- `GET /api/stats` — admin only; uses MongoDB aggregation for revenue (sum of `priceCents` for completed bookings) and top services.
- Services mutation routes (`POST`, `PUT`, `DELETE`, `PATCH /reorder`) — allowed for `admin` and `owner`.

## Conventions

- **Named arrow function exports** everywhere: `export const Foo = () => {}`  — `Feedback.jsx` was normalized to match.
- No `import React from 'react'` — React 17+ JSX transform is used.
- All API calls go through `frontend/src/lib/axios.js`, never raw `fetch` or a separate axios instance.
- Prices are always stored and passed as **integer cents** (`priceCents`), formatted to dollars only at the display layer.
- Seeded accounts: `jdiveley` (admin) and `maggie` (owner), both with password `changeme`. If Maggie's account already existed as `stylist` before the seed change, update her role via the Admin Dashboard → Users tab.
- Manager Dashboard tabs: **Today**, **All Bookings**, **Stylists**, **Availability** (all staff), **Services** (owner/admin only). Stylists can only edit their own availability; owner can edit any stylist's.
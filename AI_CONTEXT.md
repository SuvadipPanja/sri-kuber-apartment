# AI Handoff & Context Document
**Project:** Sri Kuber Apartment - Society Portal
**Target Audience:** Any AI Assistant (Claude, GPT, Gemini, etc.) taking over or continuing development on this codebase.

---

## 1. Project Overview
This is a comprehensive Society Maintenance Management Portal built for "Sri Kuber Apartment". It allows residents to view their payments, pending dues, society expenses, and submit complaints. It allows the society Admin to manage collections, expenses, notices, and resident data.

**Key Features:**
- **Role-Based Access Control (RBAC):** Residents can only view their own data and public society data. The Super Admin has access to all management modules.
- **Hardcoded Super Admin:** **Flat 301** (Suvadip Panja) is hardcoded at the code level (`AuthContext.jsx`) to *always* retain Super Admin privileges.
- **File Storage:** Direct photo uploads for resident profiles using Supabase Storage buckets (`profile-photos`).
- **PWA Ready:** The app includes a `manifest.json` and theme colors to allow residents to "Add to Home Screen" like a native app.
- **Reporting:** Printable statements with automatic WhatsApp formatting and sharing capabilities.

## 2. Technology Stack
- **Frontend Framework:** React 18 (Bootstrapped with Vite)
- **Routing:** React Router v6
- **Backend & Database:** Supabase (PostgreSQL, Auth, Storage)
- **Charting:** Recharts (for financial dashboard graphs)
- **Styling:** Pure vanilla CSS (`index.css`) utilizing a robust CSS Custom Properties (Variables) system for a "Dark Slate" industrial aesthetic. SVG icons are used exclusively (no external icon libraries, no emojis for UI).
- **Hosting:** Vercel

## 3. Deployment Workflow
The workflow to update the live site is entirely Git-driven:
1. **Local Development:** The AI assistant modifies code in the local workspace (`d:\Project\SRI KUBER APARTMENT\society-app`).
2. **Verification:** The AI runs `npm run build` to ensure the Vite build completes successfully without critical errors.
3. **Commit & Push:** Changes are committed and pushed to the `main` branch of the GitHub repository (`origin main`).
4. **Vercel Auto-Deploy:** Vercel listens to the GitHub `main` branch. The moment code is pushed, Vercel automatically builds and deploys the update within 1-2 minutes.
   - *Note to AI:* You do **not** need to deploy to Vercel manually. Just push to GitHub.

## 4. Environment & Secrets Management
- **Supabase Credentials:** The app connects to Supabase using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. 
- **Security Warning:** *NEVER* commit the Supabase `service_role` key or Personal Access Tokens (PAT) into the Git repository or any script files within the codebase. We previously had an incident where setup scripts containing PATs blocked git pushes. All secrets must be kept out of version control.
- **Row Level Security (RLS):** Data security is enforced at the database level using Supabase RLS policies. The frontend handles UI protection (via `ProtectedRoute` and `AdminRoute`), but the actual data protection lives in the DB.

## 5. Application Architecture
### Authentication Flow (`AuthContext.jsx`)
- Login expects `flat_no` and `password`.
- Passwords are hashed using `bcryptjs` before comparison.
- On successful login, user data (including `photoUrl`) is fetched and cached in `sessionStorage` (`ska_user`).
- The app automatically re-fetches the user's `photoUrl` from the database on initialization to ensure returning users see their updated profile pictures.

### Routing (`App.jsx`)
- **Public:** `/login`
- **Protected (Residents):** `/dashboard`, `/monthly-collection`, `/my-payments`, `/pending-dues`, `/expenses`, `/other-income`, `/society-info`, `/flat-directory`, `/notice-board`, `/complaints`, `/my-account`
- **Admin Only:** `/printable-statement`, `/admin`, `/admin/payments`, `/admin/expenses`, `/admin/income`, `/admin/owners`, `/admin/notices`, `/admin/complaints`, `/admin/settings`, `/admin/reset-password`

### Styling Architecture (`index.css`)
- **Variables:** Defined in `:root`. DO NOT use hardcoded colors in inline styles. Always use `var(--primary)`, `var(--bg-card)`, etc.
- **Components:** Custom CSS classes for `.btn`, `.card`, `.badge`, `.form-input`.
- **Layouts:** `grid-2`, `grid-3`, `.table-scroll`, `.flex-between`.

### Utilities & Receipt Generation (`utils/`)
- Calculations are centralized in `calculations.js` (including logic for "All" months/years filtering).
- Receipts are generated using `receiptUtils.js`, which generates an HTML receipt string to print.
- **Note:** The receipt now dynamically loads a physical signature image (`signature.png`) with `mix-blend-mode: multiply` for a transparent background. Fallback text handles image loading failures.

## 6. Historical Context & AI Instructions
- **Aesthetic Overhaul:** The initial design was deemed "AI-generated" due to heavy use of neon purple gradients and emojis. It was overhauled to a Vercel/Linear-inspired "Neutral Dark Slate" palette. Do **not** reintroduce emojis for UI elements; strictly use the `<Icon />` component (`src/components/Icon.jsx`).
- **Date Filtering:** All financial pages support precise Month/Year filtering as well as "All Months" / "All Years" aggregations, powered by logic in `src/utils/calculations.js`.
- **Modifying Code:** When making changes, prioritize checking `calculations.js`, `AuthContext.jsx`, and `App.jsx` to understand the data flow. Always build (`npm run build`) before pushing.

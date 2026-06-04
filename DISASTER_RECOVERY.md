# Sri Kuber Apartment — Disaster Recovery & Backup Plan

This document is your **full-proof action plan** if GitHub, Vercel, or Supabase fails.  
Your **real financial data** lives in **Supabase**. The app on Vercel is replaceable if you keep backups.

---

## Golden rules

1. **Download a ZIP backup weekly** — Admin → **Data Backup & Restore** → *Download ZIP backup*.
2. **Upload that ZIP to Google Drive** (folder: `Sri Kuber Backups`).
3. **Keep `.env` secrets safe** offline (Supabase URL + anon key) — password manager or encrypted note.
4. **GitHub** already stores source code; push after every important change.

---

## What the backup contains

| File | Purpose |
|------|---------|
| `full-backup.json` | Complete restore file for the portal |
| `data/*.json` | Each table: payments, expenses, owners, config, … |
| `reports/payments-who-paid-when.csv` | Who paid, how much, when |
| `reports/expenses.csv` | All society expenses |
| `reports/monthly-summary.csv` | Opening balance, collection, expenses, net per month |
| `README.txt` | Instructions inside the ZIP |

---

## Scenario A — Supabase down or data lost

### Step 1: New Supabase project (if needed)

1. Create project at [supabase.com](https://supabase.com).
2. Run SQL migrations from `society-app/supabase/migrations/` in order:
   - `20260603120000_user_activity.sql`
   - `20260602120000_society_gallery.sql`
   - `20260604120000_user_activity_rls.sql` (RLS policies)
3. Create storage buckets: `profile-photos`, `society-photos`, `contact-photos`, `expense-attachments` (public).

### Step 2: Restore data

1. Deploy or run the app locally with new `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. Login as admin (Flat 301).
3. **Admin → Data Backup & Restore** → upload `full-backup.json` → **Restore into Supabase**.

### Step 3: Verify

- Dashboard totals match old months.
- **Manage Payments** / **Expenses** show history.
- Test one new payment entry.

---

## Scenario B — Vercel / site down, Supabase OK

1. Check [vercel.com](https://vercel.com) status and project logs.
2. Redeploy: connect GitHub repo `sri-kuber-apartment`, branch `main`.
3. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. No data restore needed if Supabase is intact.

---

## Scenario C — GitHub lost, laptop has backup

1. Use ZIP + any copy of `society-app` folder (or extract from old PC).
2. Create new GitHub repo, push code.
3. Connect Vercel to new repo.
4. Point env vars to existing Supabase (if still running).

---

## Scenario D — Rebuild app from scratch

**You need:** Git repo (or folder), Supabase (with data or backup), env vars.

```powershell
cd "D:\Project\SRI KUBER APARTMENT\society-app"
npm install
# Create .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

Production:

```powershell
npm run build
# Deploy dist via Vercel CLI or Git push
```

After deploy:

1. Restore backup if database empty (Scenario A).
2. Re-run gallery / activity SQL if tables missing.

---

## Auto-backup on laptop

The portal can **remind you daily** on the Data Backup page.  
True silent auto-save to disk without clicking is blocked by browsers — use:

- Weekly calendar reminder: “Download Sri Kuber ZIP”
- Upload ZIP to Google Drive the same day

Optional: Windows Task Scheduler cannot run the web app; manual download from admin page is required.

---

## Record of truth (what matters most)

| Data | Table | In backup |
|------|-------|-----------|
| Who paid maintenance | `payments` | Yes + CSV |
| Expenses | `expenses` | Yes + CSV |
| Monthly net / carry forward | `config` + reports | Yes |
| Flat owners | `owners` | Yes |
| Login passwords | `auth_users` | Yes (hashed) |
| Photos / bill attachments | Storage buckets | URLs in DB only — re-upload files if storage wiped |

---

## Contacts & repo

- **App:** https://sri-kuber-apartment.vercel.app  
- **GitHub:** https://github.com/SuvadipPanja/sri-kuber-apartment  
- **Admin backup:** `/admin/data-backup`

---

*Last updated: June 2026 — backup version 1.0.0*

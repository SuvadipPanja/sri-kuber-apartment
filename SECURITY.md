# Security — Sri Kuber Apartment Portal

## Current model

- **Frontend:** Flat + password verified with bcrypt against `auth_users` (anon Supabase client).
- **Session:** `sessionStorage` key `ska_user` (no password stored).
- **Super admin:** Flat `301` enforced in application code.

## Required before production hardening

1. **Enable RLS** on every table in `public` and storage buckets. See `supabase/migrations/20260602000000_security_rls.sql`.
2. **Never** put `service_role` in `VITE_*` environment variables.
3. **Move login** to a Supabase Edge Function or Supabase Auth so `password_hash` is not readable from the browser if RLS is misconfigured.
4. **Rotate** any credentials that were ever committed to git.
5. **Test deny access:** Log in as flat A, attempt to read flat B’s rows via API — must fail.

## Client-side protections (implemented)

- Login rate limiting (5 failures → 15 min lockout per tab).
- Flat number format validation.
- Password length bounds.
- Auth session restore awaits async init (no flash of wrong route).

## Checklist

- [ ] RLS enabled + `FORCE ROW LEVEL SECURITY` on sensitive tables
- [ ] Policies use explicit `TO authenticated` / `TO anon` (not default `public`)
- [ ] Storage buckets private; signed URLs for uploads
- [ ] `.env` not in git; Vercel env vars scoped per environment
- [ ] HTTPS only (Vercel default)

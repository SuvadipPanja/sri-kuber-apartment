<div align="center">

# 🏢 Sri Kuber Apartment — Society Portal

**Maintenance and money management for an apartment society.**

[![Live site](https://img.shields.io/badge/Live-sri--kuber--apartment.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://sri-kuber-apartment.vercel.app)

![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=flat-square&logo=pwa&logoColor=white)

</div>

---

## About

Residents see what they paid, what is due and where the society's money went. The admin manages collections, expenses, notices and resident records — all from one app that installs on a phone like a native app.

## Features

| For residents | For the admin |
|---|---|
| Payment history and pending dues | Record collections and expenses |
| Society expense view | Notices and announcements |
| Raise and track complaints | Resident records and profile photos |
| Printable statements, share to WhatsApp | Financial dashboard with charts |

- **Role-based access** — residents only see their own data plus public society data
- **Supabase** for auth, PostgreSQL and file storage
- **PWA** — add to home screen
- Clean dark UI built with plain CSS variables and SVG icons

## Run locally

```bash
cp .env.example .env    # add your Supabase URL and anon key
npm install
npm run dev
```

Pushes to `main` deploy automatically on Vercel.

---

<div align="center">
Built by <a href="https://github.com/SuvadipPanja">Suvadip Panja</a>
</div>

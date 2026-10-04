<div align="center">

# 🏥 MedTech

### Dual appointment + digital prescription platform for hospitals

Handle **online and offline token bookings** for multiple doctors, issue **digital prescriptions**, track **medicines**, store **reports**, and monitor **patient health** — all in one unified experience.

[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?style=for-the-badge&logo=vercel)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](./LICENSE)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Screenshots](#-screenshots)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Storage Setup](#-storage-setup)
- [Demo Accounts](#-demo-accounts)
- [Project Structure](#-project-structure)
- [How It Works](#-how-it-works)
- [Deployment](#-deployment)
- [Known Limitations](#-known-limitations)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)

---

## 🎯 Overview

**MedTech** is a modern hospital appointment and prescription platform built for a hackathon. It solves a common real-world problem: hospitals run two separate booking channels — walk-in (offline) tokens and online appointments — but tools that handle both in one place are rare.

MedTech gives you:

- A single flip-card entry point for both **patients** and **doctors**
- **Token-based scheduling** with hard limits per doctor per day
- **Digital prescriptions** that instantly become a patient-facing **medicine tracker**
- **Report uploads**, **BMI tracking**, and a full **personal health record**

The UI is designed to feel like a real product: premium black dark theme, clean white light mode, consistent visual language across every screen, and zero dummy data (except the 6 seeded doctors).

---

## ✨ Features

### 🎫 Dual Appointment Booking

- **Online tokens:** capped at **30 per doctor per day**
- **Offline tokens:** capped at **70 per doctor per day**
- **No duplicate tokens** — enforced by a composite unique constraint on `(doctor_id, appointment_date, token_number)`
- Live slot counter per doctor per date
- Multiple doctors supported simultaneously

### 👤 Patient Portal

| Feature | Description |
|---|---|
| Auto-generated ID | Format `PTxxxxxxxx` created on signup |
| Dashboard | Overview of appointments, prescriptions, medicines, reports |
| Appointments | Book online/offline, view history with token numbers |
| Prescriptions | Read diagnosis, notes, diet advice, and full medicine list |
| Medicine Tracker | Daily dose checkboxes, progress ring, active/past tabs |
| Reports | Upload PDF/images up to 50 MB, filter by uploader, search |
| Health Record | Weight, height, live BMI calculation with category chips |
| Theme | Toggle between premium black and clean white |

### 🩺 Doctor Portal

| Feature | Description |
|---|---|
| Dashboard | Today's queue with capacity meters and pending/completed counts |
| Appointments | Date navigator for any past/future day, filters, search |
| Prescribe | Rich form with dosage presets, frequency chips, duration quick-selects |
| Edit Prescriptions | Update an existing prescription — trackers reset cleanly |
| Patient Context | Name, phone, weight, height shown inline |

### 🎨 UI / UX

- **Flip-card login/register** for both roles
- **Premium black** dark theme (default) + full **light** theme
- **Consistent design language** — every page shares hero cards, eyebrow labels, filter chips, empty states
- **Fully responsive** — mobile, tablet, desktop
- **No scrollbar on login** — locked viewport layout
- **Optimistic updates** on medicine tracking

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Language | JavaScript (ES2022) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Database | [Supabase](https://supabase.com/) (PostgreSQL) |
| File Storage | Supabase Storage |
| Session | `localStorage` (hackathon demo) |
| Hosting | [Vercel](https://vercel.com/) |

---

## 📸 Screenshots

> Add your own screenshots here. Suggested shots:
>
> - `docs/screenshots/login.png` — Flip-card login
> - `docs/screenshots/patient-dashboard.png`
> - `docs/screenshots/doctor-dashboard.png`
> - `docs/screenshots/prescribe.png`

```markdown
| Login | Patient Dashboard |
|---|---|
| ![Login](docs/screenshots/login.png) | ![Patient](docs/screenshots/patient-dashboard.png) |

| Doctor Dashboard | Prescribe |
|---|---|
| ![Doctor](docs/screenshots/doctor-dashboard.png) | ![Prescribe](docs/screenshots/prescribe.png) |

```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.17+ or 20+
- **npm** (or pnpm/yarn)
- A free **Supabase** account → [supabase.com](https://supabase.com)
- A free **Vercel** account (for deployment) → [vercel.com](https://vercel.com)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/medtech.git
cd medtech
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Pick any name, region, and password
3. Wait for provisioning (~2 minutes)

### 4. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

See [Environment Variables](#-environment-variables) below.

### 5. Run the SQL schema

Open **Supabase → SQL Editor → New Query** and paste the full schema from [Database Setup](#-database-setup). Run it.

### 6. Create the storage bucket

Open **Supabase → Storage → New Bucket**:

- **Name:** `reports`
- **Public:** ON

Then run the storage policies from [Storage Setup](#-storage-setup).

### 7. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🔑 Environment Variables

Create `.env.local` at the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Where to find these

1. Supabase Dashboard → your project
2. **Settings → API**
3. Copy **Project URL** and **anon public** key

⚠️ **Never commit `.env.local`** — it's already in `.gitignore`.

---

## 🗄 Database Setup

Run this entire block in **Supabase → SQL Editor → New Query**:

```sql
-- ═══════════════════════════════════════════
-- TABLES
-- ═══════════════════════════════════════════

CREATE TABLE patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  weight DECIMAL,
  height DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  specialty TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('online','offline')),
  token_number INT NOT NULL,
  appointment_date DATE NOT NULL,
  status TEXT DEFAULT 'booked',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, appointment_date, token_number)
);

CREATE TABLE prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  diagnosis TEXT,
  notes TEXT,
  medicines JSONB DEFAULT '[]',
  diet TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT,
  description TEXT,
  uploaded_by TEXT DEFAULT 'patient',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE medicine_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  dosage TEXT,
  times_per_day INT,
  duration_days INT,
  start_date DATE,
  end_date DATE,
  taken_log JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════
-- SEED 6 DEMO DOCTORS
-- ═══════════════════════════════════════════

INSERT INTO doctors (doctor_id, name, email, specialty) VALUES
('DOC001', 'Dr. Arjun Mehta',   'arjun@medtech.com',  'Cardiologist'),
('DOC002', 'Dr. Priya Sharma',  'priya@medtech.com',  'General Physician'),
('DOC003', 'Dr. Rohan Verma',   'rohan@medtech.com',  'Dermatologist'),
('DOC004', 'Dr. Sneha Iyer',    'sneha@medtech.com',  'Pediatrician'),
('DOC005', 'Dr. Vikram Singh',  'vikram@medtech.com', 'Orthopedic'),
('DOC006', 'Dr. Ananya Reddy',  'ananya@medtech.com', 'Neurologist');

-- ═══════════════════════════════════════════
-- ROW LEVEL SECURITY (permissive for hackathon)
-- ═══════════════════════════════════════════

ALTER TABLE patients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports          ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_tracker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_patients"      ON patients         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_doctors"       ON doctors          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_appointments"  ON appointments     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_prescriptions" ON prescriptions    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_reports"       ON reports          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_tracker"       ON medicine_tracker FOR ALL USING (true) WITH CHECK (true);
```

> ⚠️ The RLS policies above are **permissive** and intended for hackathon demos only. **Do not use this in production** — tighten them per user session before real deployment.

---

## 🪣 Storage Setup

After creating the `reports` bucket (public), run this in **Supabase → SQL Editor**:

```sql
CREATE POLICY "public read reports"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'reports');

CREATE POLICY "public upload reports"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'reports');

CREATE POLICY "public delete reports"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'reports');
```

---

## 🎭 Demo Accounts

### Doctors (seeded)

| Email | Specialty |
|---|---|
| `arjun@medtech.com` | Cardiologist |
| `priya@medtech.com` | General Physician |
| `rohan@medtech.com` | Dermatologist |
| `sneha@medtech.com` | Pediatrician |
| `vikram@medtech.com` | Orthopedic |
| `ananya@medtech.com` | Neurologist |

Log in with **email only** (no password in the demo).

### Patients

Register any **name + email + phone** — an ID like `PT12345678` is generated automatically.

> ⚠️ **Session is per-browser** (stored in `localStorage`). To test **patient + doctor simultaneously**, use **two browsers** (Chrome + Firefox) or **Chrome + Incognito**. Two tabs in the same browser share the same session.

---

## 📁 Project Structure

```
medtech/
├── app/
│   ├── layout.js
│   ├── page.js
│   ├── globals.css
│   ├── login/page.js
│   ├── patient/
│   │   ├── dashboard/page.js
│   │   ├── appointments/page.js
│   │   ├── prescriptions/page.js
│   │   ├── medicines/page.js
│   │   ├── reports/page.js
│   │   └── health/page.js
│   └── doctor/
│       ├── dashboard/page.js
│       ├── appointments/page.js
│       └── prescribe/[id]/page.js
├── components/
│   ├── Navbar.js
│   ├── ThemeProvider.js
│   └── ThemeToggle.js
├── lib/
│   └── supabase.js
├── public/
├── .env.example
├── .env.local
├── .gitignore
├── jsconfig.json
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── README.md
└── LICENSE
```

---

## ⚙️ How It Works

### 1. Authentication (demo)

Login and registration live in `app/login/page.js`. A flip card lets you switch between **Login** and **Register** without leaving the page, and a role toggle switches between **Patient** and **Doctor**.

On success, the app stores `{ role, name, id, email }` in `localStorage` under `medtech-user`. Every protected page reads this key on mount to decide whether to render or redirect.

### 2. Appointment booking

- Patient picks a **doctor**, **type** (online/offline), and **date**
- App queries Supabase for the count of existing bookings for `(doctor, date, type)`
- If the count is at the limit (30 online / 70 offline), booking is rejected
- Otherwise the next token is computed as `MAX(token_number) + 1`
- Insert is protected by the DB-level `UNIQUE(doctor_id, appointment_date, token_number)` constraint — duplicate tokens are impossible even under race conditions

### 3. Prescriptions → medicine tracker

When a doctor saves a prescription:

1. A row is inserted into `prescriptions` with a JSONB `medicines` array
2. For each medicine, a row is inserted into `medicine_tracker` with `start_date = today` and `end_date = today + duration_days`
3. The appointment is marked `status = 'completed'`

The patient's **Medicines** page renders one card per tracker row with daily dose checkboxes. Each tap toggles a key like `"2025-01-15-0"` inside the `taken_log` JSONB array.

### 4. Reports

Files are uploaded to the `reports` public bucket under `<patient_id>/<timestamp>.<ext>`, then a row with the public URL is inserted into `reports`. If the insert fails, the uploaded file is cleaned up automatically.

### 5. Themes

`ThemeProvider` reads/writes the `medtech-theme` key in `localStorage` and toggles the `dark` class on `<html>`. Tailwind's `darkMode: 'class'` strategy handles all color switching.

---

## ☁️ Deployment

### Deploy to Vercel (recommended)

1. Push your repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → import the repo
3. Framework preset: **Next.js** (auto-detected)
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**

Done in ~2 minutes.

### Or via CLI

```bash
npm i -g vercel
vercel
vercel --prod
```

Add the same two env vars in the Vercel dashboard under **Settings → Environment Variables**.

---

## ⚠️ Known Limitations

This project is **hackathon-grade**. Before production use, address:

| Limitation | Impact | Fix |
|---|---|---|
| **No password auth** | Anyone can log in with email + phone | Replace with Supabase Auth |
| **Open RLS policies** | Any browser can read/write any table | Add per-user policies |
| **`localStorage` sessions** | Not shared across browsers | Use Supabase Auth session |
| **No rate limiting** | Booking spam is possible | Add server-side throttling |
| **No real-time updates** | Doctor's queue doesn't auto-refresh | Add Supabase Realtime |
| **Client-side token calc** | Race conditions theoretically possible | Move to a Postgres function |

Do **not** put real patient data in this app as-is.

---

## 🛣 Roadmap

- [ ] Supabase Auth with email OTP / magic link
- [ ] Real-time appointment queue via Supabase channels
- [ ] SMS + email reminders for upcoming appointments
- [ ] PDF export for prescriptions
- [ ] Doctor-side PDF/image upload for reports
- [ ] Multi-hospital tenancy
- [ ] Analytics dashboard for hospital admins
- [ ] Video consultation for online appointments
- [ ] Prescription templates per specialty

---

## 🤝 Contributing

Contributions are welcome. For major changes, open an issue first.

```bash
git checkout -b feature/your-feature
git commit -m "Add: your feature"
git push origin feature/your-feature
```

### Guidelines

- Match the existing design language (colors, spacing, icon usage)
- Keep components small and colocated
- Test on both dark and light themes
- Don't commit `.env.local`

---

## 📝 License

Released under the **MIT License**. See [LICENSE](./LICENSE) for details.

You're free to use, modify, distribute, and commercialize this project. Attribution is appreciated but not required.

---

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/) — the App Router experience is unmatched
- [Supabase](https://supabase.com/) — Postgres + Auth + Storage, all free
- [Tailwind CSS](https://tailwindcss.com/) — utility-first styling done right
- [Lucide Icons](https://lucide.dev/) — beautiful, consistent icon set
- [Vercel](https://vercel.com/) — deploy in one click

---

<div align="center">

**Built with ❤️ for a hackathon.**

If this project helped you, consider giving it a ⭐.

</div>
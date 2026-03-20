# TankDOC Service Manager

> Aquarium & Pond Cleaning Service Management for Bangalore
> Zero-cost, production-ready, 5000+ customer capacity

---.

## Tech Stack

| Layer | Service | Cost |
|---|---|---|
| Frontend + API + Cron | Vercel (Next.js 14) | Free |
| Database | Neon PostgreSQL | Free (512MB) |
| WhatsApp Notifications | Meta Cloud API | Free (1000 conv/mo) |
| Auth | JWT + bcrypt | Built-in |
| Encryption | AES-256-GCM | Built-in |

---

## Features

- **Dashboard** — Overview of services, revenue, and upcoming tasks
- **Service Management** — Create, edit, delete, and track aquarium/pond cleaning services
- **Client Management** — Customer database with encrypted phone numbers and addresses
- **Doctor/Staff Assignment** — Assign services to team members
- **Expense Tracking** — Log and categorize business expenses with monthly reports
- **WhatsApp Reminders** — Automated daily reminders for due services (9AM IST)
- **Role-based Access** — Admin and Doctor roles with different permissions
- **Data Encryption** — Sensitive customer data encrypted at rest (AES-256-GCM)

---

## Project Structure

```
service-manager/
├── app/
│   ├── layout.tsx              # Root layout + nav
│   ├── page.tsx                # Dashboard
│   ├── add/page.tsx            # Add new service
│   ├── services/page.tsx       # All services
│   ├── clients/page.tsx        # Client list
│   ├── history/page.tsx        # Service history + export
│   ├── due/page.tsx            # Due/overdue services
│   ├── users/page.tsx          # User management (Admin)
│   ├── accounts/page.tsx       # Expense tracking
│   ├── settings/page.tsx       # App settings
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   └── me/route.ts
│       ├── services/
│       │   ├── route.ts        # GET list + POST create
│       │   ├── due/route.ts    # GET due services
│       │   ├── upcoming/route.ts
│       │   └── [id]/route.ts   # PUT update + DELETE
│       ├── clients/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── expenses/
│       │   ├── route.ts
│       │   ├── monthly/route.ts
│       │   └── [id]/route.ts
│       ├── users/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── seed/route.ts       # DB seeding
│       └── cron/
│           └── reminders/route.ts  # Daily WhatsApp job
├── components/                 # Reusable UI components
├── lib/
│   ├── prisma.ts               # DB client singleton
│   ├── auth.ts                 # JWT auth helpers
│   ├── encryption.ts           # AES-256-GCM encryption
│   ├── whatsapp.ts             # Meta WhatsApp Cloud API
│   └── validate.ts             # Input validation
├── prisma/
│   └── schema.prisma           # DB schema
├── vercel.json                 # Cron job config (9AM IST)
└── .env.example                # All env vars documented
```

---

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/TankDoc/service-manager.git
cd service-manager
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:

| Variable | Where to Get |
|---|---|
| `DATABASE_URL` | [neon.tech](https://neon.tech) → New Project → Connection String |
| `WHATSAPP_ACCESS_TOKEN` | [developers.facebook.com](https://developers.facebook.com) → WhatsApp → API Setup |
| `WHATSAPP_PHONE_NUMBER_ID` | Same page as above |
| `OWNER_WHATSAPP_NUMBER` | Your WhatsApp number (e.g. `919876543210`) |
| `CRON_SECRET` | Run: `openssl rand -base64 32` |
| `JWT_SECRET` | Run: `openssl rand -base64 32` |

### 3. Initialize Database

```bash
npx prisma db push
```

### 4. Run Dev Server

```bash
npm run dev
# → http://localhost:3000
```

### 5. Seed Admin User

Visit: `http://localhost:3000/api/seed`

Login with:
- Email: `admin@tankdoc.com`
- Password: `tankdoc123`

---

## Deploy to Vercel

1. Push to GitHub
2. Go to **[vercel.com](https://vercel.com)** → Import repo
3. Add all environment variables in Vercel → Settings → Environment Variables
4. Click **Deploy**
5. Seed admin: visit `https://your-app.vercel.app/api/seed?secret=YOUR_CRON_SECRET`
6. Verify cron job is active in Vercel Dashboard → Cron Jobs tab

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Login |
| `POST` | `/api/auth/logout` | Public | Logout |
| `GET` | `/api/auth/me` | Auth | Current user |
| `GET` | `/api/services` | Auth | List services (`?search=`, `?page=`, `?limit=`) |
| `POST` | `/api/services` | Auth | Create service |
| `PUT` | `/api/services/:id` | Auth | Update service |
| `DELETE` | `/api/services/:id` | Auth | Delete service |
| `GET` | `/api/services/due` | Auth | Overdue services |
| `GET` | `/api/services/upcoming` | Auth | Upcoming services |
| `GET` | `/api/clients` | Auth | List clients |
| `GET` | `/api/clients/:id` | Auth | Client details |
| `GET` | `/api/expenses` | Admin | List expenses |
| `POST` | `/api/expenses` | Admin | Create expense |
| `DELETE` | `/api/expenses/:id` | Admin | Delete expense |
| `GET` | `/api/expenses/monthly?month=YYYY-MM` | Admin | Monthly summary |
| `GET` | `/api/users` | Admin | List users |
| `POST` | `/api/users` | Admin | Create user |
| `PUT` | `/api/users/:id` | Admin | Update user |
| `DELETE` | `/api/users/:id` | Admin | Delete user |
| `GET` | `/api/cron/reminders` | Bearer | Trigger reminders |

---

## WhatsApp Reminder Logic

```
Daily at 9:00 AM IST (via Vercel Cron)
       ↓
Query: services WHERE nextServiceDate <= TODAY AND reminderSent = false
       ↓
For each due service:
  → Send WhatsApp message to OWNER_WHATSAPP_NUMBER
  → Mark reminderSent = true
       ↓
When service is updated with new date → reminderSent resets to false
```

---

## Service Types

- `AQUARIUM_CLEANING`
- `POND_CLEANING`
- `FILTER_MAINTENANCE`
- `WATER_TREATMENT`
- `OTHER`

## Expense Categories

- `FUEL`
- `EQUIPMENT`
- `CHEMICALS`
- `MISCELLANEOUS`

---

## Scaling

- **Neon free tier**: 512MB → ~50,000+ service records
- **Vercel Hobby**: 100GB bandwidth/month → 5000+ customers
- **WhatsApp**: 1000 free conversations/month

---

## Troubleshooting

| Problem | Solution |
|---|---|
| WhatsApp not sending | Check token hasn't expired; ensure recipient is whitelisted in Meta dashboard |
| DB connection error | Verify `DATABASE_URL` includes `?sslmode=require` |
| Cron not firing | Check `CRON_SECRET` matches in Vercel env vars |
| Build fails | Run `npx prisma generate` first |
| Login fails | Re-seed admin: `/api/seed?secret=YOUR_CRON_SECRET` |

---

*Built for TankDOC · Zyni Innovations · Bangalore*

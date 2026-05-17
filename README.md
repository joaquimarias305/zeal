# ShiftMIA 🌴

**Bilingual hospitality workforce platform for South Florida's Latino community.**  
Find and fill shifts at Miami restaurants, hotels, and events — in English and Spanish.

---

## Tech Stack

| Layer       | Technology                              |
|-------------|------------------------------------------|
| Frontend    | React 18 + Tailwind CSS + i18next        |
| Backend     | Node.js + Express.js                     |
| Database    | PostgreSQL (Railway)                     |
| Auth        | JWT (bcryptjs)                           |
| Payments    | Stripe (Connect + Instant Pay)           |
| Email       | SendGrid (nodemailer)                    |
| Hosting     | Railway.app                              |
| CI/CD       | GitHub Actions                           |

---

## Project Structure

```
shiftmia/
├── client/                   # React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       │   └── common/       # Navbar, ShiftCard, StarRating, LoadingScreen
│       ├── context/          # AuthContext (JWT + user state)
│       ├── i18n/             # en.json + es.json translations
│       ├── pages/
│       │   ├── auth/         # Login, Register, VerifyEmail, ForgotPW, ResetPW
│       │   ├── worker/       # Dashboard, Profile, Availability, Settings
│       │   ├── business/     # Dashboard, Profile, PostShift, ManageShift
│       │   ├── shifts/       # ShiftBoard, ShiftDetail, PaymentPage
│       │   └── admin/        # AdminDashboard
│       └── utils/            # api.js (axios instance)
├── server/
│   └── src/
│       ├── app.js            # Express entry point
│       ├── config/           # db.js, logger.js, migrate.js
│       ├── controllers/      # auth, worker, business, shift, payment, review, admin
│       ├── middleware/        # auth.js, errorHandler.js, validate.js
│       ├── routes/           # One file per resource
│       └── services/         # emailService.js, stripeService.js
├── database/
│   ├── schema.sql            # Full PostgreSQL schema with triggers
│   └── seed.sql              # Sample data (password: Test1234!)
├── .github/workflows/ci.yml  # GitHub Actions CI/CD
├── .env.example
└── railway.toml
```

---

## Local Setup

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USER/shiftmia.git
cd shiftmia

# Install server deps
cd server && npm install

# Install client deps
cd ../client && npm install
```

### 2. Environment variables

```bash
# Server
cp .env.example server/.env
# Fill in: DATABASE_URL, JWT_SECRET, STRIPE_SECRET_KEY,
#          STRIPE_WEBHOOK_SECRET, SENDGRID_API_KEY
```

### 3. Database

```bash
# Create a PostgreSQL database, then:
cd server
npm run db:migrate   # runs database/schema.sql
npm run db:seed      # loads sample data
```

### 4. Run locally

```bash
# Terminal 1 – API
cd server && npm run dev      # http://localhost:5000

# Terminal 2 – Frontend
cd client && npm start        # http://localhost:3000
```

---

## Railway Deployment

### One-command deploy

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
railway link

# Add PostgreSQL plugin in Railway dashboard, then:
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your_32_char_secret
railway variables set STRIPE_SECRET_KEY=sk_live_...
railway variables set STRIPE_WEBHOOK_SECRET=whsec_...
railway variables set SENDGRID_API_KEY=SG....
railway variables set CLIENT_URL=https://your-frontend.up.railway.app

# Deploy
railway up
```

### GitHub Actions auto-deploy

Add these secrets in your GitHub repo settings:

| Secret                  | Value                         |
|-------------------------|-------------------------------|
| `RAILWAY_TOKEN`         | Your Railway API token         |
| `REACT_APP_STRIPE_PK`   | `pk_live_...`                  |
| `REACT_APP_API_URL`     | `https://your-api.railway.app/api` |

Every push to `main` triggers an automatic deploy.

---

## Stripe Setup

### Business payments
1. Add Stripe publishable key to client `.env`
2. Business pays upfront when confirming a worker
3. Platform automatically takes **15% commission**

### Worker Instant Pay (Stripe Connect)
1. Worker clicks "Configurar Pago Instantáneo" in Settings
2. Redirected to Stripe Express onboarding
3. After completing: payments arrive within 30 min of shift end

### Stripe webhook (local testing)
```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

---

## API Reference

### Auth
| Method | Endpoint                  | Auth    | Description             |
|--------|---------------------------|---------|-------------------------|
| POST   | `/api/auth/register`      | –       | Register worker/business |
| POST   | `/api/auth/login`         | –       | Login, returns JWT       |
| GET    | `/api/auth/me`            | JWT     | Current user             |
| GET    | `/api/auth/verify-email`  | –       | Verify email token       |
| POST   | `/api/auth/forgot-password` | –     | Send reset email         |
| POST   | `/api/auth/reset-password`  | –     | Reset with token         |

### Shifts
| Method | Endpoint                              | Auth     | Description           |
|--------|---------------------------------------|----------|-----------------------|
| GET    | `/api/shifts`                         | –        | Browse open shifts    |
| GET    | `/api/shifts/:id`                     | –        | Shift detail          |
| POST   | `/api/shifts`                         | Business | Create shift          |
| PATCH  | `/api/shifts/:id`                     | Business | Update shift          |
| DELETE | `/api/shifts/:id`                     | Business | Cancel shift          |
| POST   | `/api/shifts/:id/apply`               | Worker   | Apply to shift        |
| GET    | `/api/shifts/:id/applications`        | Business | List applicants       |
| PATCH  | `/api/shifts/:sid/applications/:aid`  | Business | Accept/reject         |
| GET    | `/api/shifts/worker/mine`             | Worker   | Worker's applications |
| GET    | `/api/shifts/business/mine`           | Business | Business's shifts     |

### Payments
| Method | Endpoint                          | Auth     | Description             |
|--------|-----------------------------------|----------|-------------------------|
| POST   | `/api/payments/intent`            | Business | Create payment intent   |
| POST   | `/api/payments/webhook`           | Stripe   | Stripe webhook          |
| POST   | `/api/payments/stripe-connect`    | Worker   | Init Stripe onboarding  |
| POST   | `/api/payments/instant-pay/:id`   | Worker   | Request instant payout  |
| GET    | `/api/payments/business/history`  | Business | Payment history         |
| GET    | `/api/payments/worker/history`    | Worker   | Earnings history        |

### Reviews
| Method | Endpoint                        | Auth | Description        |
|--------|---------------------------------|------|--------------------|
| POST   | `/api/reviews`                  | JWT  | Submit review      |
| GET    | `/api/reviews/worker/:id`       | –    | Worker's reviews   |
| GET    | `/api/reviews/business/:id`     | –    | Business's reviews |

---

## Database Schema Summary

```
users               – id, type (worker/business/admin), name, email, jwt
worker_profiles     – skills[], languages[], avg_rating, miami_verified, top_worker
business_profiles   – company_name, zone, verified, stripe_customer_id
shifts              – role, date, pay_rate, status, workers_needed
applications        – shift_id, worker_id, status (pending/accepted/rejected)
payments            – gross, platform_fee (15%), worker_amount (85%), stripe IDs
reviews             – rating (1-5), comment, auto-updates avg_rating
notifications       – bilingual (title_en/title_es, body_en/body_es)
worker_availability – recurring (day_of_week) or one-off (specific_date)
```

Auto-triggers:
- `updated_at` auto-refreshed on every UPDATE
- `top_worker` badge auto-set when avg_rating ≥ 4.8 AND reviews ≥ 5

---

## Seed Accounts (password: `Test1234!`)

| Role     | Email                   |
|----------|-------------------------|
| Admin    | admin@shiftmia.com      |
| Business | bistro@shiftmia.com     |
| Worker   | carlos@shiftmia.com     |

---

## Features Checklist

- [x] Bilingual UI (English / Spanish — Spanish-first)
- [x] JWT auth with email verification
- [x] Worker profile: skills, languages, availability calendar
- [x] Miami Verified badge + Top Worker auto-badge (≥ 4.8 stars)
- [x] Business profile with zone + Stripe customer
- [x] Shift CRUD with role, zone, pay rate, language requirement
- [x] Application flow: apply → accept/reject → confirm
- [x] Stripe payment intent (business pays upfront)
- [x] 15% platform commission auto-split
- [x] Stripe Connect onboarding for workers
- [x] Instant Pay (Stripe payout within 30 min)
- [x] Mutual rating system (worker ↔ business)
- [x] Admin dashboard: stats, user management, shift completion
- [x] Bilingual email notifications (SendGrid)
- [x] Mobile-first responsive design
- [x] Rate limiting, Helmet, CORS, input validation
- [x] GitHub Actions CI/CD → Railway deployment

---

Built for Miami's Latino hospitality community 🌴🇨🇺🇵🇷🇲🇽

# ShiftMIA — Railway Deployment Guide

## Voraussetzungen

- [Railway Account](https://railway.app) (kostenlos)
- [Stripe Account](https://stripe.com) (kostenlos zum Testen)
- [SendGrid Account](https://sendgrid.com) (100 E-Mails/Tag kostenlos)
- Optional: [Cloudinary Account](https://cloudinary.com) für Foto-Uploads in Produktion

---

## Schritt 1 — Projekt in Railway erstellen

```bash
# Railway CLI installieren
npm install -g @railway/cli

# Login
railway login

# Neues Projekt anlegen (oder im Dashboard)
railway init
```

---

## Schritt 2 — PostgreSQL einrichten

1. Im Railway Dashboard → **New Service** → **Database** → **PostgreSQL**
2. Railway setzt `DATABASE_URL` automatisch als env var
3. Datenbank migrieren:

```bash
# Lokal mit der Railway-DB verbinden
railway run --service shiftmia-api npm run db:migrate
railway run --service shiftmia-api npm run db:seed
```

---

## Schritt 3 — Umgebungsvariablen setzen

### API Service (server/)

```bash
railway variables set --service shiftmia-api \
  NODE_ENV=production \
  JWT_SECRET=<min_32_zeichen_geheimnis> \
  JWT_EXPIRES_IN=7d \
  STRIPE_SECRET_KEY=sk_live_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  PLATFORM_FEE_PERCENT=15 \
  SENDGRID_API_KEY=SG.xxx \
  EMAIL_FROM=noreply@shiftmia.com \
  CLIENT_URL=https://shiftmia-web.up.railway.app \
  CLOUDINARY_URL=cloudinary://key:secret@cloud
```

### Web Service (client/)

```bash
railway variables set --service shiftmia-web \
  REACT_APP_API_URL=https://shiftmia-api.up.railway.app/api \
  REACT_APP_STRIPE_PK=pk_live_...
```

---

## Schritt 4 — Stripe Webhook konfigurieren

1. Gehe zu [stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. **Add endpoint** → URL: `https://shiftmia-api.up.railway.app/api/payments/webhook`
3. Events auswählen:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated` (für Connect)
4. Signing Secret kopieren → als `STRIPE_WEBHOOK_SECRET` setzen

**Webhook lokal testen:**
```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
# Kopiere den whsec_... in server/.env
```

---

## Schritt 5 — Deployen

```bash
# Ersten Deploy
railway up

# Oder via GitHub Actions (automatisch bei Push auf main)
# Secrets im GitHub Repo setzen:
# - RAILWAY_TOKEN (von railway.app/account/tokens)
# - REACT_APP_STRIPE_PK
# - REACT_APP_API_URL
```

---

## Schritt 6 — Domain konfigurieren

1. Railway Dashboard → Service → **Settings** → **Domains**
2. Eigene Domain hinzufügen oder die generierte `*.up.railway.app` nutzen
3. CORS in `server/.env` aktualisieren: `CLIENT_URL=https://deine-domain.com`

---

## Schritt 7 — Stripe Live-Modus aktivieren

1. Stripe Dashboard → **Live-Modus** einschalten
2. Neue Live-Keys (`sk_live_...`, `pk_live_...`) in Railway setzen
3. Live-Webhook-Endpoint erstellen (Schritt 4 wiederholen)
4. Stripe Connect: Business-Typ und Kategorien für Live-Modus bestätigen

---

## Cloudinary (Foto-Uploads in Produktion)

```bash
# cloudinary Package installieren (einmalig)
cd server && npm install cloudinary

# Cloudinary URL aus dem Dashboard kopieren:
# Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
railway variables set --service shiftmia-api \
  CLOUDINARY_URL=cloudinary://123456:abcdef@mycloud
```

---

## Health-Check

```bash
# API läuft?
curl https://shiftmia-api.up.railway.app/health
# → { "status": "ok", "env": "production" }

# Datenbank verbunden?
curl https://shiftmia-api.up.railway.app/api/shifts
# → { "shifts": [...], "total": N }
```

---

## Kosten (Railway)

| Plan     | Preis        | Empfehlung          |
|----------|-------------|---------------------|
| Hobby    | $5/Monat    | Dev / Beta          |
| Pro      | $20/Monat   | Production          |
| PostgreSQL | ~$5-15/Mo  | Je nach Größe       |

**Stripe-Gebühren:** 2.9% + 30¢ pro Transaktion (Standard US)  
**Platform-Cut:** 15% → ShiftMIA behält 15% jedes Shift-Payments

---

## Nützliche Commands

```bash
railway logs --service shiftmia-api     # Server-Logs live
railway shell --service shiftmia-api    # Shell in Container
railway connect postgres                 # direkt in DB verbinden
railway status                          # Deployment-Status
```

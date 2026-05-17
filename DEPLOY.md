# ZEAL â€” Railway Deployment Guide

## Voraussetzungen

- [Railway Account](https://railway.app) (kostenlos)
- [Stripe Account](https://stripe.com) (kostenlos zum Testen)
- [SendGrid Account](https://sendgrid.com) (100 E-Mails/Tag kostenlos)
- Optional: [Cloudinary Account](https://cloudinary.com) fÃ¼r Foto-Uploads in Produktion

---

## Schritt 1 â€” Projekt in Railway erstellen

```bash
# Railway CLI installieren
npm install -g @railway/cli

# Login
railway login

# Neues Projekt anlegen (oder im Dashboard)
railway init
```

---

## Schritt 2 â€” PostgreSQL einrichten

1. Im Railway Dashboard â†’ **New Service** â†’ **Database** â†’ **PostgreSQL**
2. Railway setzt `DATABASE_URL` automatisch als env var
3. Datenbank migrieren:

```bash
# Lokal mit der Railway-DB verbinden
railway run --service zeal-api npm run db:migrate
railway run --service zeal-api npm run db:seed
```

---

## Schritt 3 â€” Umgebungsvariablen setzen

### API Service (server/)

```bash
railway variables set --service zeal-api \
  NODE_ENV=production \
  JWT_SECRET=<min_32_zeichen_geheimnis> \
  JWT_EXPIRES_IN=7d \
  STRIPE_SECRET_KEY=sk_live_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  PLATFORM_FEE_PERCENT=15 \
  SENDGRID_API_KEY=SG.xxx \
  EMAIL_FROM=noreply@zeal.com \
  CLIENT_URL=https://zeal-web.up.railway.app \
  CLOUDINARY_URL=cloudinary://key:secret@cloud
```

### Web Service (client/)

```bash
railway variables set --service zeal-web \
  REACT_APP_API_URL=https://zeal-api.up.railway.app/api \
  REACT_APP_STRIPE_PK=pk_live_...
```

---

## Schritt 4 â€” Stripe Webhook konfigurieren

1. Gehe zu [stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. **Add endpoint** â†’ URL: `https://zeal-api.up.railway.app/api/payments/webhook`
3. Events auswÃ¤hlen:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated` (fÃ¼r Connect)
4. Signing Secret kopieren â†’ als `STRIPE_WEBHOOK_SECRET` setzen

**Webhook lokal testen:**
```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
# Kopiere den whsec_... in server/.env
```

---

## Schritt 5 â€” Deployen

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

## Schritt 6 â€” Domain konfigurieren

1. Railway Dashboard â†’ Service â†’ **Settings** â†’ **Domains**
2. Eigene Domain hinzufÃ¼gen oder die generierte `*.up.railway.app` nutzen
3. CORS in `server/.env` aktualisieren: `CLIENT_URL=https://deine-domain.com`

---

## Schritt 7 â€” Stripe Live-Modus aktivieren

1. Stripe Dashboard â†’ **Live-Modus** einschalten
2. Neue Live-Keys (`sk_live_...`, `pk_live_...`) in Railway setzen
3. Live-Webhook-Endpoint erstellen (Schritt 4 wiederholen)
4. Stripe Connect: Business-Typ und Kategorien fÃ¼r Live-Modus bestÃ¤tigen

---

## Cloudinary (Foto-Uploads in Produktion)

```bash
# cloudinary Package installieren (einmalig)
cd server && npm install cloudinary

# Cloudinary URL aus dem Dashboard kopieren:
# Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
railway variables set --service zeal-api \
  CLOUDINARY_URL=cloudinary://123456:abcdef@mycloud
```

---

## Health-Check

```bash
# API lÃ¤uft?
curl https://zeal-api.up.railway.app/health
# â†’ { "status": "ok", "env": "production" }

# Datenbank verbunden?
curl https://zeal-api.up.railway.app/api/shifts
# â†’ { "shifts": [...], "total": N }
```

---

## Kosten (Railway)

| Plan     | Preis        | Empfehlung          |
|----------|-------------|---------------------|
| Hobby    | $5/Monat    | Dev / Beta          |
| Pro      | $20/Monat   | Production          |
| PostgreSQL | ~$5-15/Mo  | Je nach GrÃ¶ÃŸe       |

**Stripe-GebÃ¼hren:** 2.9% + 30Â¢ pro Transaktion (Standard US)  
**Platform-Cut:** 15% â†’ ZEAL behÃ¤lt 15% jedes Shift-Payments

---

## NÃ¼tzliche Commands

```bash
railway logs --service zeal-api     # Server-Logs live
railway shell --service zeal-api    # Shell in Container
railway connect postgres                 # direkt in DB verbinden
railway status                          # Deployment-Status
```

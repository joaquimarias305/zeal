-- ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
-- ZEAL --- PostgreSQL Schema
-- ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------- ENUMS ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

CREATE TYPE user_type AS ENUM ('worker', 'business', 'admin');
CREATE TYPE language_pref AS ENUM ('en', 'es', 'both');
CREATE TYPE shift_status AS ENUM ('draft', 'open', 'filled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'refunded');
CREATE TYPE worker_skill AS ENUM (
  'server', 'bartender', 'cook', 'dishwasher',
  'host', 'housekeeping', 'event_staff', 'barback',
  'busser', 'cashier', 'supervisor'
);
CREATE TYPE worker_language AS ENUM ('english', 'spanish', 'creole', 'portuguese');
CREATE TYPE miami_zone AS ENUM (
  'miami_beach', 'brickell', 'wynwood', 'doral',
  'coral_gables', 'downtown', 'little_havana',
  'hialeah', 'kendall', 'aventura', 'other'
);

-- --------- USERS ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            user_type NOT NULL,
  name            VARCHAR(120) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  phone           VARCHAR(20),
  language        language_pref NOT NULL DEFAULT 'en',
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  verify_token    TEXT,
  reset_token     TEXT,
  reset_expires   TIMESTAMPTZ,
  avatar_url      TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type  ON users(type);

-- --------- WORKER PROFILES ------------------------------------------------------------------------------------------------------------------------------------------------------------------------

CREATE TABLE worker_profiles (
  user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio                 TEXT,
  skills              worker_skill[] NOT NULL DEFAULT '{}',
  languages           worker_language[] NOT NULL DEFAULT '{english}',
  years_experience    SMALLINT DEFAULT 0,
  avg_rating          NUMERIC(3,2) DEFAULT 0.00,
  total_reviews       INTEGER DEFAULT 0,
  total_shifts        INTEGER DEFAULT 0,
  total_earnings      NUMERIC(12,2) DEFAULT 0.00,
  miami_verified      BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at         TIMESTAMPTZ,
  top_worker          BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_account_id   TEXT,
  stripe_onboarded    BOOLEAN NOT NULL DEFAULT FALSE,
  instant_pay_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------- WORKER AVAILABILITY ------------------------------------------------------------------------------------------------------------------------------------------------------------

CREATE TABLE worker_availability (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week SMALLINT, -- 0=Sun---6=Sat, NULL = specific date
  specific_date DATE,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_day_or_date CHECK (day_of_week IS NOT NULL OR specific_date IS NOT NULL)
);

CREATE INDEX idx_avail_worker ON worker_availability(worker_id);

-- --------- BUSINESS PROFILES ------------------------------------------------------------------------------------------------------------------------------------------------------------------

CREATE TABLE business_profiles (
  user_id            UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company_name       VARCHAR(150) NOT NULL,
  description        TEXT,
  industry           VARCHAR(80),
  zone               miami_zone NOT NULL DEFAULT 'other',
  address            TEXT,
  website            VARCHAR(255),
  logo_url           TEXT,
  avg_rating         NUMERIC(3,2) DEFAULT 0.00,
  total_reviews      INTEGER DEFAULT 0,
  total_shifts_posted INTEGER DEFAULT 0,
  verified           BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at        TIMESTAMPTZ,
  stripe_customer_id TEXT,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------- SHIFTS ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

CREATE TABLE shifts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role             worker_skill NOT NULL,
  title            VARCHAR(200),
  description      TEXT,
  zone             miami_zone NOT NULL DEFAULT 'other',
  address          TEXT NOT NULL,
  shift_date       DATE NOT NULL,
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  hours            NUMERIC(4,2) GENERATED ALWAYS AS (
                     EXTRACT(EPOCH FROM (end_time - start_time)) / 3600
                   ) STORED,
  pay_rate         NUMERIC(8,2) NOT NULL,
  workers_needed   SMALLINT NOT NULL DEFAULT 1,
  workers_confirmed SMALLINT NOT NULL DEFAULT 0,
  language_req     language_pref NOT NULL DEFAULT 'both',
  status           shift_status NOT NULL DEFAULT 'open',
  dress_code       VARCHAR(100),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shifts_business  ON shifts(business_id);
CREATE INDEX idx_shifts_status    ON shifts(status);
CREATE INDEX idx_shifts_date      ON shifts(shift_date);
CREATE INDEX idx_shifts_role      ON shifts(role);
CREATE INDEX idx_shifts_zone      ON shifts(zone);

-- --------- APPLICATIONS ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

CREATE TABLE applications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id    UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  worker_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status      application_status NOT NULL DEFAULT 'pending',
  message     TEXT,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shift_id, worker_id)
);

CREATE INDEX idx_apps_shift  ON applications(shift_id);
CREATE INDEX idx_apps_worker ON applications(worker_id);
CREATE INDEX idx_apps_status ON applications(status);

-- --------- PAYMENTS ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id            UUID NOT NULL REFERENCES shifts(id) ON DELETE RESTRICT,
  application_id      UUID REFERENCES applications(id) ON DELETE SET NULL,
  business_id         UUID NOT NULL REFERENCES users(id),
  worker_id           UUID NOT NULL REFERENCES users(id),
  gross_amount        NUMERIC(12,2) NOT NULL,  -- business pays this
  platform_fee        NUMERIC(12,2) NOT NULL,  -- 15%
  worker_amount       NUMERIC(12,2) NOT NULL,  -- 85%
  status              payment_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent TEXT,
  stripe_transfer_id    TEXT,
  instant_pay         BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_shift    ON payments(shift_id);
CREATE INDEX idx_payments_worker   ON payments(worker_id);
CREATE INDEX idx_payments_business ON payments(business_id);
CREATE INDEX idx_payments_status   ON payments(status);

-- --------- REVIEWS ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

CREATE TABLE reviews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id     UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  reviewer_id  UUID NOT NULL REFERENCES users(id),
  reviewee_id  UUID NOT NULL REFERENCES users(id),
  rating       SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shift_id, reviewer_id, reviewee_id)
);

CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_shift    ON reviews(shift_id);

-- --------- NOTIFICATIONS ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(60) NOT NULL,
  title_en   TEXT NOT NULL,
  title_es   TEXT NOT NULL,
  body_en    TEXT,
  body_es    TEXT,
  link       TEXT,
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user ON notifications(user_id, read);

-- --------- TRIGGERS --- updated_at ------------------------------------------------------------------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_worker_profiles_updated
  BEFORE UPDATE ON worker_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_business_profiles_updated
  BEFORE UPDATE ON business_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_shifts_updated
  BEFORE UPDATE ON shifts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_applications_updated
  BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_payments_updated
  BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- --------- TRIGGER --- auto-badge Top Worker ------------------------------------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION refresh_worker_badge()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE worker_profiles
  SET top_worker = (avg_rating >= 4.8 AND total_reviews >= 5)
  WHERE user_id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refresh_badge
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION refresh_worker_badge();

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- ZEAL â€“ Seed Data (development only)
-- Passwords are all: Test1234!
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- Admin user
INSERT INTO users (id, type, name, email, password_hash, language, email_verified) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin', 'Admin ZEAL',
   'admin@zeal.com',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewfr9UrFcBpG/6OK',
   'en', TRUE);

-- Sample business
INSERT INTO users (id, type, name, email, password_hash, language, email_verified) VALUES
  ('00000000-0000-0000-0000-000000000002', 'business', 'Ocean Drive Bistro',
   'bistro@zeal.com',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewfr9UrFcBpG/6OK',
   'en', TRUE);

INSERT INTO business_profiles (user_id, company_name, description, industry, zone, address, verified) VALUES
  ('00000000-0000-0000-0000-000000000002',
   'Ocean Drive Bistro',
   'Upscale seafood restaurant on Ocean Drive, South Beach.',
   'Restaurant',
   'miami_beach',
   '800 Ocean Drive, Miami Beach, FL 33139',
   TRUE);

-- Sample worker
INSERT INTO users (id, type, name, email, password_hash, language, email_verified) VALUES
  ('00000000-0000-0000-0000-000000000003', 'worker', 'Carlos Mendez',
   'carlos@zeal.com',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewfr9UrFcBpG/6OK',
   'es', TRUE);

INSERT INTO worker_profiles (user_id, bio, skills, languages, years_experience, avg_rating, total_reviews, miami_verified) VALUES
  ('00000000-0000-0000-0000-000000000003',
   'Experienced server and bartender with 5 years in Miami restaurants.',
   ARRAY['server','bartender']::worker_skill[],
   ARRAY['english','spanish']::worker_language[],
   5, 4.90, 23, TRUE);

-- Sample open shift
INSERT INTO shifts (id, business_id, role, title, zone, address, shift_date, start_time, end_time, pay_rate, workers_needed, language_req, status) VALUES
  ('00000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0000-000000000002',
   'server',
   'Weekend Brunch Service',
   'miami_beach',
   '800 Ocean Drive, Miami Beach, FL 33139',
   CURRENT_DATE + INTERVAL '3 days',
   '10:00', '16:00',
   18.00, 2, 'both', 'open');

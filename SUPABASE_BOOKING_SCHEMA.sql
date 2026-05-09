-- ============================================================
-- OMNIA BEAUTY — Sistema de Reservas (Booking System)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- DESPUÉS de ejecutar SUPABASE_SCHEMA.sql
-- ============================================================

-- Horario semanal del salón
CREATE TABLE IF NOT EXISTS availability_config (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week    SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_open        BOOLEAN NOT NULL DEFAULT true,
  open_time      TIME NOT NULL DEFAULT '09:00',
  close_time     TIME NOT NULL DEFAULT '20:00',
  slot_duration  SMALLINT NOT NULL DEFAULT 30,
  break_start    TIME,
  break_end      TIME,
  UNIQUE (day_of_week)
);

-- Días bloqueados (vacaciones, festivos)
CREATE TABLE IF NOT EXISTS blocked_dates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date         DATE NOT NULL,
  reason       TEXT,
  all_day      BOOLEAN NOT NULL DEFAULT true,
  block_start  TIME,
  block_end    TIME
);

-- Sesiones de conversación WhatsApp activas
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         TEXT NOT NULL UNIQUE,
  step          TEXT NOT NULL DEFAULT 'WELCOME',
  client_name   TEXT,
  service_id    UUID REFERENCES services(id),
  selected_date DATE,
  selected_time TEXT,
  expires_at    TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 minutes',
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Solicitudes de reserva (WhatsApp + QR web)
CREATE TABLE IF NOT EXISTS booking_requests (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel              TEXT NOT NULL DEFAULT 'qr_web'
                         CHECK (channel IN ('whatsapp','qr_web')),
  client_name          TEXT NOT NULL,
  phone                TEXT NOT NULL,
  email                TEXT,
  service_id           UUID REFERENCES services(id),
  requested_date       DATE NOT NULL,
  requested_time       TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','accepted','rejected','cancelled')),
  appointment_id       UUID REFERENCES appointments(id),
  reminder_sent        BOOLEAN NOT NULL DEFAULT false,
  reminder_sent_at     TIMESTAMPTZ,
  client_confirmed     BOOLEAN,
  client_confirmed_at  TIMESTAMPTZ,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON booking_requests(status);
CREATE INDEX IF NOT EXISTS idx_booking_requests_date   ON booking_requests(requested_date);

-- Materiales necesarios por servicio
CREATE TABLE IF NOT EXISTS service_materials (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id  UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  product     TEXT NOT NULL,
  quantity    NUMERIC,
  unit        TEXT,
  brand       TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Log mensajes WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_log (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone              TEXT NOT NULL,
  direction          TEXT CHECK (direction IN ('inbound','outbound')),
  message            TEXT,
  wa_message_id      TEXT,
  status             TEXT,
  booking_request_id UUID REFERENCES booking_requests(id),
  sent_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE availability_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_materials    ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_log         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all" ON availability_config FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON blocked_dates        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON whatsapp_sessions    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON booking_requests     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON service_materials    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON whatsapp_log         FOR ALL TO anon USING (true) WITH CHECK (true);

-- Horario por defecto
INSERT INTO availability_config (day_of_week, is_open, open_time, close_time, slot_duration, break_start, break_end) VALUES
  (0, false, '09:00', '20:00', 30, NULL, NULL),
  (1, true,  '09:00', '20:00', 30, '14:00', '16:00'),
  (2, true,  '09:00', '20:00', 30, '14:00', '16:00'),
  (3, true,  '09:00', '20:00', 30, '14:00', '16:00'),
  (4, true,  '09:00', '20:00', 30, '14:00', '16:00'),
  (5, true,  '09:00', '20:00', 30, '14:00', '16:00'),
  (6, true,  '09:00', '14:00', 30, NULL, NULL)
ON CONFLICT (day_of_week) DO NOTHING;

-- Materiales de ejemplo para los servicios
-- (ejecutar después de insertar los servicios en SUPABASE_SCHEMA.sql)
INSERT INTO service_materials (service_id, product, quantity, unit, brand)
SELECT s.id, m.product, m.quantity, m.unit, m.brand
FROM services s
JOIN (VALUES
  ('Limpieza Facial Profunda', 'Mascarilla hidratante',    30,  'ml',  'Ericson Laboratoire'),
  ('Limpieza Facial Profunda', 'Exfoliante enzimático',    20,  'gr',  NULL),
  ('Limpieza Facial Profunda', 'Sérum vitamina C',          5,  'ml',  NULL),
  ('Limpieza Facial Profunda', 'Tónico calmante',          10,  'ml',  NULL),
  ('Tratamiento Antiedad',     'Ampolla retinol',           2,  'ud',  NULL),
  ('Tratamiento Antiedad',     'Crema tensor',             15,  'ml',  NULL),
  ('Tratamiento Antiedad',     'Contorno de ojos',          5,  'ml',  NULL),
  ('Manicura Semipermanente',  'Base coat',                 1,  'ud',  NULL),
  ('Manicura Semipermanente',  'Top coat',                  1,  'ud',  NULL),
  ('Manicura Semipermanente',  'Acetona',                  20,  'ml',  NULL),
  ('Pedicura Spa',             'Sal de baño',              50,  'gr',  NULL),
  ('Pedicura Spa',             'Crema pies',               20,  'ml',  NULL),
  ('Masaje Relajante',         'Aceite almendras dulces', 100,  'ml',  NULL),
  ('Masaje Relajante',         'Crema corporal',           50,  'gr',  NULL),
  ('Hidratación Corporal',     'Envoltura nutritiva',       1,  'aplicación', NULL),
  ('Hidratación Corporal',     'Aceite esencial',          10,  'ml',  NULL)
) AS m(service_name, product, quantity, unit, brand)
ON s.name = m.service_name
ON CONFLICT DO NOTHING;

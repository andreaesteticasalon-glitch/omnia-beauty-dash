-- ============================================================
-- OMNIA BEAUTY DASH — Schema Supabase
-- Ejecutar completo en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Extensión UUID (ya activa en Supabase, por si acaso)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- TABLA: clients
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  phone           TEXT,
  email           TEXT,
  notes           TEXT,
  preferences     TEXT,
  loyalty_points  INTEGER NOT NULL DEFAULT 0,
  loyalty_tier    TEXT NOT NULL DEFAULT 'bronze'
                    CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- TABLA: services
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  price       NUMERIC(10, 2) NOT NULL,
  duration    INTEGER NOT NULL,          -- duración en minutos
  description TEXT,
  category    TEXT,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- TABLA: appointments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id  UUID REFERENCES services(id) ON DELETE SET NULL,
  date        DATE NOT NULL,
  time        TEXT NOT NULL,             -- formato HH:MM
  price       NUMERIC(10, 2) NOT NULL,
  notes       TEXT,
  photo_url   TEXT,
  status      TEXT NOT NULL DEFAULT 'scheduled'
                CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_appointments_date       ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id  ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status     ON appointments(status);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY — acceso anon total (sin auth por ahora)
-- ------------------------------------------------------------
ALTER TABLE clients      ENABLE ROW LEVEL SECURITY;
ALTER TABLE services     ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Clientes
CREATE POLICY "anon_all_clients"
  ON clients FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- Servicios
CREATE POLICY "anon_all_services"
  ON services FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- Citas
CREATE POLICY "anon_all_appointments"
  ON appointments FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- STORAGE BUCKET — fotos de citas (opcional)
-- Ejecutar por separado desde Supabase Storage si se necesita
-- ------------------------------------------------------------
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('appointment-photos', 'appointment-photos', true)
-- ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- DATOS DE MUESTRA (opcional — eliminar en producción)
-- ------------------------------------------------------------

-- Servicios de ejemplo
INSERT INTO services (name, price, duration, category, description) VALUES
  ('Limpieza Facial Profunda',    45,  60,  'Facial',            'Limpieza completa con extracción'),
  ('Tratamiento Antiedad',        75,  90,  'Facial',            'Tratamiento rejuvenecedor premium'),
  ('Manicura Semipermanente',     25,  45,  'Uñas',              'Esmalte de larga duración'),
  ('Pedicura Spa',                35,  60,  'Uñas',              'Tratamiento completo de pies'),
  ('Masaje Relajante',            50,  60,  'Masajes',           'Masaje corporal completo'),
  ('Depilación Láser Axilas',     40,  30,  'Depilación',        'Tecnología láser diodo'),
  ('Micropigmentación Cejas',    150, 120,  'Micropigmentación', 'Diseño personalizado'),
  ('Hidratación Corporal',        55,  75,  'Corporal',          'Envolvimiento nutritivo')
ON CONFLICT DO NOTHING;

-- Clientes de ejemplo
INSERT INTO clients (name, phone, email, preferences, loyalty_points, loyalty_tier, created_at) VALUES
  ('María García',   '+34 612 345 678', 'maria@email.com',   'Prefiere citas por la mañana', 45,  'bronze', '2024-01-15'),
  ('Laura Martínez', '+34 623 456 789', 'laura@email.com',   'Alérgica a ciertos productos',  120, 'silver', '2024-02-20'),
  ('Carmen López',   '+34 634 567 890', 'carmen@email.com',  'Cliente VIP',                    350, 'gold',   '2024-03-10'),
  ('Ana Fernández',  '+34 645 678 901', 'ana@email.com',     NULL,                             80,  'bronze', '2024-04-05'),
  ('Isabel Ruiz',    '+34 656 789 012', 'isabel@email.com',  'Solo productos naturales',        0,  'bronze', '2024-05-12')
ON CONFLICT DO NOTHING;

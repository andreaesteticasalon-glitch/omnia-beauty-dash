-- ============================================================
-- OMNIA BEAUTY — Módulo Caja + Proveedores
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Registro de cobros / pagos
CREATE TABLE IF NOT EXISTS payment_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID REFERENCES clients(id) ON DELETE SET NULL,
  appointment_id   UUID REFERENCES appointments(id) ON DELETE SET NULL,
  service_id       UUID REFERENCES services(id) ON DELETE SET NULL,
  client_name      TEXT NOT NULL,
  service_name     TEXT NOT NULL,
  amount           NUMERIC(10,2) NOT NULL,
  payment_method   TEXT NOT NULL DEFAULT 'efectivo'
                     CHECK (payment_method IN ('efectivo','tarjeta','bizum','transferencia')),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_created ON payment_records(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_method  ON payment_records(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_client  ON payment_records(client_id);

-- Proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa          TEXT NOT NULL,
  marca            TEXT,
  representante    TEXT,
  telefono         TEXT,
  email_empresa    TEXT,
  email_comercial  TEXT,
  direccion        TEXT,
  web              TEXT,
  notas            TEXT,
  active           BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Catálogo de productos por proveedor
CREATE TABLE IF NOT EXISTS proveedor_productos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor_id   UUID NOT NULL REFERENCES proveedores(id) ON DELETE CASCADE,
  producto       TEXT NOT NULL,
  referencia     TEXT,
  categoria      TEXT,
  precio         NUMERIC(10,2),
  unidad         TEXT,
  descripcion    TEXT,
  activo         BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prod_proveedor ON proveedor_productos(proveedor_id);

-- RLS
ALTER TABLE payment_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores         ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedor_productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all" ON payment_records    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON proveedores         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON proveedor_productos FOR ALL TO anon USING (true) WITH CHECK (true);

-- Proveedores de ejemplo
INSERT INTO proveedores (empresa, marca, representante, telefono, email_empresa, email_comercial) VALUES
  ('Ericson Laboratoire ES', 'Ericson Laboratoire', 'María Soler',   '+34 912 345 678', 'info@ericson.es',   'msoler@ericson.es'),
  ('Distributex SL',         'Keenwell',            'Carlos Pérez',  '+34 923 456 789', 'info@distributex.es','cperez@distributex.es'),
  ('Beauty Pro Iberia',      'Germaine de Capuccini',NULL,            '+34 934 567 890', 'info@beautypro.es', NULL)
ON CONFLICT DO NOTHING;

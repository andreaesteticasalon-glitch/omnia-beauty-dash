-- ============================================================
-- EVIDENCIAS VISUALES + SEGUIMIENTO POST-TRATAMIENTO
-- Omnia Beauty Dash — Ejecutar en Supabase → SQL Editor
-- ============================================================

-- 1. Galería de evidencias visuales por cliente y cita
CREATE TABLE IF NOT EXISTS client_evidencias (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
  service_id      UUID REFERENCES services(id) ON DELETE SET NULL,
  tipo            TEXT NOT NULL CHECK (tipo IN ('antes','despues','proceso','resultado')),
  tipo_media      TEXT NOT NULL DEFAULT 'foto' CHECK (tipo_media IN ('foto','video')),
  url             TEXT NOT NULL,
  tratamiento     TEXT,
  descripcion     TEXT,
  fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
  uso_marketing   BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE client_evidencias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_full_evidencias" ON client_evidencias;
CREATE POLICY "anon_full_evidencias"
  ON client_evidencias FOR ALL TO anon
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_evidencias_client ON client_evidencias (client_id);
CREATE INDEX IF NOT EXISTS idx_evidencias_apt    ON client_evidencias (appointment_id);
CREATE INDEX IF NOT EXISTS idx_evidencias_fecha  ON client_evidencias (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_evidencias_mkt    ON client_evidencias (uso_marketing) WHERE uso_marketing = true;

-- 2. Seguimiento post-tratamiento
CREATE TABLE IF NOT EXISTS seguimiento_post (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
  fecha_cita      DATE NOT NULL,
  fecha_objetivo  DATE NOT NULL,
  dias_post       INTEGER NOT NULL DEFAULT 7,
  estado          TEXT NOT NULL DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente','contactado','respondido','sin_respuesta','cerrado')),
  canal           TEXT CHECK (canal IN ('whatsapp','email','llamada','presencial')),
  satisfaccion    INTEGER CHECK (satisfaccion BETWEEN 1 AND 5),
  notas           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE seguimiento_post ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_full_seguimiento" ON seguimiento_post;
CREATE POLICY "anon_full_seguimiento"
  ON seguimiento_post FOR ALL TO anon
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_seg_client  ON seguimiento_post (client_id);
CREATE INDEX IF NOT EXISTS idx_seg_estado  ON seguimiento_post (estado, fecha_objetivo);
CREATE INDEX IF NOT EXISTS idx_seg_apt     ON seguimiento_post (appointment_id);

-- Storage bucket: crear manualmente en Supabase → Storage:
--   Nombre: client-evidencias
--   Acceso: público (Public bucket)

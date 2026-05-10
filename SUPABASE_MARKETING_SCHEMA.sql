-- ============================================================
-- MÓDULO MARKETING INTELIGENTE — Omnia Beauty Dash
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- 1. Conexiones a plataformas sociales
CREATE TABLE IF NOT EXISTS marketing_conexiones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plataforma    TEXT NOT NULL UNIQUE
                CHECK (plataforma IN ('instagram','facebook','whatsapp','tiktok','x','web')),
  nombre_cuenta TEXT,
  page_id       TEXT,
  token         TEXT,
  activa        BOOLEAN NOT NULL DEFAULT false,
  config        JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Planes de marketing (cabecera editorial)
CREATE TABLE IF NOT EXISTS marketing_planes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        TEXT NOT NULL,
  fecha_inicio  DATE NOT NULL,
  fecha_fin     DATE NOT NULL,
  estado        TEXT NOT NULL DEFAULT 'borrador'
                CHECK (estado IN ('borrador','confirmado','activo','completado','archivado')),
  resumen_datos JSONB,
  objetivos     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Publicaciones individuales
CREATE TABLE IF NOT EXISTS marketing_publicaciones (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id           UUID NOT NULL REFERENCES marketing_planes(id) ON DELETE CASCADE,
  plataforma        TEXT NOT NULL
                    CHECK (plataforma IN ('instagram','facebook','whatsapp','tiktok','x','web','todos')),
  fecha_publicacion DATE NOT NULL,
  hora_publicacion  TIME NOT NULL,
  tipo_contenido    TEXT NOT NULL
                    CHECK (tipo_contenido IN ('foto','video','carrusel','story','reels','texto','oferta')),
  titulo            TEXT,
  texto_publicacion TEXT NOT NULL,
  hashtags          TEXT,
  evidencia_id      UUID REFERENCES client_evidencias(id) ON DELETE SET NULL,
  url_imagen_custom TEXT,
  servicio_id       UUID REFERENCES services(id) ON DELETE SET NULL,
  oferta_descripcion TEXT,
  estado            TEXT NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente','notificada','confirmada','publicada','omitida')),
  confirmada_at     TIMESTAMPTZ,
  notas_andrea      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Notificaciones programadas
CREATE TABLE IF NOT EXISTS marketing_notificaciones (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publicacion_id UUID NOT NULL REFERENCES marketing_publicaciones(id) ON DELETE CASCADE,
  tipo           TEXT NOT NULL
                 CHECK (tipo IN ('dia_antes','hora_antes','momento','recordatorio_30min')),
  fecha_envio    TIMESTAMPTZ NOT NULL,
  enviada        BOOLEAN NOT NULL DEFAULT false,
  leida          BOOLEAN NOT NULL DEFAULT false,
  confirmada     BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Snapshots de análisis
CREATE TABLE IF NOT EXISTS marketing_analisis (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_analisis  DATE NOT NULL,
  periodo_dias    INTEGER NOT NULL DEFAULT 30,
  datos           JSONB NOT NULL,
  recomendaciones JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE marketing_conexiones    ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_planes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_publicaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_analisis      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_mkt_conexiones"    ON marketing_conexiones;
DROP POLICY IF EXISTS "anon_mkt_planes"        ON marketing_planes;
DROP POLICY IF EXISTS "anon_mkt_publicaciones" ON marketing_publicaciones;
DROP POLICY IF EXISTS "anon_mkt_notificaciones" ON marketing_notificaciones;
DROP POLICY IF EXISTS "anon_mkt_analisis"      ON marketing_analisis;

CREATE POLICY "anon_mkt_conexiones"    ON marketing_conexiones    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_mkt_planes"        ON marketing_planes        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_mkt_publicaciones" ON marketing_publicaciones FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_mkt_notificaciones" ON marketing_notificaciones FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_mkt_analisis"      ON marketing_analisis      FOR ALL TO anon USING (true) WITH CHECK (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_mkt_pub_plan    ON marketing_publicaciones (plan_id, fecha_publicacion);
CREATE INDEX IF NOT EXISTS idx_mkt_pub_estado  ON marketing_publicaciones (estado);
CREATE INDEX IF NOT EXISTS idx_mkt_notif_envio ON marketing_notificaciones (fecha_envio) WHERE enviada = false;
CREATE INDEX IF NOT EXISTS idx_mkt_notif_pub   ON marketing_notificaciones (publicacion_id);

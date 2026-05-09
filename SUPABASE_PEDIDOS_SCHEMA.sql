-- ============================================================
-- OMNIA BEAUTY — Fase 1: Módulo Pedidos + Stock
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- DESPUÉS de: SUPABASE_SCHEMA.sql + SUPABASE_CAJA_SCHEMA.sql
-- ============================================================

-- ------------------------------------------------------------
-- TABLA: pedidos
-- Cabecera de cada pedido realizado a un proveedor
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor_id           UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  numero_pedido          TEXT UNIQUE,         -- generado: 2026-001, 2026-002...
  estado                 TEXT NOT NULL DEFAULT 'borrador'
                           CHECK (estado IN ('borrador','enviado','parcial','completado','incidencia')),
  urgencia               TEXT NOT NULL DEFAULT 'normal'
                           CHECK (urgencia IN ('normal','urgente','muy_urgente')),
  metodo_envio           TEXT
                           CHECK (metodo_envio IN ('email','whatsapp','manual')),
  empresa_solicitante    TEXT NOT NULL DEFAULT 'AS Belleza y Bienestar',
  email_destino          TEXT,
  telefono_destino       TEXT,
  notas                  TEXT,
  coste_total_estimado   NUMERIC(10,2) DEFAULT 0,
  enviado_at             TIMESTAMPTZ,
  pdf_url                TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de uso frecuente
CREATE INDEX IF NOT EXISTS idx_pedidos_proveedor ON pedidos(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado    ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_created   ON pedidos(created_at);

-- Función para generar número de pedido correlativo por año
CREATE OR REPLACE FUNCTION generar_numero_pedido()
RETURNS TRIGGER AS $$
DECLARE
  anio TEXT;
  contador INTEGER;
BEGIN
  anio := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) + 1
    INTO contador
    FROM pedidos
   WHERE numero_pedido LIKE anio || '-%';
  NEW.numero_pedido := anio || '-' || LPAD(contador::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_numero_pedido
  BEFORE INSERT ON pedidos
  FOR EACH ROW
  WHEN (NEW.numero_pedido IS NULL)
  EXECUTE FUNCTION generar_numero_pedido();

-- ------------------------------------------------------------
-- TABLA: pedido_lineas
-- Una fila por producto dentro de un pedido
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedido_lineas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id        UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id      UUID REFERENCES proveedor_productos(id) ON DELETE SET NULL,
  nombre_producto  TEXT NOT NULL,     -- copia desnormalizada (historial)
  referencia       TEXT,              -- copia desnormalizada
  precio_unitario  NUMERIC(10,2),     -- precio al momento del pedido
  cantidad         NUMERIC(10,3) NOT NULL CHECK (cantidad > 0),
  unidad           TEXT,
  subtotal         NUMERIC(10,2)      -- calculado: cantidad × precio_unitario
                   GENERATED ALWAYS AS (
                     CASE WHEN precio_unitario IS NOT NULL
                          THEN ROUND(cantidad * precio_unitario, 2)
                          ELSE NULL
                     END
                   ) STORED,
  notas            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedido_lineas_pedido   ON pedido_lineas(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_lineas_producto ON pedido_lineas(producto_id);

-- Trigger: actualiza coste_total_estimado en pedidos al insertar/borrar/actualizar líneas
CREATE OR REPLACE FUNCTION sync_coste_pedido()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pedidos
     SET coste_total_estimado = COALESCE(
           (SELECT SUM(subtotal) FROM pedido_lineas WHERE pedido_id = COALESCE(NEW.pedido_id, OLD.pedido_id)),
           0
         )
   WHERE id = COALESCE(NEW.pedido_id, OLD.pedido_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_sync_coste
  AFTER INSERT OR UPDATE OR DELETE ON pedido_lineas
  FOR EACH ROW
  EXECUTE FUNCTION sync_coste_pedido();

-- ------------------------------------------------------------
-- TABLA: stock_entradas
-- Registro de stock esperado/recibido, originado por pedidos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_entradas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id         UUID REFERENCES pedidos(id) ON DELETE SET NULL,
  pedido_linea_id   UUID REFERENCES pedido_lineas(id) ON DELETE SET NULL,
  proveedor_id      UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  producto_nombre   TEXT NOT NULL,
  referencia        TEXT,
  cantidad_pedida   NUMERIC(10,3),
  cantidad_recibida NUMERIC(10,3),        -- null hasta confirmar recepción
  unidad            TEXT,
  precio_unitario   NUMERIC(10,2),
  estado            TEXT NOT NULL DEFAULT 'pendiente'
                      CHECK (estado IN ('pendiente','recibido','incidencia')),
  notas_incidencia  TEXT,
  fecha_esperada    DATE,
  fecha_recibida    DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_estado     ON stock_entradas(estado);
CREATE INDEX IF NOT EXISTS idx_stock_pedido     ON stock_entradas(pedido_id);
CREATE INDEX IF NOT EXISTS idx_stock_proveedor  ON stock_entradas(proveedor_id);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------
ALTER TABLE pedidos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_lineas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_entradas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all" ON pedidos        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON pedido_lineas  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON stock_entradas FOR ALL TO anon USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- VERIFICACIÓN FINAL
-- Ejecuta esto después del schema para confirmar que todo existe
-- ------------------------------------------------------------
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_name = t.table_name AND table_schema = 'public') AS columnas
FROM (VALUES ('pedidos'), ('pedido_lineas'), ('stock_entradas')) AS t(table_name)
ORDER BY table_name;
-- Resultado esperado: 3 filas, pedido_lineas=11, pedidos=14, stock_entradas=14

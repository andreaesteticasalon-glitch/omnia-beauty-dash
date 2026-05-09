-- ============================================================
-- INVENTARIO / STOCK — Omnia Beauty Dash
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- 1. Tabla maestra de productos en inventario
CREATE TABLE IF NOT EXISTS inventario_productos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          TEXT NOT NULL,
  referencia      TEXT,
  categoria       TEXT CHECK (categoria IN ('tinte','cosmético','consumible','herramienta','limpieza','otro')),
  proveedor_id    UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  unidad          TEXT NOT NULL DEFAULT 'ud',
  precio_coste    NUMERIC(10,2),
  stock_actual    NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_minimo    NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_optimo    NUMERIC(10,2),
  activo          BOOLEAN NOT NULL DEFAULT true,
  notas           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE inventario_productos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_full_inventario_productos" ON inventario_productos;
CREATE POLICY "anon_full_inventario_productos"
  ON inventario_productos FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- 2. Movimientos de stock (trazabilidad completa)
CREATE TABLE IF NOT EXISTS inventario_movimientos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id     UUID NOT NULL REFERENCES inventario_productos(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL CHECK (tipo IN ('entrada','salida','ajuste','merma')),
  cantidad        NUMERIC(10,2) NOT NULL,
  stock_antes     NUMERIC(10,2) NOT NULL,
  stock_despues   NUMERIC(10,2) NOT NULL,
  motivo          TEXT,
  referencia_id   TEXT,
  referencia_tipo TEXT,
  notas           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE inventario_movimientos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_full_inventario_movimientos" ON inventario_movimientos;
CREATE POLICY "anon_full_inventario_movimientos"
  ON inventario_movimientos FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- 3. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_inv_mov_producto  ON inventario_movimientos (producto_id);
CREATE INDEX IF NOT EXISTS idx_inv_mov_created   ON inventario_movimientos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inv_prod_activo   ON inventario_productos (activo);
CREATE INDEX IF NOT EXISTS idx_inv_prod_prov     ON inventario_productos (proveedor_id);

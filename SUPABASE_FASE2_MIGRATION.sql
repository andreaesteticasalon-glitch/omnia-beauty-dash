-- ============================================================
-- OMNIA BEAUTY — Fase 2: Migración mínima
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Añade campo para URL del catálogo PDF del proveedor
ALTER TABLE proveedores
  ADD COLUMN IF NOT EXISTS catalogo_pdf_url TEXT;

-- Verificación
SELECT column_name, data_type
  FROM information_schema.columns
 WHERE table_name = 'proveedores'
   AND column_name = 'catalogo_pdf_url';
-- Resultado esperado: 1 fila → catalogo_pdf_url | text

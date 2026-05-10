import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProveedorRow, ProveedorProductoRow } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export function useProveedores() {
  return useQuery({
    queryKey: ['proveedores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proveedores')
        .select('*')
        .eq('active', true)
        .order('empresa');
      if (error) throw error;
      return data as ProveedorRow[];
    },
  });
}

export function useAddProveedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Omit<ProveedorRow, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('proveedores').insert(p);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['proveedores'] }); toast.success('Proveedor añadido'); },
    onError:   () => toast.error('Error al añadir proveedor'),
  });
}

export function useUpdateProveedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ProveedorRow> }) => {
      const { error } = await supabase.from('proveedores').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['proveedores'] }); toast.success('Proveedor actualizado'); },
    onError:   () => toast.error('Error al actualizar proveedor'),
  });
}

export function useDeleteProveedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('proveedores').update({ active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['proveedores'] }); toast.success('Proveedor eliminado'); },
    onError:   () => toast.error('Error al eliminar proveedor'),
  });
}

export function useProveedorProductos(proveedorId?: string) {
  return useQuery({
    queryKey: ['proveedor-productos', proveedorId ?? 'all'],
    queryFn: async () => {
      let q = supabase.from('proveedor_productos').select('*').eq('activo', true).order('producto');
      if (proveedorId) q = q.eq('proveedor_id', proveedorId);
      const { data, error } = await q;
      if (error) throw error;
      return data as ProveedorProductoRow[];
    },
  });
}

export function useAddProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Omit<ProveedorProductoRow, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('proveedor_productos').insert(p);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['proveedor-productos'] });
      qc.invalidateQueries({ queryKey: ['proveedor-productos', vars.proveedor_id] });
      toast.success('Producto añadido al catálogo');
    },
    onError: () => toast.error('Error al añadir producto'),
  });
}

export function useDeleteProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('proveedor_productos').update({ activo: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proveedor-productos'] });
      toast.success('Producto eliminado del catálogo');
    },
  });
}

// ── Fase 2: Importación masiva desde Excel/CSV ───────────────

export interface ProductoImport {
  producto: string;
  referencia?: string | null;
  categoria?: string | null;
  precio?: number | null;
  unidad?: string | null;
  descripcion?: string | null;
}

export function useImportProductos(proveedorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: ProductoImport[]) => {
      if (rows.length === 0) throw new Error('No hay filas para importar');
      const inserts = rows
        .filter(r => r.producto?.trim())
        .map(r => ({
          proveedor_id: proveedorId,
          producto:    r.producto.trim(),
          referencia:  r.referencia?.trim() || null,
          categoria:   r.categoria?.trim()  || null,
          precio:      r.precio ?? null,
          unidad:      r.unidad?.trim()     || null,
          descripcion: r.descripcion?.trim()|| null,
          activo: true,
        }));
      if (inserts.length === 0) throw new Error('Ninguna fila tiene nombre de producto');
      const { error } = await supabase.from('proveedor_productos').insert(inserts);
      if (error) throw error;
      return inserts.length;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ['proveedor-productos'] });
      qc.invalidateQueries({ queryKey: ['proveedor-productos', proveedorId] });
      toast.success(`${count} producto${count !== 1 ? 's' : ''} importado${count !== 1 ? 's' : ''} correctamente`);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Error al importar'),
  });
}

// ── Fase 2: Subida de catálogo PDF ───────────────────────────

export function useUploadCatalogoPDF(proveedorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const ext  = file.name.split('.').pop() ?? 'pdf';
      const path = `${proveedorId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('catalogo-pdf')
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('catalogo-pdf')
        .getPublicUrl(path);

      const { error: updateErr } = await supabase
        .from('proveedores')
        .update({ catalogo_pdf_url: publicUrl })
        .eq('id', proveedorId);
      if (updateErr) throw updateErr;

      return publicUrl;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proveedores'] });
      toast.success('Catálogo PDF subido correctamente');
    },
    onError: () => toast.error('Error al subir el PDF. Verifica que el bucket "catalogo-pdf" existe en Supabase Storage'),
  });
}

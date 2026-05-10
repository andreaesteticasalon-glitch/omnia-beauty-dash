import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  InventarioProductoRow, InventarioMovimientoRow,
  CategoriaProducto, TipoMovimiento,
} from '@/integrations/supabase/types';
import { toast } from 'sonner';

// ── Tipos públicos ──────────────────────────────────────────

export type ProductoConProveedor = InventarioProductoRow & {
  proveedores: { empresa: string } | null;
};

export interface MovimientoConProducto extends InventarioMovimientoRow {
  inventario_productos: { nombre: string; unidad: string } | null;
}

export interface CreateProductoPayload {
  nombre:       string;
  referencia:   string | null;
  categoria:    CategoriaProducto | null;
  proveedor_id: string | null;
  unidad:       string;
  precio_coste: number | null;
  stock_actual: number;
  stock_minimo: number;
  stock_optimo: number | null;
  notas:        string | null;
}

export interface RegistrarMovimientoPayload {
  producto_id:     string;
  tipo:            TipoMovimiento;
  cantidad:        number;
  motivo?:         string | null;
  referencia_id?:  string | null;
  referencia_tipo?: string | null;
  notas?:          string | null;
}

// ── Queries ─────────────────────────────────────────────────

export function useProductos(search?: string, categoria?: string) {
  return useQuery({
    queryKey: ['inventario-productos', search ?? '', categoria ?? ''],
    queryFn: async () => {
      let q = supabase
        .from('inventario_productos')
        .select('*, proveedores(empresa)')
        .eq('activo', true)
        .order('nombre');
      if (categoria) q = q.eq('categoria', categoria);
      if (search)    q = q.ilike('nombre', `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as ProductoConProveedor[];
    },
  });
}

export function useMovimientos(productoId?: string, limit = 50) {
  return useQuery({
    queryKey: ['inventario-movimientos', productoId ?? 'all', limit],
    queryFn: async () => {
      let q = supabase
        .from('inventario_movimientos')
        .select('*, inventario_productos(nombre, unidad)')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (productoId) q = q.eq('producto_id', productoId);
      const { data, error } = await q;
      if (error) throw error;
      return data as MovimientoConProducto[];
    },
  });
}

export function useKPIsInventario() {
  return useQuery({
    queryKey: ['inventario-kpis'],
    queryFn: async () => {
      const hoy = new Date().toISOString().slice(0, 10);

      const [{ data: prods }, { data: movHoy }] = await Promise.all([
        supabase.from('inventario_productos').select('stock_actual, stock_minimo, precio_coste').eq('activo', true),
        supabase.from('inventario_movimientos').select('id').gte('created_at', hoy + 'T00:00:00Z'),
      ]);

      const productos   = prods ?? [];
      const total       = productos.length;
      const alertas     = productos.filter(p => p.stock_actual <= p.stock_minimo).length;
      const valorStock  = productos.reduce((s, p) =>
        s + (p.precio_coste != null ? p.precio_coste * p.stock_actual : 0), 0);
      const movimientosHoy = movHoy?.length ?? 0;

      return { total, alertas, valorStock, movimientosHoy };
    },
    refetchInterval: 60_000,
  });
}

// ── Mutations ────────────────────────────────────────────────

export function useAddProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateProductoPayload) => {
      const { data, error } = await supabase
        .from('inventario_productos')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as InventarioProductoRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventario-productos'] });
      qc.invalidateQueries({ queryKey: ['inventario-kpis'] });
      toast.success('Producto añadido al inventario');
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : 'Error al añadir producto'),
  });
}

export function useUpdateProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<CreateProductoPayload> & { id: string }) => {
      const { error } = await supabase
        .from('inventario_productos')
        .update(patch)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventario-productos'] });
      qc.invalidateQueries({ queryKey: ['inventario-kpis'] });
      toast.success('Producto actualizado');
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : 'Error al actualizar producto'),
  });
}

export function useDeleteProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inventario_productos')
        .update({ activo: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventario-productos'] });
      qc.invalidateQueries({ queryKey: ['inventario-kpis'] });
      toast.success('Producto eliminado del inventario');
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : 'Error al eliminar producto'),
  });
}

// Registra un movimiento y actualiza el stock del producto atómicamente
export function useRegistrarMovimiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RegistrarMovimientoPayload) => {
      // 1. Leer stock actual
      const { data: prod, error: readErr } = await supabase
        .from('inventario_productos')
        .select('stock_actual')
        .eq('id', payload.producto_id)
        .single();
      if (readErr) throw readErr;

      const stockAntes = prod.stock_actual;
      let stockDespues: number;

      if (payload.tipo === 'entrada') {
        stockDespues = stockAntes + payload.cantidad;
      } else if (payload.tipo === 'salida' || payload.tipo === 'merma') {
        stockDespues = Math.max(0, stockAntes - payload.cantidad);
      } else {
        // ajuste: cantidad es el nuevo valor absoluto
        stockDespues = payload.cantidad;
      }

      // 2. Actualizar stock
      const { error: updErr } = await supabase
        .from('inventario_productos')
        .update({ stock_actual: stockDespues })
        .eq('id', payload.producto_id);
      if (updErr) throw updErr;

      // 3. Registrar movimiento
      const { error: movErr } = await supabase
        .from('inventario_movimientos')
        .insert({
          producto_id:     payload.producto_id,
          tipo:            payload.tipo,
          cantidad:        payload.cantidad,
          stock_antes:     stockAntes,
          stock_despues:   stockDespues,
          motivo:          payload.motivo ?? null,
          referencia_id:   payload.referencia_id ?? null,
          referencia_tipo: payload.referencia_tipo ?? null,
          notas:           payload.notas ?? null,
        });
      if (movErr) throw movErr;

      return { stockAntes, stockDespues };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventario-productos'] });
      qc.invalidateQueries({ queryKey: ['inventario-movimientos'] });
      qc.invalidateQueries({ queryKey: ['inventario-kpis'] });
      toast.success('Movimiento de stock registrado');
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : 'Error al registrar movimiento'),
  });
}

// Crea o actualiza un producto desde una stock_entrada recibida
export function useRegistrarDesdeEntrada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      nombre:          string;
      referencia:      string | null;
      proveedor_id:    string | null;
      cantidad:        number;
      unidad:          string | null;
      precio_unitario: number | null;
      stock_entrada_id: string;
    }) => {
      // Buscar si ya existe el producto (por nombre exacto, case-insensitive)
      const { data: existing } = await supabase
        .from('inventario_productos')
        .select('id, stock_actual')
        .ilike('nombre', params.nombre)
        .eq('activo', true)
        .maybeSingle();

      if (existing) {
        // Actualiza stock existente
        const stockAntes   = existing.stock_actual;
        const stockDespues = stockAntes + params.cantidad;
        await supabase.from('inventario_productos').update({ stock_actual: stockDespues }).eq('id', existing.id);
        await supabase.from('inventario_movimientos').insert({
          producto_id:     existing.id,
          tipo:            'entrada' as TipoMovimiento,
          cantidad:        params.cantidad,
          stock_antes:     stockAntes,
          stock_despues:   stockDespues,
          motivo:          'pedido_recibido',
          referencia_id:   params.stock_entrada_id,
          referencia_tipo: 'stock_entrada',
        });
      } else {
        // Crea producto nuevo
        const { data: newProd, error } = await supabase
          .from('inventario_productos')
          .insert({
            nombre:       params.nombre,
            referencia:   params.referencia,
            proveedor_id: params.proveedor_id,
            unidad:       params.unidad ?? 'ud',
            precio_coste: params.precio_unitario,
            stock_actual: params.cantidad,
            stock_minimo: 0,
          })
          .select()
          .single();
        if (error) throw error;
        await supabase.from('inventario_movimientos').insert({
          producto_id:     newProd.id,
          tipo:            'entrada' as TipoMovimiento,
          cantidad:        params.cantidad,
          stock_antes:     0,
          stock_despues:   params.cantidad,
          motivo:          'pedido_recibido',
          referencia_id:   params.stock_entrada_id,
          referencia_tipo: 'stock_entrada',
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventario-productos'] });
      qc.invalidateQueries({ queryKey: ['inventario-movimientos'] });
      qc.invalidateQueries({ queryKey: ['inventario-kpis'] });
      qc.invalidateQueries({ queryKey: ['stock-entradas'] });
      toast.success('Entrada registrada en inventario');
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : 'Error al registrar entrada'),
  });
}

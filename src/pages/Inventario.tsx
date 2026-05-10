import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Plus, Search, AlertTriangle, TrendingDown, TrendingUp,
  ArrowRightLeft, BarChart3, Edit2, Trash2, ChevronDown, ChevronUp,
  ShoppingCart, Boxes, Euro, Activity, X, Check,
} from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SmartSelect } from '@/components/SmartSelect';
import { useProveedores } from '@/hooks/useProveedores';
import { useStockEntradas } from '@/hooks/usePedidos';
import {
  useProductos, useMovimientos, useKPIsInventario,
  useAddProducto, useUpdateProducto, useDeleteProducto,
  useRegistrarMovimiento, useRegistrarDesdeEntrada,
  CreateProductoPayload, ProductoConProveedor,
} from '@/hooks/useInventario';
import { CategoriaProducto, TipoMovimiento } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

// ── Constantes ───────────────────────────────────────────────

const CATEGORIAS: { value: CategoriaProducto; label: string }[] = [
  { value: 'tinte',        label: 'Tinte / Color'   },
  { value: 'cosmético',    label: 'Cosmético'        },
  { value: 'consumible',   label: 'Consumible'       },
  { value: 'herramienta',  label: 'Herramienta'      },
  { value: 'limpieza',     label: 'Limpieza'         },
  { value: 'otro',         label: 'Otro'             },
];

const TIPOS_MOVIMIENTO: { value: TipoMovimiento; label: string; color: string }[] = [
  { value: 'entrada',  label: 'Entrada',         color: 'text-emerald-600' },
  { value: 'salida',   label: 'Salida / Uso',    color: 'text-rose-500'    },
  { value: 'ajuste',   label: 'Ajuste manual',   color: 'text-blue-500'    },
  { value: 'merma',    label: 'Merma / Pérdida', color: 'text-amber-500'   },
];

const FORM_EMPTY: CreateProductoPayload = {
  nombre: '', referencia: null, categoria: null, proveedor_id: null,
  unidad: 'ud', precio_coste: null, stock_actual: 0,
  stock_minimo: 0, stock_optimo: null, notas: null,
};

// ── Helpers ──────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const fmtEur = (n: number | null) => n != null ? `${n.toFixed(2)} €` : '—';

function stockStatus(actual: number, minimo: number) {
  if (actual <= 0)           return { label: 'Sin stock', color: 'bg-rose-500', text: 'text-rose-600', badge: 'destructive' as const };
  if (actual <= minimo)      return { label: 'Stock bajo', color: 'bg-amber-400', text: 'text-amber-600', badge: 'secondary' as const };
  return                            { label: 'OK',         color: 'bg-emerald-500', text: 'text-emerald-600', badge: 'secondary' as const };
}

// ── KPI Card ─────────────────────────────────────────────────

function KPI({ icon: Icon, label, value, sub, accent = false }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; accent?: boolean;
}) {
  return (
    <div className={cn(
      'flex items-center gap-3 p-4 rounded-2xl border',
      accent ? 'border-gold/40 bg-gradient-to-br from-gold/10 to-rosegold/5' : 'border-gold-light/20 bg-card',
    )}>
      <div className="h-10 w-10 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-gold" strokeWidth={1.5} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-lg font-serif font-semibold text-foreground leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

// ── ProductoCard ─────────────────────────────────────────────

function ProductoCard({
  producto,
  onEdit,
  onAjuste,
  onDelete,
}: {
  producto: ProductoConProveedor;
  onEdit: (p: ProductoConProveedor) => void;
  onAjuste: (p: ProductoConProveedor) => void;
  onDelete: (id: string) => void;
}) {
  const status = stockStatus(producto.stock_actual, producto.stock_minimo);
  const pct = producto.stock_optimo && producto.stock_optimo > 0
    ? Math.min(100, (producto.stock_actual / producto.stock_optimo) * 100)
    : producto.stock_minimo > 0
      ? Math.min(100, (producto.stock_actual / (producto.stock_minimo * 3)) * 100)
      : null;

  const catLabel = CATEGORIAS.find(c => c.value === producto.categoria)?.label;

  return (
    <div className="bg-card border border-gold-light/20 rounded-2xl p-4 space-y-3 hover:border-gold/30 transition-colors">
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground truncate text-sm">{producto.nombre}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {catLabel && (
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 border border-gold-light/30 text-gold-dark bg-gold/5">
                {catLabel}
              </Badge>
            )}
            {producto.referencia && (
              <span className="text-[10px] text-muted-foreground">Ref: {producto.referencia}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onAjuste(producto)}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-gold hover:bg-gold/10 transition-colors"
            title="Registrar movimiento"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onEdit(producto)}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-gold/5 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              if (confirm(`¿Eliminar "${producto.nombre}" del inventario?`)) onDelete(producto.id);
            }}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Stock */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Stock actual</span>
          <span className={cn('text-sm font-semibold', status.text)}>
            {producto.stock_actual} {producto.unidad}
          </span>
        </div>
        {pct !== null && (
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', status.color)}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Mínimo: {producto.stock_minimo} {producto.unidad}</span>
          {producto.precio_coste != null && (
            <span>Coste: {fmtEur(producto.precio_coste)}/{producto.unidad}</span>
          )}
        </div>
      </div>

      {/* Pie */}
      <div className="flex items-center justify-between pt-1 border-t border-gold-light/10">
        <span className={cn('text-[10px] font-medium', status.text)}>● {status.label}</span>
        {producto.proveedores && (
          <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
            {producto.proveedores.empresa}
          </span>
        )}
      </div>
    </div>
  );
}

// ── MovimientoFila ────────────────────────────────────────────

function MovimientoFila({ mov }: { mov: ReturnType<typeof useMovimientos>['data'] extends (infer T)[] | undefined ? T : never }) {
  if (!mov) return null;
  const tipo = TIPOS_MOVIMIENTO.find(t => t.value === mov.tipo);
  const isPositive = mov.tipo === 'entrada';
  const isAjuste   = mov.tipo === 'ajuste';

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gold-light/10 last:border-0">
      <div className={cn(
        'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
        isPositive ? 'bg-emerald-500/10' : isAjuste ? 'bg-blue-500/10' : 'bg-rose-500/10',
      )}>
        {isPositive
          ? <TrendingUp className="h-4 w-4 text-emerald-600" />
          : isAjuste
            ? <ArrowRightLeft className="h-4 w-4 text-blue-500" />
            : <TrendingDown className="h-4 w-4 text-rose-500" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">
          {(mov as { inventario_productos?: { nombre: string } | null }).inventario_productos?.nombre ?? '—'}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {tipo?.label} · {fmtDate(mov.created_at)}
          {mov.motivo && ` · ${mov.motivo}`}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className={cn('text-sm font-semibold', tipo?.color)}>
          {isPositive ? '+' : isAjuste ? '' : '−'}{Math.abs(mov.cantidad)}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {mov.stock_antes} → {mov.stock_despues}
        </p>
      </div>
    </div>
  );
}

// ── ProductoSheet ─────────────────────────────────────────────

function ProductoSheet({
  open, onClose, initial,
}: {
  open: boolean;
  onClose: () => void;
  initial: ProductoConProveedor | null;
}) {
  const { data: proveedores = [] } = useProveedores();
  const addProducto    = useAddProducto();
  const updateProducto = useUpdateProducto();

  const [form, setForm] = useState<CreateProductoPayload>(
    initial
      ? { nombre: initial.nombre, referencia: initial.referencia, categoria: initial.categoria,
          proveedor_id: initial.proveedor_id, unidad: initial.unidad, precio_coste: initial.precio_coste,
          stock_actual: initial.stock_actual, stock_minimo: initial.stock_minimo,
          stock_optimo: initial.stock_optimo, notas: initial.notas }
      : { ...FORM_EMPTY }
  );

  // Sync form when initial changes (open for edit)
  const setF = (k: keyof CreateProductoPayload, v: unknown) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    if (!form.nombre.trim()) return;
    if (initial) {
      await updateProducto.mutateAsync({ id: initial.id, ...form });
    } else {
      await addProducto.mutateAsync(form);
    }
    onClose();
  };

  const busy = addProducto.isPending || updateProducto.isPending;

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-card border-l border-gold-light/30">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-serif text-foreground">
            <Package className="h-5 w-5 text-gold" />
            {initial ? 'Editar producto' : 'Nuevo producto'}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-gold-dark">Nombre *</Label>
            <Input value={form.nombre} onChange={e => setF('nombre', e.target.value)} placeholder="Ej: Tinte Wella 7/0" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-gold-dark">Referencia</Label>
              <Input value={form.referencia ?? ''} onChange={e => setF('referencia', e.target.value || null)} placeholder="Ref. proveedor" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gold-dark">Unidad</Label>
              <Input value={form.unidad} onChange={e => setF('unidad', e.target.value)} placeholder="ud, ml, g, l…" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-gold-dark">Categoría</Label>
            <Select
              value={form.categoria ?? '_none'}
              onValueChange={v => setF('categoria', v === '_none' ? null : v as CategoriaProducto)}
            >
              <SelectTrigger className="border-gold-light/50 h-10">
                <SelectValue placeholder="Seleccionar categoría…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Sin categoría</SelectItem>
                {CATEGORIAS.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-gold-dark">Proveedor</Label>
            <SmartSelect
              value={form.proveedor_id ?? ''}
              onChange={v => setF('proveedor_id', v || null)}
              options={proveedores.map(p => ({ value: p.id, label: p.empresa, subtitle: p.marca ?? undefined }))}
              placeholder="Seleccionar proveedor…"
              createLabel="Añadir proveedor"
              onCreateNew={() => onClose()}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-gold-dark">Stock actual</Label>
              <Input type="number" min={0} step={0.01} value={form.stock_actual}
                onChange={e => setF('stock_actual', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gold-dark">Stock mínimo</Label>
              <Input type="number" min={0} step={0.01} value={form.stock_minimo}
                onChange={e => setF('stock_minimo', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gold-dark">Stock óptimo</Label>
              <Input type="number" min={0} step={0.01}
                value={form.stock_optimo ?? ''}
                onChange={e => setF('stock_optimo', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="—" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-gold-dark">Precio coste (€/{form.unidad})</Label>
            <Input type="number" min={0} step={0.01}
              value={form.precio_coste ?? ''}
              onChange={e => setF('precio_coste', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="0.00" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-gold-dark">Notas</Label>
            <Textarea value={form.notas ?? ''} onChange={e => setF('notas', e.target.value || null)}
              placeholder="Notas adicionales…" rows={2} className="rounded-xl border-gold-light/50" />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSubmit} disabled={busy || !form.nombre.trim()} variant="luxury" className="flex-1">
              <Check className="h-4 w-4 mr-2" />
              {initial ? 'Guardar cambios' : 'Añadir producto'}
            </Button>
            <Button variant="outline" onClick={onClose} className="border-gold-light/50">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── AjusteSheet ───────────────────────────────────────────────

function AjusteSheet({
  open, onClose, producto,
}: {
  open: boolean;
  onClose: () => void;
  producto: ProductoConProveedor | null;
}) {
  const registrar = useRegistrarMovimiento();
  const [tipo, setTipo]       = useState<TipoMovimiento>('entrada');
  const [cantidad, setCantidad] = useState('');
  const [notas, setNotas]     = useState('');

  if (!producto) return null;

  const handleSubmit = async () => {
    const qty = parseFloat(cantidad);
    if (!qty || qty <= 0) return;
    await registrar.mutateAsync({ producto_id: producto.id, tipo, cantidad: qty, notas: notas || null });
    setCantidad(''); setNotas(''); setTipo('entrada');
    onClose();
  };

  const tipoInfo = TIPOS_MOVIMIENTO.find(t => t.value === tipo);

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-sm bg-card border-l border-gold-light/30">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-serif text-foreground">
            <ArrowRightLeft className="h-5 w-5 text-gold" />
            Registrar movimiento
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Producto info */}
          <div className="bg-gold/5 rounded-xl p-3 border border-gold-light/20">
            <p className="text-sm font-medium text-foreground">{producto.nombre}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Stock actual: <span className="font-semibold text-foreground">{producto.stock_actual} {producto.unidad}</span>
              {' '}· Mínimo: {producto.stock_minimo} {producto.unidad}
            </p>
          </div>

          {/* Tipo de movimiento */}
          <div className="space-y-2">
            <Label className="text-xs text-gold-dark">Tipo de movimiento</Label>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS_MOVIMIENTO.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTipo(t.value)}
                  className={cn(
                    'p-3 rounded-xl border text-xs font-medium text-left transition-all',
                    tipo === t.value
                      ? 'border-gold/50 bg-gold/10 text-foreground'
                      : 'border-gold-light/20 text-muted-foreground hover:border-gold/30',
                  )}
                >
                  <span className={cn('block text-sm mb-0.5', t.color)}>
                    {t.value === 'entrada' ? '▲' : t.value === 'salida' ? '▼' : t.value === 'ajuste' ? '⇄' : '✕'}
                  </span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cantidad */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gold-dark">
              {tipo === 'ajuste' ? `Nuevo stock total (${producto.unidad})` : `Cantidad (${producto.unidad})`}
            </Label>
            <Input
              type="number" min={0} step={0.01}
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              placeholder={tipo === 'ajuste' ? `Nuevo valor absoluto` : `0`}
              className="text-lg font-semibold text-center"
              autoFocus
            />
            {tipo !== 'ajuste' && cantidad && !isNaN(parseFloat(cantidad)) && (
              <p className="text-xs text-center text-muted-foreground">
                Stock resultante:{' '}
                <span className={cn('font-semibold', tipoInfo?.color)}>
                  {tipo === 'entrada'
                    ? producto.stock_actual + parseFloat(cantidad)
                    : Math.max(0, producto.stock_actual - parseFloat(cantidad))
                  } {producto.unidad}
                </span>
              </p>
            )}
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gold-dark">Notas (opcional)</Label>
            <Textarea value={notas} onChange={e => setNotas(e.target.value)}
              placeholder="Motivo del movimiento…" rows={2} className="rounded-xl border-gold-light/50" />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              onClick={handleSubmit}
              disabled={registrar.isPending || !cantidad || parseFloat(cantidad) <= 0}
              variant="luxury" className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
            <Button variant="outline" onClick={onClose} className="border-gold-light/50">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Panel Entradas Pendientes ─────────────────────────────────

function EntradasPendientesPanel() {
  const { data: entradas = [], isLoading } = useStockEntradas('recibido');
  const registrarDesde = useRegistrarDesdeEntrada();
  const [expanded, setExpanded] = useState(false);

  if (isLoading || entradas.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-300/50 bg-amber-50/50 dark:bg-amber-500/5 dark:border-amber-400/20 p-4 space-y-3">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium text-foreground">
            {entradas.length} entrada{entradas.length !== 1 ? 's' : ''} de pedido pendiente{entradas.length !== 1 ? 's' : ''} de registrar
          </span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="space-y-2 pt-1">
          {entradas.map(entrada => (
            <div key={entrada.id} className="flex items-center justify-between gap-2 bg-card rounded-xl p-3 border border-gold-light/20">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{entrada.producto_nombre}</p>
                <p className="text-[10px] text-muted-foreground">
                  {entrada.cantidad_recibida ?? entrada.cantidad_pedida} {entrada.unidad ?? 'ud'} recibidas
                  {entrada.fecha_recibida && ` · ${entrada.fecha_recibida}`}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 border-gold/40 text-gold hover:bg-gold/10 text-xs h-8"
                disabled={registrarDesde.isPending}
                onClick={() => registrarDesde.mutate({
                  nombre:          entrada.producto_nombre,
                  referencia:      entrada.referencia,
                  proveedor_id:    entrada.proveedor_id,
                  cantidad:        entrada.cantidad_recibida ?? entrada.cantidad_pedida ?? 0,
                  unidad:          entrada.unidad,
                  precio_unitario: entrada.precio_unitario,
                  stock_entrada_id: entrada.id,
                })}
              >
                <Plus className="h-3 w-3 mr-1" />
                Registrar
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────

export default function Inventario() {
  const navigate = useNavigate();

  const [search, setSearch]           = useState('');
  const [categoriaFiltro, setCatFiltro] = useState('_all');
  const [showProductoSheet, setShowProductoSheet] = useState(false);
  const [editProducto, setEditProducto]           = useState<ProductoConProveedor | null>(null);
  const [ajusteProducto, setAjusteProducto]       = useState<ProductoConProveedor | null>(null);

  const { data: productos = [], isLoading: loadProds } = useProductos(
    search || undefined, categoriaFiltro !== '_all' ? categoriaFiltro : undefined,
  );
  const { data: movimientos = [], isLoading: loadMovs } = useMovimientos(undefined, 100);
  const { data: kpis } = useKPIsInventario();
  const deleteProducto = useDeleteProducto();

  const alertas = useMemo(() =>
    productos.filter(p => p.stock_actual <= p.stock_minimo),
  [productos]);

  const openEdit = (p: ProductoConProveedor) => {
    setEditProducto(p);
    setShowProductoSheet(true);
  };

  const openNew = () => {
    setEditProducto(null);
    setShowProductoSheet(true);
  };

  const openAjuste = (p: ProductoConProveedor) => setAjusteProducto(p);

  return (
    <div className="pb-2">
      <Header title="Inventario" />

      <div className="px-4 pt-4 space-y-4 max-w-2xl mx-auto">

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
          <KPI icon={Boxes}    label="Productos"       value={kpis?.total ?? 0}              accent />
          <KPI icon={Euro}     label="Valor en stock"  value={fmtEur(kpis?.valorStock ?? 0)} />
          <KPI icon={AlertTriangle} label="Alertas stock" value={kpis?.alertas ?? 0}
            sub={kpis?.alertas ? 'Requieren atención' : 'Todo en orden'} />
          <KPI icon={Activity} label="Movimientos hoy" value={kpis?.movimientosHoy ?? 0} />
        </div>

        {/* Entradas pendientes desde Pedidos */}
        <EntradasPendientesPanel />

        {/* Tabs */}
        <Tabs defaultValue="productos">
          <div className="flex items-center justify-between gap-3 mb-3">
            <TabsList className="bg-gold/10 border border-gold-light/20 h-9">
              <TabsTrigger value="productos" className="text-xs data-[state=active]:bg-card data-[state=active]:text-gold data-[state=active]:shadow-sm">
                Productos
              </TabsTrigger>
              <TabsTrigger value="movimientos" className="text-xs data-[state=active]:bg-card data-[state=active]:text-gold data-[state=active]:shadow-sm">
                Movimientos
              </TabsTrigger>
              <TabsTrigger value="alertas" className="text-xs relative data-[state=active]:bg-card data-[state=active]:text-gold data-[state=active]:shadow-sm">
                Alertas
                {(kpis?.alertas ?? 0) > 0 && (
                  <span className="ml-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] inline-flex items-center justify-center font-bold">
                    {kpis!.alertas}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            <Button onClick={openNew} size="sm" variant="luxury" className="h-9 gap-1.5 text-xs shrink-0">
              <Plus className="h-3.5 w-3.5" />
              Añadir
            </Button>
          </div>

          {/* ── TAB PRODUCTOS ── */}
          <TabsContent value="productos" className="mt-0 space-y-3">
            {/* Filtros */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar producto…"
                  className="pl-9 h-9 text-sm border-gold-light/30"
                />
              </div>
              <Select value={categoriaFiltro} onValueChange={setCatFiltro}>
                <SelectTrigger className="w-36 h-9 text-xs border-gold-light/30">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todas</SelectItem>
                  {CATEGORIAS.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loadProds ? (
              <div className="text-center py-10 text-muted-foreground text-sm">Cargando…</div>
            ) : productos.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Boxes className="h-12 w-12 text-gold/30 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {search || categoriaFiltro ? 'No hay productos con ese filtro' : 'El inventario está vacío'}
                </p>
                {!search && !categoriaFiltro && (
                  <Button onClick={openNew} variant="outline" size="sm" className="border-gold/40 text-gold">
                    <Plus className="h-4 w-4 mr-1" /> Añadir primer producto
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {productos.map(p => (
                  <ProductoCard
                    key={p.id}
                    producto={p}
                    onEdit={openEdit}
                    onAjuste={openAjuste}
                    onDelete={id => deleteProducto.mutate(id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── TAB MOVIMIENTOS ── */}
          <TabsContent value="movimientos" className="mt-0">
            <div className="bg-card border border-gold-light/20 rounded-2xl p-4">
              {loadMovs ? (
                <p className="text-center py-6 text-sm text-muted-foreground">Cargando…</p>
              ) : movimientos.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <BarChart3 className="h-10 w-10 text-gold/30 mx-auto" />
                  <p className="text-sm text-muted-foreground">Aún no hay movimientos registrados</p>
                </div>
              ) : (
                movimientos.map(mov => (
                  <MovimientoFila key={mov.id} mov={mov} />
                ))
              )}
            </div>
          </TabsContent>

          {/* ── TAB ALERTAS ── */}
          <TabsContent value="alertas" className="mt-0 space-y-3">
            {alertas.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Check className="h-12 w-12 text-emerald-500/50 mx-auto" />
                <p className="text-sm text-muted-foreground">Todos los productos están sobre el mínimo</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground px-1">
                  {alertas.length} producto{alertas.length !== 1 ? 's' : ''} por debajo del mínimo establecido
                </p>
                {alertas.map(p => {
                  const status = stockStatus(p.stock_actual, p.stock_minimo);
                  return (
                    <div key={p.id} className={cn(
                      'bg-card border rounded-2xl p-4 space-y-3',
                      p.stock_actual <= 0 ? 'border-rose-300/50' : 'border-amber-300/50',
                    )}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground text-sm">{p.nombre}</p>
                          <p className={cn('text-xs mt-0.5', status.text)}>
                            {p.stock_actual <= 0
                              ? '⚠ Sin stock'
                              : `Stock: ${p.stock_actual} ${p.unidad} (mínimo: ${p.stock_minimo})`
                            }
                          </p>
                        </div>
                        <button
                          onClick={() => openAjuste(p)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-gold hover:bg-gold/10"
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 text-xs border-gold/40 text-gold hover:bg-gold/10"
                          onClick={() => navigate('/pedidos', { state: { prefilledNombre: p.nombre, prefilledRef: p.referencia } })}
                        >
                          <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                          Crear pedido
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 text-xs border-gold-light/30"
                          onClick={() => openAjuste(p)}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Registrar entrada
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Sheets */}
      <ProductoSheet
        open={showProductoSheet}
        onClose={() => { setShowProductoSheet(false); setEditProducto(null); }}
        initial={editProducto}
      />
      <AjusteSheet
        open={!!ajusteProducto}
        onClose={() => setAjusteProducto(null)}
        producto={ajusteProducto}
      />
    </div>
  );
}

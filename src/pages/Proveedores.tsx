import { useState, useRef, useCallback } from 'react';
import { Plus, Building2, Phone, Mail, Package, ChevronDown, ChevronUp, Trash2, Edit2, Euro, Upload, FileSpreadsheet, FileText, X, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import * as XLSX from 'xlsx';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProveedores, useAddProveedor, useUpdateProveedor, useDeleteProveedor, useProveedorProductos, useAddProducto, useDeleteProducto, useImportProductos, useUploadCatalogoPDF, ProductoImport } from '@/hooks/useProveedores';
import { ProveedorRow, ProveedorProductoRow } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

// ── Fase 2: Carga de catálogo ────────────────────────────────

type ColMap = { producto: string; referencia: string; categoria: string; precio: string; unidad: string; descripcion: string };
const EMPTY_MAP: ColMap = { producto: '', referencia: '', categoria: '', precio: '', unidad: '', descripcion: '' };

function CatalogoUpload({ proveedorId }: { proveedorId: string }) {
  const fileRef   = useRef<HTMLInputElement>(null);
  const importFn  = useImportProductos(proveedorId);
  const uploadPDF = useUploadCatalogoPDF(proveedorId);

  const [step,     setStep]     = useState<'idle' | 'mapping' | 'preview' | 'done'>('idle');
  const [headers,  setHeaders]  = useState<string[]>([]);
  const [rows,     setRows]     = useState<string[][]>([]);
  const [colMap,   setColMap]   = useState<ColMap>(EMPTY_MAP);
  const [isPDF,    setIsPDF]    = useState(false);
  const [pdfFile,  setPDFFile]  = useState<File | null>(null);

  const reset = () => { setStep('idle'); setHeaders([]); setRows([]); setColMap(EMPTY_MAP); setIsPDF(false); setPDFFile(null); };

  const onFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'pdf') {
      setIsPDF(true);
      setPDFFile(file);
      setStep('preview');
      return;
    }

    // Excel / CSV
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data   = new Uint8Array(ev.target?.result as ArrayBuffer);
      const wb     = XLSX.read(data, { type: 'array' });
      const ws     = wb.Sheets[wb.SheetNames[0]];
      const matrix = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' });
      if (matrix.length < 2) return;

      const hdrs = (matrix[0] as string[]).map(String);
      const dataRows = (matrix.slice(1) as string[][])
        .filter(r => r.some(c => String(c).trim()))
        .map(r => r.map(String));

      setHeaders(hdrs);
      setRows(dataRows);

      // Auto-detectar columnas por nombre común
      const autoMap = { ...EMPTY_MAP };
      hdrs.forEach(h => {
        const low = h.toLowerCase();
        if (!autoMap.producto   && /producto|nombre|descrip|article/i.test(low)) autoMap.producto   = h;
        if (!autoMap.referencia && /ref|sku|código|codigo|code/i.test(low))      autoMap.referencia = h;
        if (!autoMap.categoria  && /categ|familia|tipo|group/i.test(low))        autoMap.categoria  = h;
        if (!autoMap.precio     && /precio|pvp|price|coste|cost/i.test(low))     autoMap.precio     = h;
        if (!autoMap.unidad     && /unidad|unit|um|medida/i.test(low))           autoMap.unidad     = h;
      });
      setColMap(autoMap);
      setStep('mapping');
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }, []);

  const buildPreview = (): ProductoImport[] =>
    rows.map(r => {
      const get = (col: string) => col ? (r[headers.indexOf(col)] ?? '') : '';
      const precioStr = get(colMap.precio).replace(',', '.').replace(/[^0-9.]/g, '');
      return {
        producto:    get(colMap.producto),
        referencia:  get(colMap.referencia) || null,
        categoria:   get(colMap.categoria)  || null,
        precio:      precioStr ? parseFloat(precioStr) : null,
        unidad:      get(colMap.unidad)     || null,
        descripcion: get(colMap.descripcion)|| null,
      };
    }).filter(r => r.producto.trim());

  const handleImport = async () => {
    await importFn.mutateAsync(buildPreview());
    setStep('done');
  };

  const handlePDFUpload = async () => {
    if (!pdfFile) return;
    await uploadPDF.mutateAsync(pdfFile);
    setStep('done');
  };

  const preview = step === 'preview' && !isPDF ? buildPreview() : [];

  // ── Render ────────────────────────────────────────────────

  if (step === 'idle') {
    return (
      <div className="mt-2">
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.pdf" onChange={onFile} className="hidden" />
        <Button
          type="button" variant="outline" size="sm"
          onClick={() => fileRef.current?.click()}
          className="w-full text-xs border-gold-light/30 text-gold hover:bg-gold/5 gap-2"
        >
          <Upload className="h-3.5 w-3.5" />
          Cargar catálogo (Excel / CSV / PDF)
        </Button>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="mt-2 flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
        <p className="text-xs text-emerald-700 dark:text-emerald-400 flex-1">
          {isPDF ? 'PDF subido correctamente' : 'Importación completada'}
        </p>
        <button onClick={reset} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  if (isPDF && step === 'preview') {
    return (
      <div className="mt-2 space-y-2 p-3 bg-gold/5 rounded-xl border border-gold-light/20">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gold shrink-0" />
          <p className="text-xs font-medium text-foreground truncate">{pdfFile?.name}</p>
        </div>
        <p className="text-[11px] text-muted-foreground">El PDF se guardará como catálogo de referencia del proveedor.</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={reset} className="flex-1 text-xs border-gold-light/30">Cancelar</Button>
          <Button type="button" variant="luxury" size="sm" onClick={handlePDFUpload} disabled={uploadPDF.isPending} className="flex-1 text-xs">
            {uploadPDF.isPending ? 'Subiendo...' : 'Subir PDF'}
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'mapping') {
    const fields: { key: keyof ColMap; label: string; required?: boolean }[] = [
      { key: 'producto',    label: 'Producto',    required: true },
      { key: 'referencia',  label: 'Referencia'   },
      { key: 'categoria',   label: 'Categoría'    },
      { key: 'precio',      label: 'Precio (€)'   },
      { key: 'unidad',      label: 'Unidad'        },
      { key: 'descripcion', label: 'Descripción'  },
    ];
    return (
      <div className="mt-2 space-y-3 p-3 bg-gold/5 rounded-xl border border-gold-light/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-gold" />
            <p className="text-xs font-semibold text-foreground">Mapear columnas ({rows.length} filas detectadas)</p>
          </div>
          <button onClick={reset} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {fields.map(f => (
            <div key={f.key} className="space-y-1">
              <Label className="text-[10px] text-gold-dark">
                {f.label}{f.required && ' *'}
              </Label>
              <Select
                value={colMap[f.key]}
                onValueChange={v => setColMap(p => ({ ...p, [f.key]: v === '_none' ? '' : v }))}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="— Sin asignar —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">— Sin asignar —</SelectItem>
                  {headers.map(h => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        {!colMap.producto && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-600">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            Asigna al menos la columna <strong>Producto</strong>
          </div>
        )}

        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={reset} className="flex-1 text-xs border-gold-light/30">Cancelar</Button>
          <Button
            type="button" variant="luxury" size="sm"
            onClick={() => setStep('preview')}
            disabled={!colMap.producto}
            className="flex-1 text-xs"
          >
            Vista previa
          </Button>
        </div>
      </div>
    );
  }

  // step === 'preview' + !isPDF
  return (
    <div className="mt-2 space-y-3 p-3 bg-gold/5 rounded-xl border border-gold-light/20">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">
          Vista previa — {preview.length} productos a importar
        </p>
        <button onClick={() => setStep('mapping')} className="text-xs text-gold hover:text-gold-dark">← Editar mapeo</button>
      </div>

      <div className="max-h-36 overflow-y-auto space-y-1">
        {preview.slice(0, 8).map((p, i) => (
          <div key={i} className="flex items-center justify-between text-[11px] p-1.5 bg-card rounded-lg border border-gold-light/10">
            <span className="font-medium text-foreground truncate flex-1">{p.producto}</span>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {p.referencia && <span className="text-muted-foreground">{p.referencia}</span>}
              {p.precio != null && (
                <span className="text-gold font-serif">{p.precio}€</span>
              )}
            </div>
          </div>
        ))}
        {preview.length > 8 && (
          <p className="text-[10px] text-muted-foreground text-center">
            + {preview.length - 8} más…
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={reset} className="flex-1 text-xs border-gold-light/30">Cancelar</Button>
        <Button
          type="button" variant="luxury" size="sm"
          onClick={handleImport}
          disabled={importFn.isPending || preview.length === 0}
          className="flex-1 text-xs"
        >
          {importFn.isPending ? 'Importando...' : `Importar ${preview.length} productos`}
        </Button>
      </div>
    </div>
  );
}

// ── Formulario de producto ───────────────────────────────────

function ProductoForm({ proveedorId, onClose }: { proveedorId: string; onClose: () => void }) {
  const add = useAddProducto();
  const [form, setForm] = useState({ producto: '', referencia: '', categoria: '', precio: '', unidad: 'ud', descripcion: '' });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.producto.trim()) return;
    await add.mutateAsync({
      proveedor_id: proveedorId,
      producto: form.producto,
      referencia: form.referencia || null,
      categoria: form.categoria || null,
      precio: form.precio ? parseFloat(form.precio) : null,
      unidad: form.unidad || null,
      descripcion: form.descripcion || null,
      activo: true,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-gold/5 rounded-2xl border border-gold-light/20 mt-3">
      <p className="text-xs font-semibold text-gold uppercase tracking-wider">Nuevo producto</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs text-gold-dark">Producto *</Label>
          <Input value={form.producto} onChange={set('producto')} placeholder="Nombre del producto" className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gold-dark">Referencia</Label>
          <Input value={form.referencia} onChange={set('referencia')} placeholder="REF-001" className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gold-dark">Categoría</Label>
          <Input value={form.categoria} onChange={set('categoria')} placeholder="Facial, Corporal…" className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gold-dark">Precio (€)</Label>
          <Input type="number" step="0.01" value={form.precio} onChange={set('precio')} placeholder="0.00" className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gold-dark">Unidad</Label>
          <Input value={form.unidad} onChange={set('unidad')} placeholder="ml, ud, gr…" className="h-8 text-sm" />
        </div>
        <div className="col-span-2 space-y-1">
          <Label className="text-xs text-gold-dark">Descripción</Label>
          <Textarea value={form.descripcion} onChange={set('descripcion')} rows={2} placeholder="Descripción breve…" className="text-sm rounded-xl border-gold-light/40" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose} className="flex-1 text-xs border-gold-light/30">Cancelar</Button>
        <Button type="submit" variant="luxury" size="sm" className="flex-1 text-xs" disabled={add.isPending}>Añadir</Button>
      </div>
    </form>
  );
}

// ── Tarjeta de proveedor ─────────────────────────────────────

function ProveedorCard({ proveedor, onEdit }: { proveedor: ProveedorRow; onEdit: (p: ProveedorRow) => void }) {
  const [expanded, setExpanded]   = useState(false);
  const [addingProd, setAdding]   = useState(false);
  const deleteP   = useDeleteProveedor();
  const deleteProd = useDeleteProducto();
  const { data: productos = [] } = useProveedorProductos(expanded ? proveedor.id : undefined);

  return (
    <div className="bg-card rounded-2xl border border-gold-light/30 overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gold/20 to-rosegold/10 border border-gold-light/30 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-gold" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{proveedor.empresa}</p>
              {proveedor.marca && <p className="text-xs text-gold">{proveedor.marca}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(proveedor)} className="h-7 w-7 rounded-lg hover:bg-gold/10 flex items-center justify-center text-gold/70 hover:text-gold transition-colors">
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => { if (confirm('¿Eliminar proveedor?')) deleteP.mutate(proveedor.id); }}
              className="h-7 w-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-destructive/60 hover:text-destructive transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          {proveedor.representante && <p className="flex items-center gap-1"><span className="font-medium text-foreground">Rep:</span> {proveedor.representante}</p>}
          {proveedor.telefono && <a href={`tel:${proveedor.telefono}`} className="flex items-center gap-1 hover:text-gold transition-colors"><Phone className="h-3 w-3" />{proveedor.telefono}</a>}
          {proveedor.email_empresa && <a href={`mailto:${proveedor.email_empresa}`} className="flex items-center gap-1 hover:text-gold transition-colors col-span-2 truncate"><Mail className="h-3 w-3 shrink-0" />{proveedor.email_empresa}</a>}
          {proveedor.email_comercial && proveedor.email_comercial !== proveedor.email_empresa && (
            <a href={`mailto:${proveedor.email_comercial}`} className="flex items-center gap-1 hover:text-gold transition-colors col-span-2 truncate"><Mail className="h-3 w-3 shrink-0 text-rosegold" />{proveedor.email_comercial}</a>
          )}
        </div>

        {/* Toggle catálogo */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-3 flex items-center gap-1.5 text-xs text-gold hover:text-gold-dark transition-colors"
        >
          <Package className="h-3.5 w-3.5" />
          Catálogo de productos
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Catálogo expandido */}
      {expanded && (
        <div className="border-t border-gold-light/20 p-4 space-y-2 bg-gold/3">
          {productos.length === 0 && !addingProd && (
            <p className="text-xs text-muted-foreground italic">Sin productos en catálogo</p>
          )}
          {productos.map(prod => (
            <div key={prod.id} className="flex items-center justify-between gap-2 text-sm p-2 rounded-xl bg-card border border-gold-light/20">
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">{prod.producto}</p>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  {prod.referencia && <span className="text-[10px] text-muted-foreground">Ref: {prod.referencia}</span>}
                  {prod.categoria && <Badge variant="secondary" className="text-[10px] h-4 px-1.5 border-gold-light/30">{prod.categoria}</Badge>}
                </div>
              </div>
              <div className="text-right shrink-0 flex items-center gap-2">
                {prod.precio && (
                  <span className="font-serif font-semibold text-gold text-sm flex items-center gap-0.5">
                    <Euro className="h-3 w-3" />{prod.precio}
                  </span>
                )}
                <button onClick={() => deleteProd.mutate(prod.id)} className="text-destructive/50 hover:text-destructive transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {addingProd ? (
            <ProductoForm proveedorId={proveedor.id} onClose={() => setAdding(false)} />
          ) : (
            <Button onClick={() => setAdding(true)} variant="outline" size="sm"
              className="w-full text-xs border-gold-light/30 text-gold hover:bg-gold/5 gap-1.5 mt-1">
              <Plus className="h-3.5 w-3.5" />
              Añadir producto manual
            </Button>
          )}

          {/* Carga masiva — Fase 2 */}
          <CatalogoUpload proveedorId={proveedor.id} />

          {/* Enlace al PDF del catálogo si existe */}
          {proveedor.catalogo_pdf_url && (
            <a
              href={proveedor.catalogo_pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] text-gold hover:text-gold-dark transition-colors mt-1"
            >
              <FileText className="h-3 w-3" />
              Ver catálogo PDF
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ── Formulario de proveedor ──────────────────────────────────

type ProvForm = { empresa: string; marca: string; representante: string; telefono: string; email_empresa: string; email_comercial: string; direccion: string; web: string; notas: string };
const EMPTY: ProvForm = { empresa: '', marca: '', representante: '', telefono: '', email_empresa: '', email_comercial: '', direccion: '', web: '', notas: '' };

function ProveedorSheet({ editing, onClose }: { editing: ProveedorRow | null; onClose: () => void }) {
  const isOpen = editing !== null || false;
  const add    = useAddProveedor();
  const update = useUpdateProveedor();
  const [form, setForm] = useState<ProvForm>(editing ? {
    empresa: editing.empresa, marca: editing.marca ?? '', representante: editing.representante ?? '',
    telefono: editing.telefono ?? '', email_empresa: editing.email_empresa ?? '',
    email_comercial: editing.email_comercial ?? '', direccion: editing.direccion ?? '',
    web: editing.web ?? '', notas: editing.notas ?? '',
  } : EMPTY);
  const set = (k: keyof ProvForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa.trim()) return;
    const payload = {
      empresa: form.empresa, marca: form.marca || null, representante: form.representante || null,
      telefono: form.telefono || null, email_empresa: form.email_empresa || null,
      email_comercial: form.email_comercial || null, direccion: form.direccion || null,
      web: form.web || null, notas: form.notas || null, active: true,
    };
    if (editing) await update.mutateAsync({ id: editing.id, updates: payload });
    else await add.mutateAsync(payload);
    onClose();
  };

  return (
    <Sheet open={!!editing || false} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto bg-card border-t border-gold-light/30">
        <SheetHeader>
          <SheetTitle className="font-serif text-foreground">{editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-gold-dark">Empresa *</Label>
              <Input value={form.empresa} onChange={set('empresa')} placeholder="Nombre de la empresa" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gold-dark">Marca</Label>
              <Input value={form.marca} onChange={set('marca')} placeholder="Marca representada" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gold-dark">Representante</Label>
              <Input value={form.representante} onChange={set('representante')} placeholder="Nombre del comercial" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gold-dark">Teléfono</Label>
              <Input value={form.telefono} onChange={set('telefono')} placeholder="+34 900 000 000" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gold-dark">Web</Label>
              <Input value={form.web} onChange={set('web')} placeholder="www.empresa.es" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-gold-dark">Email empresa</Label>
              <Input type="email" value={form.email_empresa} onChange={set('email_empresa')} placeholder="info@empresa.es" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-gold-dark">Email comercial</Label>
              <Input type="email" value={form.email_comercial} onChange={set('email_comercial')} placeholder="comercial@empresa.es" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-gold-dark">Dirección</Label>
              <Input value={form.direccion} onChange={set('direccion')} placeholder="Dirección…" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-gold-dark">Notas</Label>
              <Textarea value={form.notas} onChange={set('notas')} rows={2} placeholder="Condiciones, descuentos, notas…" className="rounded-2xl border-gold-light/40 bg-card" />
            </div>
          </div>
          <Button type="submit" variant="luxury" className="w-full" disabled={add.isPending || update.isPending}>
            {editing ? 'Guardar cambios' : 'Añadir proveedor'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ── Página principal ─────────────────────────────────────────

export default function Proveedores() {
  const { data: proveedores = [], isLoading } = useProveedores();
  const [addOpen,  setAddOpen]  = useState(false);
  const [editing,  setEditing]  = useState<ProveedorRow | null>(null);
  const [search,   setSearch]   = useState('');

  const filtered = proveedores.filter(p =>
    p.empresa.toLowerCase().includes(search.toLowerCase()) ||
    p.marca?.toLowerCase().includes(search.toLowerCase()) ||
    p.representante?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen marble-bg pb-24">
      <Header />
      <main className="max-w-lg lg:max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-2xl font-serif font-semibold text-foreground">Proveedores</h1>
            <p className="text-sm text-gold mt-0.5">{proveedores.length} proveedores · catálogo de productos</p>
          </div>
          <Button onClick={() => setAddOpen(true)} variant="gold" className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />Añadir
          </Button>
        </div>

        {/* Búsqueda */}
        <Input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar empresa, marca o representante..."
          className="animate-fade-in"
        />

        {/* Lista */}
        {isLoading && <div className="flex justify-center py-8"><div className="h-6 w-6 rounded-full border-2 border-gold border-t-transparent animate-spin" /></div>}
        <div className="space-y-3 animate-fade-in">
          {filtered.map(p => (
            <ProveedorCard key={p.id} proveedor={p} onEdit={setEditing} />
          ))}
          {filtered.length === 0 && !isLoading && (
            <div className="bg-card rounded-2xl border border-gold-light/20 p-8 text-center">
              <Building2 className="h-8 w-8 text-gold/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No se encontraron proveedores</p>
            </div>
          )}
        </div>
      </main>

      {/* Sheet añadir */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto bg-card border-t border-gold-light/30">
          <SheetHeader><SheetTitle className="font-serif text-foreground">Nuevo Proveedor</SheetTitle></SheetHeader>
          <ProveedorSheet editing={null} onClose={() => setAddOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Sheet editar */}
      {editing && <ProveedorSheet editing={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

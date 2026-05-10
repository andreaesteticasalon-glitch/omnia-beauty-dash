import { useState, useCallback } from 'react';
import {
  Plus, ShoppingCart, Trash2, Send, Mail, MessageCircle, Save,
  ChevronDown, ChevronUp, FileText, Package, AlertCircle,
  CheckCircle2, Clock, Euro, History, Filter,
} from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useProveedores, useProveedorProductos } from '@/hooks/useProveedores';
import { SmartSelect } from '@/components/SmartSelect';
import {
  usePedidos, useCreatePedido, useStockEntradas, usePedidoLineas,
  useConfirmarRecepcion, useMarcarIncidencia, useSendPedidoEmail,
  LineaFormData, PedidoConProveedor,
} from '@/hooks/usePedidos';
import { PedidoRow, StockEntradaRow } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// ── Helpers ──────────────────────────────────────────────────

const fmtEur = (n: number | null) => n != null ? `${n.toFixed(2)} €` : '—';
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

const URGENCIA_CONFIG = {
  normal:      { label: 'Normal',     cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  urgente:     { label: 'Urgente',    cls: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  muy_urgente: { label: 'MUY URGENTE', cls: 'bg-red-500/10 text-red-600 border-red-500/30' },
};

const ESTADO_CONFIG: Record<string, { label: string; cls: string }> = {
  borrador:   { label: 'Borrador',   cls: 'bg-muted text-muted-foreground border-muted' },
  enviado:    { label: 'Enviado',    cls: 'bg-sky-500/10 text-sky-600 border-sky-500/30' },
  parcial:    { label: 'Parcial',    cls: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  completado: { label: 'Completado', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  incidencia: { label: 'Incidencia', cls: 'bg-red-500/10 text-red-600 border-red-500/30' },
};

// ── Línea de pedido editable ─────────────────────────────────

function LineaItem({
  linea, proveedorId, onChange, onRemove,
}: {
  linea: LineaFormData;
  proveedorId: string;
  onChange: (l: LineaFormData) => void;
  onRemove: () => void;
}) {
  const { data: productos = [] } = useProveedorProductos(proveedorId);

  const onProductoChange = (productoId: string) => {
    const prod = productos.find(p => p.id === productoId);
    if (prod) {
      onChange({
        ...linea,
        producto_id:     prod.id,
        nombre_producto: prod.producto,
        referencia:      prod.referencia,
        precio_unitario: prod.precio,
        unidad:          prod.unidad,
      });
    }
  };

  const subtotal = linea.precio_unitario != null
    ? linea.precio_unitario * linea.cantidad : null;

  return (
    <div className="p-3 bg-gold/5 rounded-2xl border border-gold-light/20 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gold">Producto</p>
        <button onClick={onRemove} className="text-destructive/60 hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Selector de producto */}
      <Select value={linea.producto_id ?? ''} onValueChange={onProductoChange}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Seleccionar producto del catálogo..." />
        </SelectTrigger>
        <SelectContent>
          {productos.map(p => (
            <SelectItem key={p.id} value={p.id}>
              {p.producto}{p.referencia ? ` · ${p.referencia}` : ''}{p.precio ? ` · ${p.precio}€` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Nombre manual si no hay catálogo */}
      {!linea.producto_id && (
        <Input
          value={linea.nombre_producto}
          onChange={e => onChange({ ...linea, nombre_producto: e.target.value })}
          placeholder="O escribe el nombre del producto..."
          className="h-8 text-xs"
        />
      )}

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-gold-dark">Cantidad *</Label>
          <Input
            type="number" min="0.001" step="any"
            value={linea.cantidad || ''}
            onChange={e => onChange({ ...linea, cantidad: parseFloat(e.target.value) || 0 })}
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-gold-dark">Unidad</Label>
          <Input
            value={linea.unidad ?? ''}
            onChange={e => onChange({ ...linea, unidad: e.target.value || null })}
            placeholder="ud, ml, kg…"
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-gold-dark">Precio u. (€)</Label>
          <Input
            type="number" min="0" step="0.01"
            value={linea.precio_unitario ?? ''}
            onChange={e => onChange({ ...linea, precio_unitario: parseFloat(e.target.value) || null })}
            className="h-7 text-xs"
          />
        </div>
      </div>

      {subtotal != null && (
        <p className="text-right text-xs font-serif font-semibold text-gold">
          Subtotal: {fmtEur(subtotal)}
        </p>
      )}
    </div>
  );
}

// ── Formulario nuevo pedido (Sheet) ──────────────────────────

const LINEA_EMPTY: LineaFormData = {
  producto_id: null, nombre_producto: '', referencia: null,
  precio_unitario: null, cantidad: 1, unidad: null, notas: null,
};

interface InitialPedidoData {
  proveedorId: string;
  lineas: LineaFormData[];
}

function NuevoPedidoSheet({
  open, onClose, initialData,
}: {
  open: boolean;
  onClose: () => void;
  initialData?: InitialPedidoData | null;
}) {
  const { data: proveedores = [] } = useProveedores();
  const createPedido  = useCreatePedido();
  const sendEmail     = useSendPedidoEmail();
  const navigate      = useNavigate();

  const [step,        setStep]        = useState(1);
  const [provId,      setProvId]      = useState(initialData?.proveedorId ?? '');
  const [lineas,      setLineas]      = useState<LineaFormData[]>(initialData?.lineas ?? [{ ...LINEA_EMPTY }]);
  const [urgencia,    setUrgencia]    = useState<PedidoRow['urgencia']>('normal');
  const [notas,       setNotas]       = useState('');
  const [empresa,     setEmpresa]     = useState('AS Belleza y Bienestar');
  const [metodo,      setMetodo]      = useState<PedidoRow['metodo_envio']>('email');
  const [resultData,  setResultData]  = useState<{ pdf: Blob; total: number; numero: string } | null>(null);

  const prov = proveedores.find(p => p.id === provId);
  const total = lineas.reduce((s, l) =>
    s + (l.precio_unitario != null ? l.precio_unitario * l.cantidad : 0), 0);
  const lineasValidas = lineas.filter(l => l.nombre_producto.trim() && l.cantidad > 0);

  const reset = () => {
    setStep(1); setProvId(''); setLineas([{ ...LINEA_EMPTY }]);
    setUrgencia('normal'); setNotas(''); setMetodo('email');
    setResultData(null); setEmailStatus('idle');
    onClose();
  };

  const updateLinea = useCallback((i: number, l: LineaFormData) =>
    setLineas(prev => prev.map((x, idx) => idx === i ? l : x)), []);
  const removeLinea = useCallback((i: number) =>
    setLineas(prev => prev.filter((_, idx) => idx !== i)), []);

  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleEnviar = async () => {
    if (!provId || lineasValidas.length === 0) return;

    // 1. Crear pedido (siempre — aunque el email falle después)
    const result = await createPedido.mutateAsync({
      proveedor_id:        provId,
      urgencia,
      metodo_envio:        metodo,
      empresa_solicitante: empresa,
      email_destino:       prov?.email_comercial ?? prov?.email_empresa ?? null,
      telefono_destino:    prov?.telefono ?? null,
      notas:               notas || null,
      lineas:              lineasValidas,
    });

    // 2. Mostrar pantalla de éxito inmediatamente
    setResultData({
      pdf:    result.pdfBlob,
      total:  result.totalEstimado,
      numero: result.pedido.numero_pedido ?? '—',
    });
    setStep(4);

    // 3. Enviar email (independiente — si falla, el pedido ya está guardado)
    if (metodo === 'email') {
      const emailDestino = prov?.email_comercial ?? prov?.email_empresa;
      if (emailDestino) {
        setEmailStatus('sending');
        try {
          await sendEmail.mutateAsync({
            to:           emailDestino,
            numeroPedido: result.pedido.numero_pedido ?? result.pedido.id.slice(0, 8),
            proveedor:    { empresa: prov?.empresa ?? '', representante: prov?.representante },
            lineas:       lineasValidas,
            urgencia,
            empresa,
            notas:        notas || null,
            total:        result.totalEstimado,
            pdfBlob:      result.pdfBlob,
          });
          setEmailStatus('sent');
        } catch {
          setEmailStatus('error');
          // El pedido ya fue guardado — el error de email es informativo, no crítico
        }
      }
    }

    // 4. WhatsApp (abre enlace en nueva pestaña)
    if (metodo === 'whatsapp' && prov?.telefono) {
      const phone = prov.telefono.replace(/\D/g, '');
      const msg = encodeURIComponent(
        `Hola${prov.representante ? ' ' + prov.representante : ''},\n\nSomos ${empresa}.\nOs enviamos pedido Nº ${result.pedido.numero_pedido}.\n\n${lineasValidas.map(l => `• ${l.nombre_producto}: ${l.cantidad} ${l.unidad ?? ''}`).join('\n')}\n\nTotal estimado: ${result.totalEstimado.toFixed(2)} €\n\nGracias.`,
      );
      window.open(`https://wa.me/${phone}?text=${msg}`);
    }
  };

  const downloadPDF = () => {
    if (!resultData?.pdf) return;
    const url = URL.createObjectURL(resultData.pdf);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Pedido-${resultData.numero}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Sheet open={open} onOpenChange={reset}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[92vh] overflow-y-auto bg-card border-t border-gold-light/30">
        <SheetHeader>
          <SheetTitle className="font-serif text-foreground flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-gold" />
            Nuevo Pedido
            {step > 1 && (
              <span className="text-xs text-muted-foreground font-normal ml-2">
                Paso {step} de 3
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-5 space-y-4 pb-6">

          {/* ── PASO 4: Resultado ── */}
          {step === 4 && resultData && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-serif font-semibold text-foreground">¡Pedido {resultData.numero} creado!</h3>
                <div className="text-sm text-center space-y-1">
                  {metodo === 'email' && emailStatus === 'sending' && (
                    <p className="text-gold flex items-center justify-center gap-2">
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-gold border-t-transparent animate-spin" />
                      Enviando email al proveedor…
                    </p>
                  )}
                  {metodo === 'email' && emailStatus === 'sent' && (
                    <p className="text-emerald-600 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> Email enviado con PDF adjunto
                    </p>
                  )}
                  {metodo === 'email' && emailStatus === 'error' && (
                    <div className="space-y-1">
                      <p className="text-amber-600 flex items-center justify-center gap-1.5">
                        <AlertCircle className="h-4 w-4" /> Pedido guardado · Email pendiente
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Despliega la Edge Function "send-email" y configura RESEND_API_KEY
                      </p>
                    </div>
                  )}
                  {metodo === 'whatsapp' && (
                    <p className="text-muted-foreground">WhatsApp abierto con el mensaje del pedido</p>
                  )}
                  {metodo === 'manual' && (
                    <p className="text-muted-foreground">Pedido guardado como borrador</p>
                  )}
                </div>
                <p className="text-xl font-serif font-bold text-gold">{fmtEur(resultData.total)}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={downloadPDF} variant="outline" className="gap-2 border-gold-light/40 text-gold hover:bg-gold/5">
                  <FileText className="h-4 w-4" /> Descargar PDF
                </Button>
                <Button onClick={() => { reset(); navigate('/pedidos'); }} variant="luxury" className="gap-2">
                  <ShoppingCart className="h-4 w-4" /> Ver pedidos
                </Button>
              </div>
            </div>
          )}

          {/* ── PASO 1: Proveedor + líneas ── */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label className="text-gold-dark">Proveedor *</Label>
                <SmartSelect
                  value={provId}
                  onChange={v => { setProvId(v); setLineas([{ ...LINEA_EMPTY }]); }}
                  options={proveedores.map(p => ({
                    value: p.id,
                    label: p.empresa,
                    subtitle: p.marca ?? undefined,
                  }))}
                  placeholder="Seleccionar proveedor..."
                  createLabel="Añadir nuevo proveedor"
                  onCreateNew={() => { reset(); navigate('/proveedores'); }}
                />
              </div>

              {provId && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-gold-dark">Productos a pedir *</Label>
                      <button onClick={() => setLineas(p => [...p, { ...LINEA_EMPTY }])}
                        className="text-xs text-gold hover:text-gold-dark flex items-center gap-1">
                        <Plus className="h-3 w-3" /> Añadir producto
                      </button>
                    </div>
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {lineas.map((l, i) => (
                        <LineaItem key={i} linea={l} proveedorId={provId}
                          onChange={nl => updateLinea(i, nl)}
                          onRemove={() => removeLinea(i)} />
                      ))}
                    </div>
                  </div>

                  {/* Total corriente */}
                  {total > 0 && (
                    <div className="flex items-center justify-between bg-gold/10 rounded-xl px-4 py-2">
                      <span className="text-sm text-foreground">Total estimado</span>
                      <span className="font-serif font-bold text-gold">{fmtEur(total)}</span>
                    </div>
                  )}

                  <Button
                    onClick={() => setStep(2)}
                    variant="luxury" className="w-full"
                    disabled={lineasValidas.length === 0}
                  >
                    Continuar — {lineasValidas.length} producto{lineasValidas.length !== 1 ? 's' : ''}
                  </Button>
                </>
              )}
            </>
          )}

          {/* ── PASO 2: Detalles del pedido ── */}
          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label className="text-gold-dark">Urgencia</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(URGENCIA_CONFIG) as [PedidoRow['urgencia'], typeof URGENCIA_CONFIG[keyof typeof URGENCIA_CONFIG]][]).map(([k, v]) => (
                    <button key={k} onClick={() => setUrgencia(k)}
                      className={cn(
                        'py-2.5 rounded-xl border text-xs font-medium transition-all',
                        urgencia === k ? 'bg-gradient-to-r ' + v.cls + ' shadow-sm' : 'border-gold-light/20 bg-card hover:bg-gold/5 text-muted-foreground',
                      )}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gold-dark">Empresa solicitante</Label>
                <Input value={empresa} onChange={e => setEmpresa(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label className="text-gold-dark">Notas / observaciones</Label>
                <Textarea value={notas} onChange={e => setNotas(e.target.value)}
                  rows={3} placeholder="Plazo de entrega, instrucciones especiales…"
                  className="rounded-2xl border-gold-light/40 bg-card" />
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1 border-gold-light/30">← Atrás</Button>
                <Button onClick={() => setStep(3)} variant="luxury" className="flex-1">Continuar</Button>
              </div>
            </>
          )}

          {/* ── PASO 3: Método de envío + confirmación ── */}
          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label className="text-gold-dark">Método de envío</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'email'    as const, icon: Mail,           label: 'Email',     sub: prov?.email_comercial ?? prov?.email_empresa ?? '—' },
                    { key: 'whatsapp' as const, icon: MessageCircle,  label: 'WhatsApp',  sub: prov?.telefono ?? '—' },
                    { key: 'manual'   as const, icon: Save,           label: 'Guardar',   sub: 'Solo guardar' },
                  ].map(m => {
                    const Icon = m.icon;
                    return (
                      <button key={m.key} onClick={() => setMetodo(m.key)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs transition-all',
                          metodo === m.key
                            ? 'border-gold/50 bg-gold/10 text-gold shadow-sm'
                            : 'border-gold-light/20 bg-card text-muted-foreground hover:bg-gold/5',
                        )}>
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{m.label}</span>
                        <span className="text-[10px] truncate w-full text-center opacity-70">{m.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Resumen */}
              <div className="bg-gold/5 rounded-2xl border border-gold-light/20 p-4 space-y-2">
                <p className="text-xs font-semibold text-gold uppercase tracking-wider mb-1">Resumen del pedido</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Proveedor</span>
                  <span className="font-medium text-foreground">{prov?.empresa}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Productos</span>
                  <span className="font-medium text-foreground">{lineasValidas.length} líneas</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Urgencia</span>
                  <Badge variant="secondary" className={cn('text-[10px] border', URGENCIA_CONFIG[urgencia].cls)}>
                    {URGENCIA_CONFIG[urgencia].label}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-1 border-t border-gold-light/20">
                  <span className="text-foreground">Total estimado</span>
                  <span className="text-gold font-serif">{fmtEur(total)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1 border-gold-light/30">← Atrás</Button>
                <Button
                  onClick={handleEnviar}
                  variant="luxury" className="flex-1 gap-2"
                  disabled={createPedido.isPending}
                >
                  {createPedido.isPending ? (
                    <><span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />Procesando…</>
                  ) : (
                    <><Send className="h-4 w-4" />{metodo === 'manual' ? 'Guardar pedido' : 'Enviar pedido'}</>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Tarjeta de pedido en historial ───────────────────────────

function PedidoCard({ pedido }: { pedido: PedidoConProveedor }) {
  const [expanded, setExpanded] = useState(false);
  const { data: lineas = [] }   = usePedidoLineas(expanded ? pedido.id : null);
  const est = ESTADO_CONFIG[pedido.estado] ?? ESTADO_CONFIG.borrador;
  const urg = URGENCIA_CONFIG[pedido.urgencia] ?? URGENCIA_CONFIG.normal;

  return (
    <div className="bg-card rounded-2xl border border-gold-light/20 overflow-hidden">
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-foreground text-sm">
              Nº {pedido.numero_pedido ?? pedido.id.slice(0, 8)}
            </p>
            <p className="text-xs text-gold">
              {(pedido as PedidoConProveedor & { proveedores: { empresa: string } | null }).proveedores?.empresa ?? '—'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <Badge variant="secondary" className={cn('text-[10px] border', est.cls)}>{est.label}</Badge>
            <Badge variant="secondary" className={cn('text-[10px] border', urg.cls)}>{urg.label}</Badge>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{fmtDate(pedido.created_at)}</span>
          {pedido.coste_total_estimado > 0 && (
            <span className="font-serif font-semibold text-gold flex items-center gap-0.5">
              <Euro className="h-3 w-3" />{pedido.coste_total_estimado.toFixed(2)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {pedido.pdf_url && (
            <a href={pedido.pdf_url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-gold hover:text-gold-dark flex items-center gap-1">
              <FileText className="h-3 w-3" /> Ver PDF
            </a>
          )}
          <button onClick={() => setExpanded(e => !e)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 ml-auto">
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {expanded ? 'Ocultar' : 'Ver líneas'}
          </button>
        </div>
      </div>

      {expanded && lineas.length > 0 && (
        <div className="border-t border-gold-light/20 p-3 space-y-1.5 bg-gold/3">
          {lineas.map(l => (
            <div key={l.id} className="flex items-center justify-between text-xs">
              <span className="text-foreground">{l.nombre_producto}{l.referencia ? ` · ${l.referencia}` : ''}</span>
              <span className="text-muted-foreground">{l.cantidad} {l.unidad ?? ''}</span>
              {l.subtotal != null && (
                <span className="text-gold font-serif ml-2">{fmtEur(l.subtotal)}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tarjeta de stock pendiente — Fase 4: confirmación expandida ──

type StockEntradaWithProv = StockEntradaRow & { proveedores: { empresa: string } | null };

function StockCard({
  entrada,
  onNuevoPedido,
}: {
  entrada: StockEntradaWithProv;
  onNuevoPedido: (e: StockEntradaWithProv) => void;
}) {
  const confirmar  = useConfirmarRecepcion();
  const incidencia = useMarcarIncidencia();

  const [modo,       setModo]      = useState<'idle' | 'recibir' | 'incidencia'>('idle');
  const [recepcion,  setRecepcion] = useState({
    cantRec:  String(entrada.cantidad_pedida ?? ''),
    fechaRec: new Date().toISOString().split('T')[0],
    notas:    '',
    parcial:  false,
  });
  const [notaInc, setNotaInc] = useState('');

  if (entrada.estado !== 'pendiente') return null;

  const pedidoCant = entrada.cantidad_pedida ?? 0;
  const recibidoCant = parseFloat(recepcion.cantRec) || 0;
  const esParcial = recibidoCant < pedidoCant && recibidoCant > 0;

  const handleConfirmar = () => {
    confirmar.mutate({
      id: entrada.id,
      cantidadRecibida: recibidoCant,
    });
    setModo('idle');
  };

  return (
    <div className="bg-card rounded-2xl border border-amber-500/20 overflow-hidden">
      {/* Cabecera */}
      <div className="p-4 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-foreground text-sm truncate">{entrada.producto_nombre}</p>
            <p className="text-xs text-muted-foreground">
              {entrada.proveedores?.empresa ?? '—'}
              {entrada.referencia ? ` · Ref: ${entrada.referencia}` : ''}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-semibold text-amber-600">
              {pedidoCant} {entrada.unidad ?? 'ud'} pedidas
            </p>
            {entrada.precio_unitario && (
              <p className="text-[10px] text-muted-foreground">{entrada.precio_unitario}€/u</p>
            )}
          </div>
        </div>

        {/* Botones primarios — solo en modo idle */}
        {modo === 'idle' && (
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline"
              onClick={() => setModo('incidencia')}
              className="flex-1 text-xs border-red-400/30 text-red-500 hover:bg-red-500/5 gap-1">
              <AlertCircle className="h-3.5 w-3.5" /> Incidencia
            </Button>
            <Button size="sm" variant="luxury"
              onClick={() => setModo('recibir')}
              className="flex-1 text-xs gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Confirmar recepción
            </Button>
          </div>
        )}
      </div>

      {/* Formulario recepción expandido */}
      {modo === 'recibir' && (
        <div className="border-t border-amber-500/10 bg-emerald-500/5 p-4 space-y-3">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Confirmar recepción
          </p>

          {/* Parcial / Completo */}
          <div className="flex gap-2">
            {[false, true].map(p => (
              <button key={String(p)}
                onClick={() => {
                  setRecepcion(r => ({
                    ...r,
                    parcial: p,
                    cantRec: p ? '' : String(pedidoCant),
                  }));
                }}
                className={cn(
                  'flex-1 py-2 rounded-xl border text-xs font-medium transition-all',
                  recepcion.parcial === p
                    ? p
                      ? 'border-amber-400/50 bg-amber-500/10 text-amber-700'
                      : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700'
                    : 'border-gold-light/20 bg-card text-muted-foreground hover:bg-gold/5',
                )}>
                {p ? '⚠ Recepción parcial' : '✅ Recibido completo'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-gold-dark">
                Cantidad recibida {entrada.unidad ? `(${entrada.unidad})` : ''}
              </Label>
              <Input
                type="number" min="0" step="any"
                value={recepcion.cantRec}
                onChange={e => setRecepcion(r => ({ ...r, cantRec: e.target.value }))}
                className="h-8 text-sm"
              />
              {esParcial && (
                <p className="text-[10px] text-amber-600">
                  Pendiente: {(pedidoCant - recibidoCant).toFixed(2)} {entrada.unidad ?? 'ud'}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-gold-dark">Fecha de recepción</Label>
              <Input
                type="date"
                value={recepcion.fechaRec}
                onChange={e => setRecepcion(r => ({ ...r, fechaRec: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] text-gold-dark">Notas de recepción (opcional)</Label>
            <Textarea
              value={recepcion.notas}
              onChange={e => setRecepcion(r => ({ ...r, notas: e.target.value }))}
              placeholder="Estado del producto, observaciones del albarán…"
              rows={2}
              className="text-xs rounded-xl border-gold-light/40"
            />
          </div>

          {/* Resumen antes de confirmar */}
          {recibidoCant > 0 && (
            <div className="bg-card rounded-xl border border-emerald-500/20 p-3 text-xs space-y-1">
              <p className="font-semibold text-foreground">Resumen de recepción</p>
              <p className="text-muted-foreground">
                Pedido: {pedidoCant} · Recibido: <strong className="text-emerald-600">{recibidoCant}</strong>
                {entrada.precio_unitario && (
                  <> · Valor: <strong className="text-gold">{(entrada.precio_unitario * recibidoCant).toFixed(2)} €</strong></>
                )}
              </p>
              {esParcial && (
                <p className="text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Recepción parcial — el resto quedará pendiente
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setModo('idle')} className="flex-1 text-xs border-gold-light/30">
              Cancelar
            </Button>
            <Button size="sm" variant="luxury"
              onClick={handleConfirmar}
              disabled={confirmar.isPending || recibidoCant <= 0}
              className="flex-1 text-xs gap-1">
              {confirmar.isPending
                ? <><span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> Guardando…</>
                : <><CheckCircle2 className="h-3.5 w-3.5" /> Confirmar</>
              }
            </Button>
          </div>
        </div>
      )}

      {/* Formulario incidencia */}
      {modo === 'incidencia' && (
        <div className="border-t border-red-500/10 bg-red-500/5 p-4 space-y-3">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Registrar incidencia</p>
          <Textarea
            value={notaInc}
            onChange={e => setNotaInc(e.target.value)}
            placeholder="Producto no recibido, cantidad incorrecta, producto dañado, referencia errónea…"
            rows={3}
            className="text-xs rounded-xl border-red-300/40"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setModo('idle')} className="flex-1 text-xs border-gold-light/30">
              Cancelar
            </Button>
            <Button size="sm" variant="outline"
              onClick={() => { incidencia.mutate({ id: entrada.id, nota: notaInc }); setModo('idle'); }}
              disabled={incidencia.isPending}
              className="flex-1 text-xs border-red-400/40 text-red-600 hover:bg-red-500/5">
              Confirmar incidencia
            </Button>
          </div>

          {/* Enlace bidireccional */}
          <button
            onClick={() => onNuevoPedido(entrada)}
            className="w-full text-[11px] text-gold hover:text-gold-dark flex items-center justify-center gap-1.5 pt-1">
            <Plus className="h-3 w-3" /> Crear nuevo pedido para este producto al mismo proveedor
          </button>
        </div>
      )}
    </div>
  );
}

// ── Tarjeta de incidencia (en historial) ─────────────────────

function IncidenciaCard({
  entrada,
  onNuevoPedido,
}: {
  entrada: StockEntradaWithProv;
  onNuevoPedido: (e: StockEntradaWithProv) => void;
}) {
  return (
    <div className="bg-red-500/5 rounded-2xl border border-red-500/20 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{entrada.producto_nombre}</p>
          <p className="text-xs text-muted-foreground">{entrada.proveedores?.empresa ?? '—'}</p>
        </div>
        <Badge variant="secondary" className="text-[10px] border bg-red-500/10 text-red-600 border-red-500/30 shrink-0">
          Incidencia
        </Badge>
      </div>
      {entrada.notas_incidencia && (
        <p className="text-xs text-red-600 bg-red-500/5 rounded-lg p-2 border border-red-500/10">
          ⚠ {entrada.notas_incidencia}
        </p>
      )}
      <p className="text-[10px] text-muted-foreground">
        Pedido: {entrada.cantidad_pedida ?? '—'} {entrada.unidad ?? 'ud'} · {fmtDate(entrada.created_at)}
      </p>
      <Button onClick={() => onNuevoPedido(entrada)} size="sm" variant="outline"
        className="w-full text-xs border-gold-light/30 text-gold hover:bg-gold/5 gap-1.5">
        <Plus className="h-3.5 w-3.5" /> Repetir pedido a este proveedor
      </Button>
    </div>
  );
}

// ── Historial completo de stock — Fase 4 ─────────────────────

function StockHistorial({ onNuevoPedido }: { onNuevoPedido: (e: StockEntradaWithProv) => void }) {
  const { data: todos = [], isLoading } = useStockEntradas();
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const filtrado = todos.filter(e =>
    filtroEstado === 'todos' || e.estado === filtroEstado,
  );

  const ESTADO_STOCK = {
    pendiente: { label: 'Pendiente', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
    recibido:  { label: 'Recibido',  cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
    incidencia:{ label: 'Incidencia', cls: 'bg-red-500/10 text-red-600 border-red-500/30' },
  } as const;

  return (
    <div className="space-y-3">
      {/* Filtro */}
      <div className="flex items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-gold shrink-0" />
        <div className="flex gap-1.5 flex-wrap">
          {(['todos', 'pendiente', 'recibido', 'incidencia'] as const).map(f => (
            <button key={f} onClick={() => setFiltroEstado(f)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all capitalize',
                filtroEstado === f
                  ? 'border-gold/50 bg-gold/10 text-gold'
                  : 'border-gold-light/20 text-muted-foreground hover:bg-gold/5',
              )}>
              {f === 'todos' ? `Todos (${todos.length})` : `${ESTADO_STOCK[f].label} (${todos.filter(e => e.estado === f).length})`}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 rounded-full border-2 border-gold border-t-transparent animate-spin" />
        </div>
      )}

      {!isLoading && filtrado.length === 0 && (
        <div className="bg-card rounded-2xl border border-gold-light/20 p-6 text-center">
          <History className="h-7 w-7 text-gold/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Sin registros para este filtro</p>
        </div>
      )}

      {filtrado.map(e => {
        const est = ESTADO_STOCK[e.estado as keyof typeof ESTADO_STOCK];
        return (
          <div key={e.id} className="bg-card rounded-2xl border border-gold-light/20 p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-foreground truncate">{e.producto_nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {e.proveedores?.empresa ?? '—'}
                  {e.referencia ? ` · ${e.referencia}` : ''}
                </p>
              </div>
              {est && (
                <Badge variant="secondary" className={cn('text-[10px] border shrink-0', est.cls)}>
                  {est.label}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div>
                <p className="text-[10px] font-medium text-foreground">Pedido</p>
                <p>{e.cantidad_pedida ?? '—'} {e.unidad ?? ''}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-foreground">Recibido</p>
                <p className={e.estado === 'recibido' ? 'text-emerald-600 font-medium' : ''}>
                  {e.cantidad_recibida ?? '—'} {e.unidad ?? ''}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-foreground">Valor</p>
                <p className="text-gold">
                  {e.precio_unitario && e.cantidad_recibida
                    ? fmtEur(e.precio_unitario * e.cantidad_recibida)
                    : '—'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Pedido: {fmtDate(e.created_at)}</span>
              {e.fecha_recibida && <span>Recibido: {e.fecha_recibida}</span>}
            </div>

            {e.notas_incidencia && (
              <p className="text-xs text-red-600 bg-red-500/5 rounded-lg p-2 border border-red-500/10">
                ⚠ {e.notas_incidencia}
              </p>
            )}

            {e.estado === 'incidencia' && (
              <Button onClick={() => onNuevoPedido(e as StockEntradaWithProv)} size="sm" variant="outline"
                className="w-full text-xs border-gold-light/30 text-gold hover:bg-gold/5 gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Repetir pedido a este proveedor
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────

export default function Pedidos() {
  const [sheetOpen,    setSheetOpen]    = useState(false);
  const [initialData,  setInitialData]  = useState<InitialPedidoData | null>(null);
  const { data: pedidos = []  } = usePedidos();
  const { data: stockPend = [] } = useStockEntradas('pendiente');
  const { data: stockInc = []  } = useStockEntradas('incidencia');

  // Abre el sheet pre-rellado desde una incidencia
  const handleNuevoPedidoDesdeIncidencia = useCallback((e: StockEntradaWithProv) => {
    setInitialData({
      proveedorId: e.proveedor_id ?? '',
      lineas: [{
        producto_id:     null,
        nombre_producto: e.producto_nombre,
        referencia:      e.referencia,
        precio_unitario: e.precio_unitario,
        cantidad:        e.cantidad_pedida ?? 1,
        unidad:          e.unidad,
        notas:           `Reposición por incidencia del ${fmtDate(e.created_at)}`,
      }],
    });
    setSheetOpen(true);
  }, []);

  return (
    <div className="pb-2">
      <Header />
      <main className="max-w-lg lg:max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Cabecera */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-2xl font-serif font-semibold text-foreground">Pedidos</h1>
            <p className="text-sm text-gold mt-0.5">
              {pedidos.length} pedidos · {stockPend.length} entradas pendientes
            </p>
          </div>
          <Button onClick={() => setSheetOpen(true)} variant="luxury" className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Nuevo pedido
          </Button>
        </div>

        {/* KPIs rápidos */}
        {(stockPend.length > 0 || stockInc.length > 0) && (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            <div className="bg-card rounded-2xl border border-amber-500/20 p-4 text-center">
              <p className="text-2xl font-serif font-bold text-amber-600">{stockPend.length}</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" /> Pendientes de recibir
              </p>
            </div>
            <div className={cn(
              'rounded-2xl border p-4 text-center',
              stockInc.length > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-card border-gold-light/20',
            )}>
              <p className={cn('text-2xl font-serif font-bold', stockInc.length > 0 ? 'text-red-600' : 'text-gold/40')}>
                {stockInc.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <AlertCircle className="h-3 w-3" /> Incidencias
              </p>
            </div>
          </div>
        )}

        {/* Tabs — 3 pestañas */}
        <Tabs defaultValue="pedidos" className="animate-fade-in">
          <TabsList className="grid w-full grid-cols-3 bg-card/80 p-1.5 rounded-2xl border border-gold-light/30">
            <TabsTrigger value="pedidos" className="rounded-xl text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-rosegold/20 data-[state=active]:to-gold/10 data-[state=active]:border data-[state=active]:border-gold-light/40 transition-all">
              <Package className="h-3.5 w-3.5 mr-1" /> Pedidos
            </TabsTrigger>
            <TabsTrigger value="stock" className="rounded-xl text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-rosegold/20 data-[state=active]:to-gold/10 data-[state=active]:border data-[state=active]:border-gold-light/40 transition-all">
              <Clock className="h-3.5 w-3.5 mr-1" /> Pendiente
              {stockPend.length > 0 && (
                <span className="ml-1 h-4 w-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-bold">
                  {stockPend.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="historial-stock" className="rounded-xl text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-rosegold/20 data-[state=active]:to-gold/10 data-[state=active]:border data-[state=active]:border-gold-light/40 transition-all">
              <History className="h-3.5 w-3.5 mr-1" /> Historial
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Pedidos */}
          <TabsContent value="pedidos" className="mt-4 space-y-3">
            {pedidos.length === 0 && (
              <div className="bg-card rounded-2xl border border-gold-light/20 p-8 text-center">
                <ShoppingCart className="h-8 w-8 text-gold/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No hay pedidos registrados</p>
                <Button onClick={() => setSheetOpen(true)} variant="gold" size="sm" className="mt-3 gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Crear primer pedido
                </Button>
              </div>
            )}
            {pedidos.map(p => <PedidoCard key={p.id} pedido={p} />)}
          </TabsContent>

          {/* Tab 2: Stock pendiente */}
          <TabsContent value="stock" className="mt-4 space-y-3">
            {stockPend.length === 0 && (
              <div className="bg-card rounded-2xl border border-gold-light/20 p-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Todo el stock pedido ha sido confirmado</p>
              </div>
            )}
            {stockPend.map(e => (
              <StockCard key={e.id} entrada={e} onNuevoPedido={handleNuevoPedidoDesdeIncidencia} />
            ))}
            {stockInc.length > 0 && (
              <>
                <p className="text-xs font-semibold uppercase tracking-widest text-red-500 mt-4 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" /> Incidencias activas
                </p>
                {stockInc.map(e => (
                  <IncidenciaCard key={e.id} entrada={e} onNuevoPedido={handleNuevoPedidoDesdeIncidencia} />
                ))}
              </>
            )}
          </TabsContent>

          {/* Tab 3: Historial completo de stock */}
          <TabsContent value="historial-stock" className="mt-4">
            <StockHistorial onNuevoPedido={handleNuevoPedidoDesdeIncidencia} />
          </TabsContent>
        </Tabs>
      </main>

      <NuevoPedidoSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setInitialData(null); }}
        initialData={initialData}
      />
    </div>
  );
}

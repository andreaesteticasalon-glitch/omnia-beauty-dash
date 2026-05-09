import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PedidoRow, PedidoLineaRow, StockEntradaRow } from '@/integrations/supabase/types';
import { generarPedidoPDF } from '@/components/pedidos/GenerarPedidoPDF';
import { toast } from 'sonner';

// ── Tipos públicos ───────────────────────────────────────────

export interface LineaFormData {
  producto_id:     string | null;
  nombre_producto: string;
  referencia:      string | null;
  precio_unitario: number | null;
  cantidad:        number;
  unidad:          string | null;
  notas:           string | null;
}

export interface CreatePedidoPayload {
  proveedor_id:        string;
  urgencia:            PedidoRow['urgencia'];
  metodo_envio:        PedidoRow['metodo_envio'];
  empresa_solicitante: string;
  email_destino:       string | null;
  telefono_destino:    string | null;
  notas:               string | null;
  lineas:              LineaFormData[];
}

export type PedidoConProveedor = PedidoRow & {
  proveedores: { empresa: string; marca: string | null } | null;
};

// ── Queries ──────────────────────────────────────────────────

export function usePedidos(estado?: string) {
  return useQuery({
    queryKey: ['pedidos', estado ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('pedidos')
        .select('*, proveedores(empresa, marca)')
        .order('created_at', { ascending: false });
      if (estado) q = q.eq('estado', estado);
      const { data, error } = await q;
      if (error) throw error;
      return data as PedidoConProveedor[];
    },
  });
}

export function usePedidoLineas(pedidoId: string | null) {
  return useQuery({
    queryKey: ['pedido-lineas', pedidoId],
    enabled: !!pedidoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedido_lineas')
        .select('*')
        .eq('pedido_id', pedidoId!)
        .order('created_at');
      if (error) throw error;
      return data as PedidoLineaRow[];
    },
  });
}

export function useStockEntradas(estado?: string) {
  return useQuery({
    queryKey: ['stock-entradas', estado ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('stock_entradas')
        .select('*, proveedores(empresa)')
        .order('created_at', { ascending: false });
      if (estado) q = q.eq('estado', estado);
      const { data, error } = await q;
      if (error) throw error;
      return data as (StockEntradaRow & { proveedores: { empresa: string } | null })[];
    },
    refetchInterval: 60_000,
  });
}

// ── Mutations ────────────────────────────────────────────────

export function useCreatePedido() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreatePedidoPayload) => {
      const ahora = new Date();

      // 1. Obtener datos del proveedor (para el PDF)
      const { data: prov } = await supabase
        .from('proveedores')
        .select('empresa, marca, representante, email_empresa, email_comercial, telefono')
        .eq('id', payload.proveedor_id)
        .single();

      // 2. Crear cabecera del pedido
      const estado: PedidoRow['estado'] =
        payload.metodo_envio === 'manual' ? 'borrador' : 'enviado';

      const { data: pedido, error: pedErr } = await supabase
        .from('pedidos')
        .insert({
          proveedor_id:        payload.proveedor_id,
          estado,
          urgencia:            payload.urgencia,
          metodo_envio:        payload.metodo_envio,
          empresa_solicitante: payload.empresa_solicitante,
          email_destino:       payload.email_destino,
          telefono_destino:    payload.telefono_destino,
          notas:               payload.notas,
          enviado_at:          payload.metodo_envio !== 'manual' ? ahora.toISOString() : null,
        })
        .select()
        .single();
      if (pedErr) throw pedErr;

      // 3. Insertar líneas
      const lineasInsert = payload.lineas.map(l => ({
        pedido_id:       pedido.id,
        producto_id:     l.producto_id,
        nombre_producto: l.nombre_producto,
        referencia:      l.referencia,
        precio_unitario: l.precio_unitario,
        cantidad:        l.cantidad,
        unidad:          l.unidad,
        notas:           l.notas,
      }));
      const { data: lineas, error: linErr } = await supabase
        .from('pedido_lineas')
        .insert(lineasInsert)
        .select();
      if (linErr) throw linErr;

      // 4. Crear entradas de stock (pendiente) — una por línea
      const stockInsert = payload.lineas.map((l, i) => ({
        pedido_id:       pedido.id,
        pedido_linea_id: lineas?.[i]?.id ?? null,
        proveedor_id:    payload.proveedor_id,
        producto_nombre: l.nombre_producto,
        referencia:      l.referencia,
        cantidad_pedida: l.cantidad,
        unidad:          l.unidad,
        precio_unitario: l.precio_unitario,
        estado:          'pendiente' as const,
      }));
      await supabase.from('stock_entradas').insert(stockInsert);

      // 5. Generar PDF
      const totalEstimado = payload.lineas.reduce((sum, l) => {
        return sum + (l.precio_unitario != null ? l.precio_unitario * l.cantidad : 0);
      }, 0);

      const pdfBlob = await generarPedidoPDF({
        numeroPedido:       pedido.numero_pedido ?? pedido.id.slice(0, 8).toUpperCase(),
        proveedor:          prov ?? { empresa: 'Proveedor' },
        lineas:             payload.lineas.map(l => ({
          nombre:    l.nombre_producto,
          referencia: l.referencia,
          cantidad:  l.cantidad,
          unidad:    l.unidad,
          precio:    l.precio_unitario,
          subtotal:  l.precio_unitario != null ? l.precio_unitario * l.cantidad : null,
        })),
        urgencia:           payload.urgencia,
        metodoEnvio:        payload.metodo_envio ?? 'manual',
        empresaSolicitante: payload.empresa_solicitante,
        notas:              payload.notas,
        fechaEnvio:         ahora,
        totalEstimado,
      });

      // 6. Subir PDF a Storage
      const pdfPath = `${pedido.id}.pdf`;
      const { error: upErr } = await supabase.storage
        .from('pedidos-pdf')
        .upload(pdfPath, pdfBlob, { contentType: 'application/pdf', upsert: true });

      let pdfUrl: string | null = null;
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage
          .from('pedidos-pdf')
          .getPublicUrl(pdfPath);
        pdfUrl = publicUrl;
        await supabase.from('pedidos').update({ pdf_url: pdfUrl }).eq('id', pedido.id);
      }

      return { pedido: { ...pedido, pdf_url: pdfUrl }, pdfBlob, totalEstimado };
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pedidos'] });
      qc.invalidateQueries({ queryKey: ['stock-entradas'] });
      toast.success('Pedido creado correctamente');
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : 'Error al crear el pedido'),
  });
}

// ── Email real via Resend (Edge Function send-email) ────────

function buildEmailHTML(params: {
  numeroPedido: string;
  proveedor: string;
  representante: string | null | undefined;
  lineas: { nombre: string; cantidad: number; unidad: string | null; precio: number | null }[];
  urgencia: string;
  empresa: string;
  notas: string | null | undefined;
  total: number;
}): string {
  const urgLabel: Record<string, string> = { normal: 'Normal', urgente: 'URGENTE', muy_urgente: 'MUY URGENTE' };
  const lineasHTML = params.lineas
    .map(l => `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8d4;">${l.nombre}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8d4;text-align:center;">${l.cantidad} ${l.unidad ?? ''}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8d4;text-align:right;">${l.precio != null ? l.precio.toFixed(2) + ' €' : '—'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e8d4;text-align:right;">${l.precio != null ? (l.precio * l.cantidad).toFixed(2) + ' €' : '—'}</td>
    </tr>`)
    .join('');

  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#faf8f4;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
    <div style="background:linear-gradient(135deg,#c8a96e,#d4a574);padding:28px 32px;">
      <h1 style="color:#fff;margin:0;font-size:20px;">PEDIDO DE SUMINISTROS</h1>
      <p style="color:#fff9f0;margin:6px 0 0;font-size:14px;">Nº ${params.numeroPedido} · ${new Date().toLocaleDateString('es-ES')}</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#7c6040;font-size:13px;margin-bottom:4px;">Estimado/a ${params.representante ?? 'equipo de ventas'},</p>
      <p style="color:#5a4a3a;font-size:14px;">Desde <strong>${params.empresa}</strong> realizamos el siguiente pedido con urgencia <strong>${urgLabel[params.urgencia] ?? params.urgencia}</strong>:</p>

      <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:13px;">
        <thead>
          <tr style="background:#f5ede0;">
            <th style="padding:10px 12px;text-align:left;color:#7c6040;">Producto</th>
            <th style="padding:10px 12px;text-align:center;color:#7c6040;">Cantidad</th>
            <th style="padding:10px 12px;text-align:right;color:#7c6040;">Precio u.</th>
            <th style="padding:10px 12px;text-align:right;color:#7c6040;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${lineasHTML}</tbody>
        <tfoot>
          <tr style="background:#fdf6ec;">
            <td colspan="3" style="padding:12px;text-align:right;font-weight:bold;color:#5a4a3a;">TOTAL ESTIMADO</td>
            <td style="padding:12px;text-align:right;font-weight:bold;color:#c8a96e;font-size:15px;">${params.total.toFixed(2)} €</td>
          </tr>
        </tfoot>
      </table>

      ${params.notas ? `<div style="margin-top:20px;padding:14px;background:#fdf6ec;border-left:3px solid #c8a96e;border-radius:4px;font-size:13px;color:#5a4a3a;"><strong>Notas:</strong> ${params.notas}</div>` : ''}

      <p style="margin-top:24px;font-size:13px;color:#7c6040;">Se adjunta el PDF del pedido completo.<br>Por favor confirme la recepción y disponibilidad de los productos.<br><br>Un saludo,<br><strong>${params.empresa}</strong></p>
    </div>
    <div style="background:#f5ede0;padding:14px 32px;text-align:center;font-size:11px;color:#a08060;">
      Generado automáticamente por Omnia Beauty · ${new Date().toLocaleDateString('es-ES')}
    </div>
  </div>
  </body></html>`;
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function useSendPedidoEmail() {
  return useMutation({
    mutationFn: async (params: {
      to: string;
      numeroPedido: string;
      proveedor: { empresa: string; representante?: string | null };
      lineas: LineaFormData[];
      urgencia: PedidoRow['urgencia'];
      empresa: string;
      notas: string | null | undefined;
      total: number;
      pdfBlob: Blob;
    }) => {
      const [pdfBase64] = await Promise.all([blobToBase64(params.pdfBlob)]);

      const html = buildEmailHTML({
        numeroPedido:  params.numeroPedido,
        proveedor:     params.proveedor.empresa,
        representante: params.proveedor.representante,
        lineas:        params.lineas.map(l => ({
          nombre:   l.nombre_producto,
          cantidad: l.cantidad,
          unidad:   l.unidad,
          precio:   l.precio_unitario,
        })),
        urgencia: params.urgencia,
        empresa:  params.empresa,
        notas:    params.notas,
        total:    params.total,
      });

      const { error } = await supabase.functions.invoke('resend-email', {
        body: {
          to:        params.to,
          subject:   `Pedido Nº ${params.numeroPedido} — ${params.empresa}`,
          html,
          pdfBase64,
          filename:  `Pedido-${params.numeroPedido}.pdf`,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => toast.success('Email enviado correctamente al proveedor'),
    onError:   (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Error al enviar el email';
      toast.error(`Email no enviado: ${msg}. Verifica que la Edge Function "send-email" está desplegada y el secret RESEND_API_KEY configurado.`);
    },
  });
}

export function useUpdateEstadoPedido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: PedidoRow['estado'] }) => {
      const { error } = await supabase.from('pedidos').update({ estado }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pedidos'] }),
  });
}

export function useConfirmarRecepcion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id, cantidadRecibida,
    }: { id: string; cantidadRecibida: number }) => {
      const { error } = await supabase
        .from('stock_entradas')
        .update({
          estado:            'recibido',
          cantidad_recibida: cantidadRecibida,
          fecha_recibida:    new Date().toISOString().split('T')[0],
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-entradas'] });
      toast.success('Recepción confirmada');
    },
  });
}

export function useMarcarIncidencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nota }: { id: string; nota: string }) => {
      const { error } = await supabase
        .from('stock_entradas')
        .update({ estado: 'incidencia', notas_incidencia: nota })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-entradas'] });
      toast.success('Incidencia registrada');
    },
  });
}

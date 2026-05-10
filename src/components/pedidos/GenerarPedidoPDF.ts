import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface LineaPDF {
  nombre: string;
  referencia?: string | null;
  cantidad: number;
  unidad?: string | null;
  precio?: number | null;
  subtotal?: number | null;
}

export interface PedidoPDFData {
  numeroPedido: string;
  proveedor: {
    empresa: string;
    marca?: string | null;
    representante?: string | null;
    email_empresa?: string | null;
    email_comercial?: string | null;
    telefono?: string | null;
  };
  lineas: LineaPDF[];
  urgencia: 'normal' | 'urgente' | 'muy_urgente';
  metodoEnvio: 'email' | 'whatsapp' | 'manual';
  empresaSolicitante: string;
  notas?: string | null;
  fechaEnvio: Date;
  totalEstimado: number;
}

const URGENCIA_LABEL: Record<string, string> = {
  normal:      'Normal',
  urgente:     'URGENTE',
  muy_urgente: 'MUY URGENTE',
};

const METODO_LABEL: Record<string, string> = {
  email:     'Email',
  whatsapp:  'WhatsApp',
  manual:    'Manual / Sin envío',
};

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res  = await fetch('/LOGO ANDREA.jpg');
    const blob = await res.blob();
    return new Promise<string>(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generarPedidoPDF(data: PedidoPDFData): Promise<Blob> {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const logo = await loadLogoDataUrl();
  const fmtDate = (d: Date) =>
    d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const fmtTime = (d: Date) =>
    d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  // ── Cabecera ────────────────────────────────────────────
  if (logo) {
    doc.addImage(logo, 'JPEG', 14, 8, 28, 28);
  }

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('PEDIDO DE SUMINISTROS', logo ? 46 : 14, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Nº ${data.numeroPedido}`, logo ? 46 : 14, 22);
  doc.text(`Fecha: ${fmtDate(data.fechaEnvio)}  ·  Hora: ${fmtTime(data.fechaEnvio)}`, logo ? 46 : 14, 27);

  const urgLabel = URGENCIA_LABEL[data.urgencia] ?? data.urgencia;
  const urgColor = data.urgencia === 'muy_urgente' ? [200, 50, 50] as const
                 : data.urgencia === 'urgente'     ? [200, 120, 20] as const
                 : [60, 140, 60] as const;
  doc.setTextColor(...urgColor);
  doc.setFont('helvetica', 'bold');
  doc.text(`Urgencia: ${urgLabel}`, logo ? 46 : 14, 32);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');

  doc.text(`Envío: ${METODO_LABEL[data.metodoEnvio] ?? data.metodoEnvio}`, 130, 32);

  // Línea separadora
  doc.setDrawColor(200, 170, 100);
  doc.setLineWidth(0.4);
  doc.line(14, 39, 196, 39);

  // ── Bloque proveedor ─────────────────────────────────────
  let y = 44;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('PROVEEDOR', 14, y);
  doc.text('SOLICITANTE', 110, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  const provLines = [
    data.proveedor.empresa,
    data.proveedor.marca            ? `Marca: ${data.proveedor.marca}` : null,
    data.proveedor.representante    ? `Rep.: ${data.proveedor.representante}` : null,
    data.proveedor.telefono         ? `Tel.: ${data.proveedor.telefono}` : null,
    data.proveedor.email_comercial  ? data.proveedor.email_comercial : (data.proveedor.email_empresa ?? null),
  ].filter(Boolean) as string[];

  provLines.forEach(l => { doc.text(l, 14, y); y += 4.5; });

  doc.setTextColor(60, 60, 60);
  doc.text(data.empresaSolicitante, 110, y - (provLines.length * 4.5) + 4.5);

  // ── Tabla de líneas ─────────────────────────────────────
  y = Math.max(y, 72);
  doc.setDrawColor(200, 170, 100);
  doc.line(14, y, 196, y);
  y += 3;

  const tableRows = data.lineas.map((l, i) => [
    String(i + 1),
    l.nombre,
    l.referencia ?? '—',
    `${l.cantidad}${l.unidad ? ' ' + l.unidad : ''}`,
    l.precio    != null ? `${l.precio.toFixed(2)} €`    : '—',
    l.subtotal  != null ? `${l.subtotal.toFixed(2)} €`  : '—',
  ]);

  autoTable(doc, {
    startY:    y,
    head:      [['#', 'Producto', 'Referencia', 'Cantidad', 'Precio u.', 'Subtotal']],
    body:      tableRows,
    margin:    { left: 14, right: 14 },
    headStyles: {
      fillColor:  [180, 145, 80],
      textColor:  255,
      fontStyle:  'bold',
      fontSize:   9,
    },
    bodyStyles:     { fontSize: 8.5, textColor: [50, 50, 50] },
    alternateRowStyles: { fillColor: [252, 248, 240] },
    columnStyles: {
      0: { cellWidth: 8,  halign: 'center' },
      1: { cellWidth: 60 },
      2: { cellWidth: 30 },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
  });

  // ── Total ────────────────────────────────────────────────
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  doc.setFillColor(245, 235, 210);
  doc.rect(120, finalY, 76, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(100, 70, 20);
  doc.text('COSTE ESTIMADO TOTAL:', 123, finalY + 6.5);
  doc.setFontSize(12);
  doc.setTextColor(140, 100, 20);
  doc.text(`${data.totalEstimado.toFixed(2)} €`, 188, finalY + 6.5, { align: 'right' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(140, 140, 140);
  doc.text('(Según lista de precios vigente del proveedor)', 123, finalY + 11);

  // ── Notas ────────────────────────────────────────────────
  if (data.notas) {
    const notasY = finalY + 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text('NOTAS:', 14, notasY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const lines = doc.splitTextToSize(data.notas, 182);
    doc.text(lines, 14, notasY + 5);
  }

  // ── Pie ──────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(170, 170, 170);
  doc.text(
    `Generado automáticamente por Omnia Beauty · ${data.empresaSolicitante} · ${fmtDate(data.fechaEnvio)} ${fmtTime(data.fechaEnvio)}`,
    doc.internal.pageSize.getWidth() / 2,
    pageH - 8,
    { align: 'center' },
  );

  return doc.output('blob');
}

import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Copy, Printer, QrCode, Smartphone } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { usePendingCount } from '@/hooks/useBookingRequests';

export default function QRCodePage() {
  const bookingUrl = 'https://omnia-beauty-dash-andrea-s-estilista.vercel.app/book';
  const qrRef = useRef<HTMLDivElement>(null);
  const { data: pendingCount = 0 } = usePendingCount();

  const copyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    toast.success('Enlace copiado al portapapeles');
  };

  const handlePrint = () => window.print();

  const downloadSVG = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AS-Belleza-QR-Reservas.svg';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('QR descargado');
  };

  return (
    <div className="min-h-screen marble-bg pb-24">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-serif font-semibold text-foreground">Código QR</h1>
          <p className="text-sm text-gold mt-1">Portal de reservas online para clientes</p>
        </div>

        {/* QR Card */}
        <div className="bg-card rounded-3xl border border-gold-light/30 shadow-luxury p-8 flex flex-col items-center gap-6 animate-fade-in">
          {/* QR code */}
          <div
            ref={qrRef}
            className="p-4 bg-white rounded-2xl shadow-md border border-gold-light/30"
          >
            <QRCodeSVG
              value={bookingUrl}
              size={200}
              level="H"
              includeMargin={false}
              imageSettings={{
                src: '/LOGO ANDREA.jpg',
                x: undefined,
                y: undefined,
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
          </div>

          {/* Branding */}
          <div className="text-center">
            <p className="font-serif font-semibold text-foreground">AS · Belleza y Bienestar</p>
            <p className="text-sm text-gold mt-0.5">Escanea y reserva tu cita</p>
          </div>

          {/* URL */}
          <div className="w-full bg-gold/5 rounded-2xl border border-gold-light/30 p-3 flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-gold shrink-0" />
            <span className="text-xs text-muted-foreground truncate flex-1">{bookingUrl}</span>
            <button onClick={copyLink} className="text-gold hover:text-gold-dark transition-colors">
              <Copy className="h-4 w-4" />
            </button>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-2 w-full">
            <Button onClick={copyLink} variant="outline" size="sm"
              className="border-gold-light/40 text-gold hover:bg-gold/5 flex-col h-14 gap-1 text-xs">
              <Copy className="h-4 w-4" />
              Copiar
            </Button>
            <Button onClick={handlePrint} variant="outline" size="sm"
              className="border-gold-light/40 text-gold hover:bg-gold/5 flex-col h-14 gap-1 text-xs">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button onClick={downloadSVG} variant="outline" size="sm"
              className="border-gold-light/40 text-gold hover:bg-gold/5 flex-col h-14 gap-1 text-xs">
              <Download className="h-4 w-4" />
              Descargar
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 animate-fade-in">
          <div className="bg-card rounded-2xl border border-gold-light/30 p-4 text-center">
            <p className="text-2xl font-serif font-bold text-gold">
              {pendingCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Reservas pendientes</p>
          </div>
          <div className="bg-card rounded-2xl border border-gold-light/30 p-4 text-center">
            <p className="text-2xl font-serif font-bold text-gold">/book</p>
            <p className="text-xs text-muted-foreground mt-1">Ruta del portal</p>
          </div>
        </div>

        {/* How to use */}
        <div className="bg-card rounded-2xl border border-gold-light/20 p-5 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-gold" />
            <h3 className="font-medium text-foreground text-sm">Cómo usar el QR</h3>
          </div>
          <ol className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="h-5 w-5 rounded-full bg-gold/10 text-gold text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-semibold">1</span>
              Imprime el QR y colócalo en recepción, escaparate o tarjetas de visita
            </li>
            <li className="flex items-start gap-2">
              <span className="h-5 w-5 rounded-full bg-gold/10 text-gold text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-semibold">2</span>
              La cliente escanea con la cámara del móvil y accede al portal de reservas
            </li>
            <li className="flex items-start gap-2">
              <span className="h-5 w-5 rounded-full bg-gold/10 text-gold text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-semibold">3</span>
              Elige tratamiento, fecha y hora disponible, e introduce sus datos
            </li>
            <li className="flex items-start gap-2">
              <span className="h-5 w-5 rounded-full bg-gold/10 text-gold text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-semibold">4</span>
              Recibes la solicitud aquí en "Reservas" y la confirmas con un toque
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Bell, Copy, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificacionConPublicacion } from '@/hooks/useMarketingNotificaciones';
import { useConfirmarPublicacion, useOmitirPublicacion } from '@/hooks/useMarketing';
import { construirTextoNotificacion } from '@/lib/marketingEngine';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── Helpers ──────────────────────────────────────────────────

const PLAT_EMOJI: Record<string, string> = {
  instagram: '📸', facebook: '👥', whatsapp: '💬',
  tiktok: '🎵', x: '𝕏', web: '🌐', todos: '📢',
};

function CountdownBadge({ fechaEnvio }: { fechaEnvio: string }) {
  const [label, setLabel] = useState('');

  useEffect(() => {
    const calc = () => {
      const diff = new Date(fechaEnvio).getTime() - Date.now();
      if (diff <= 0) { setLabel('¡AHORA!'); return; }
      const mins = Math.floor(diff / 60000);
      const hrs  = Math.floor(mins / 60);
      if (hrs > 24) setLabel(`En ${Math.floor(hrs / 24)}d`);
      else if (hrs > 0) setLabel(`En ${hrs}h ${mins % 60}m`);
      else setLabel(`En ${mins}min`);
    };
    calc();
    const t = setInterval(calc, 30_000);
    return () => clearInterval(t);
  }, [fechaEnvio]);

  const isNow = label === '¡AHORA!';
  return (
    <span className={cn(
      'text-[10px] font-bold px-2 py-0.5 rounded-full border',
      isNow ? 'bg-rose-500 text-white border-rose-500 animate-pulse' : 'bg-amber-50 border-amber-300/50 text-amber-600',
    )}>
      {label}
    </span>
  );
}

// ── Componente ───────────────────────────────────────────────

interface NotificacionCardProps {
  notificacion: NotificacionConPublicacion;
}

export function NotificacionCard({ notificacion }: NotificacionCardProps) {
  const pub       = notificacion.marketing_publicaciones;
  const confirmar = useConfirmarPublicacion();
  const omitir    = useOmitirPublicacion();
  const [copied, setCopied]   = useState(false);

  if (!pub) return null;

  const emoji   = PLAT_EMOJI[pub.plataforma] ?? '📢';
  const plat    = pub.plataforma.charAt(0).toUpperCase() + pub.plataforma.slice(1);
  const hora    = pub.hora_publicacion.slice(0, 5);
  const mensaje = construirTextoNotificacion(notificacion.tipo, pub.plataforma, pub.titulo ?? '', hora);

  const handleCopy = async () => {
    const fullText = pub.texto_publicacion + (pub.hashtags ? '\n\n' + pub.hashtags : '');
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success('Texto copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  const isUrgent = notificacion.tipo === 'momento' || notificacion.tipo === 'recordatorio_30min';

  return (
    <div className={cn(
      'bg-card border rounded-2xl overflow-hidden space-y-0',
      isUrgent ? 'border-rose-300/60 shadow-sm' : 'border-gold-light/20',
    )}>
      {/* Cabecera */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-3',
        isUrgent && 'bg-rose-50/50 dark:bg-rose-400/5',
      )}>
        <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-gold/10 text-lg shrink-0">
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{plat} · {pub.fecha_publicacion} · {hora}</p>
          <p className="text-sm font-medium text-foreground truncate">
            {pub.titulo ?? pub.texto_publicacion.slice(0, 50)}
          </p>
        </div>
        <CountdownBadge fechaEnvio={notificacion.fecha_envio} />
      </div>

      {/* Mensaje de la notificación */}
      <div className="px-4 py-2 bg-gold/5 border-t border-gold-light/15">
        <p className="text-xs text-muted-foreground">{mensaje}</p>
      </div>

      {/* Texto completo a publicar */}
      <div className="px-4 py-3 space-y-2 border-t border-gold-light/10">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs text-muted-foreground font-medium">Texto a publicar:</p>
          <button
            onClick={handleCopy}
            className="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-gold hover:bg-gold/10 transition-colors"
            title="Copiar texto"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
        <p className="text-xs text-foreground whitespace-pre-line line-clamp-4">
          {pub.texto_publicacion}
        </p>
        {pub.hashtags && (
          <p className="text-[10px] text-blue-500/70">{pub.hashtags}</p>
        )}
      </div>

      {/* Foto si tiene */}
      {pub.url_imagen_custom && (
        <div className="px-4 pb-3">
          <img
            src={pub.url_imagen_custom}
            alt="foto publicación"
            className="w-full max-h-32 object-cover rounded-xl border border-gold-light/20"
          />
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-2 px-4 py-3 border-t border-gold-light/10 bg-card">
        <Button
          onClick={() => confirmar.mutate(pub.id)}
          disabled={confirmar.isPending}
          size="sm"
          variant="luxury"
          className="flex-1 h-9 text-xs"
        >
          <Check className="h-3.5 w-3.5 mr-1" />
          Ya publiqué — Confirmar
        </Button>
        <Button
          onClick={() => omitir.mutate(pub.id)}
          disabled={omitir.isPending}
          size="sm"
          variant="outline"
          className="h-9 border-gold-light/40 text-muted-foreground text-xs"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

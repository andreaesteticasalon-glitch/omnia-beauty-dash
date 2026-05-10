import { useState } from 'react';
import { ClientEvidenciaRow } from '@/integrations/supabase/types';
import { Star, Trash2, ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Helpers ──────────────────────────────────────────────────

const TIPO_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  antes:     { label: 'ANTES',     bg: 'bg-amber-400',   text: 'text-white' },
  despues:   { label: 'DESPUÉS',   bg: 'bg-emerald-500', text: 'text-white' },
  proceso:   { label: 'PROCESO',   bg: 'bg-blue-500',    text: 'text-white' },
  resultado: { label: 'RESULTADO', bg: 'bg-rosegold',    text: 'text-white' },
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

// ── Lightbox ─────────────────────────────────────────────────

function Lightbox({
  evidencias, index, onClose, onPrev, onNext,
}: {
  evidencias: ClientEvidenciaRow[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const ev = evidencias[index];
  if (!ev) return null;
  const style = TIPO_STYLES[ev.tipo] ?? TIPO_STYLES.resultado;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Navegación */}
      {evidencias.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); onPrev(); }}
            className="absolute left-4 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onNext(); }}
            className="absolute right-4 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <div className="max-w-2xl w-full px-4" onClick={e => e.stopPropagation()}>
        {ev.tipo_media === 'video' ? (
          <video src={ev.url} controls className="w-full rounded-2xl max-h-[70vh] object-contain" />
        ) : (
          <img src={ev.url} alt={ev.tratamiento ?? ev.tipo} className="w-full rounded-2xl max-h-[70vh] object-contain" />
        )}
        <div className="mt-3 flex items-center gap-2">
          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', style.bg, style.text)}>
            {style.label}
          </span>
          {ev.tratamiento && <span className="text-sm text-white/80">{ev.tratamiento}</span>}
          <span className="text-xs text-white/50 ml-auto">{fmtDate(ev.fecha)}</span>
          {ev.uso_marketing && <Star className="h-4 w-4 text-gold fill-gold" />}
        </div>
        {ev.descripcion && <p className="text-xs text-white/60 mt-1">{ev.descripcion}</p>}
      </div>
    </div>
  );
}

// ── Comparador antes/después ──────────────────────────────────

function Comparador({ antes, despues }: { antes: ClientEvidenciaRow; despues: ClientEvidenciaRow }) {
  return (
    <div className="rounded-2xl border border-gold-light/20 overflow-hidden">
      <div className="text-[10px] font-semibold text-center text-gold/70 py-1.5 bg-gold/5 border-b border-gold-light/15">
        Comparativa antes / después
      </div>
      <div className="grid grid-cols-2">
        <div className="relative">
          <img src={antes.url}   alt="antes"   className="w-full aspect-square object-cover" />
          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-400 text-white">ANTES</span>
        </div>
        <div className="relative border-l border-gold-light/20">
          <img src={despues.url} alt="después" className="w-full aspect-square object-cover" />
          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500 text-white">DESPUÉS</span>
        </div>
      </div>
    </div>
  );
}

// ── EvidenciaGrid ─────────────────────────────────────────────

interface EvidenciaGridProps {
  evidencias:        ClientEvidenciaRow[];
  clientId:          string;
  onDelete:          (id: string, clientId: string, url: string) => void;
  onToggleMarketing: (id: string, clientId: string, current: boolean) => void;
}

export function EvidenciaGrid({ evidencias, clientId, onDelete, onToggleMarketing }: EvidenciaGridProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (evidencias.length === 0) {
    return (
      <div className="text-center py-10 space-y-2">
        <div className="h-16 w-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto">
          <ZoomIn className="h-8 w-8 text-gold/40" strokeWidth={1.5} />
        </div>
        <p className="text-sm text-muted-foreground">Sin evidencias todavía</p>
        <p className="text-xs text-muted-foreground">Añade fotos de antes y después del tratamiento</p>
      </div>
    );
  }

  // Agrupar comparadores por cita (si hay antes + después de la misma cita)
  const comparadores: Array<{ antes: ClientEvidenciaRow; despues: ClientEvidenciaRow }> = [];
  const citasConAntes   = evidencias.filter(e => e.tipo === 'antes'   && e.appointment_id);
  const citasConDespues = evidencias.filter(e => e.tipo === 'despues' && e.appointment_id);
  const usadasEnComp    = new Set<string>();

  citasConAntes.forEach(ant => {
    const des = citasConDespues.find(d => d.appointment_id === ant.appointment_id);
    if (des) {
      comparadores.push({ antes: ant, despues: des });
      usadasEnComp.add(ant.id);
      usadasEnComp.add(des.id);
    }
  });

  return (
    <>
      {/* Comparadores */}
      {comparadores.length > 0 && (
        <div className="space-y-3 mb-4">
          {comparadores.map(({ antes, despues }) => (
            <Comparador key={antes.id + despues.id} antes={antes} despues={despues} />
          ))}
        </div>
      )}

      {/* Galería grid */}
      <div className="grid grid-cols-2 gap-2">
        {evidencias.map((ev, idx) => {
          const style = TIPO_STYLES[ev.tipo] ?? TIPO_STYLES.resultado;
          return (
            <div
              key={ev.id}
              className="relative group rounded-xl overflow-hidden border border-gold-light/20 aspect-square bg-muted"
            >
              {/* Miniatura */}
              {ev.tipo_media === 'video' ? (
                <video src={ev.url} className="w-full h-full object-cover" />
              ) : (
                <img src={ev.url} alt={ev.tratamiento ?? ev.tipo} className="w-full h-full object-cover" />
              )}

              {/* Badge tipo */}
              <span className={cn(
                'absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold',
                style.bg, style.text,
              )}>
                {style.label}
              </span>

              {/* Estrella marketing */}
              {ev.uso_marketing && (
                <span className="absolute top-1 right-1">
                  <Star className="h-3.5 w-3.5 text-gold fill-gold drop-shadow" />
                </span>
              )}

              {/* Overlay acciones al hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => setLightboxIdx(idx)}
                  className="h-8 w-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onToggleMarketing(ev.id, clientId, ev.uso_marketing)}
                  className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center hover:scale-110 transition-transform',
                    ev.uso_marketing ? 'bg-gold/80 text-white' : 'bg-white/20 text-white hover:bg-gold/60',
                  )}
                  title={ev.uso_marketing ? 'Quitar de marketing' : 'Autorizar para marketing'}
                >
                  <Star className={cn('h-4 w-4', ev.uso_marketing && 'fill-white')} />
                </button>
                <button
                  onClick={() => {
                    if (confirm('¿Eliminar esta evidencia?')) onDelete(ev.id, clientId, ev.url);
                  }}
                  className="h-8 w-8 rounded-full bg-rose-500/80 text-white flex items-center justify-center hover:bg-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Pie con fecha */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                <p className="text-[9px] text-white/80 truncate">{ev.tratamiento ?? ''}</p>
                <p className="text-[9px] text-white/60">{fmtDate(ev.fecha)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox
          evidencias={evidencias}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onPrev={() => setLightboxIdx(i => i !== null ? Math.max(0, i - 1) : 0)}
          onNext={() => setLightboxIdx(i => i !== null ? Math.min(evidencias.length - 1, i + 1) : 0)}
        />
      )}
    </>
  );
}

import { useState } from 'react';
import { Plus, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MarketingPublicacionRow, MarketingPlanRow } from '@/integrations/supabase/types';
import { PublicacionSheet } from './PublicacionSheet';
import { useConfirmarPlan } from '@/hooks/useMarketing';
import { cn } from '@/lib/utils';

// ── Constantes ───────────────────────────────────────────────

const PLAT_CONFIG: Record<string, { emoji: string; color: string }> = {
  instagram: { emoji: '📸', color: 'bg-pink-500/10 border-pink-300/50 text-pink-600' },
  facebook:  { emoji: '👥', color: 'bg-blue-500/10 border-blue-300/50 text-blue-600' },
  whatsapp:  { emoji: '💬', color: 'bg-emerald-500/10 border-emerald-300/50 text-emerald-600' },
  tiktok:    { emoji: '🎵', color: 'bg-black/5 border-gray-300/50 text-gray-700' },
  x:         { emoji: '𝕏', color: 'bg-sky-500/10 border-sky-300/50 text-sky-600' },
  web:       { emoji: '🌐', color: 'bg-violet-500/10 border-violet-300/50 text-violet-600' },
  todos:     { emoji: '📢', color: 'bg-gold/10 border-gold/30 text-gold' },
};

const ESTADO_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  pendiente:  { icon: Clock,         color: 'text-muted-foreground' },
  notificada: { icon: AlertCircle,   color: 'text-amber-500' },
  confirmada: { icon: CheckCircle2,  color: 'text-blue-500' },
  publicada:  { icon: CheckCircle2,  color: 'text-emerald-500' },
  omitida:    { icon: AlertCircle,   color: 'text-rose-400' },
};

const fmtFecha = (d: string) =>
  new Date(d + 'T12:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

// ── Componente ───────────────────────────────────────────────

interface PlanTimelineProps {
  plan:          MarketingPlanRow;
  publicaciones: MarketingPublicacionRow[];
}

export function PlanTimeline({ plan, publicaciones }: PlanTimelineProps) {
  const [editPub, setEditPub] = useState<MarketingPublicacionRow | null>(null);
  const confirmarPlan = useConfirmarPlan();

  // Agrupar por fecha
  const porFecha = publicaciones.reduce<Record<string, MarketingPublicacionRow[]>>((acc, pub) => {
    const key = pub.fecha_publicacion;
    if (!acc[key]) acc[key] = [];
    acc[key].push(pub);
    return acc;
  }, {});

  const fechasOrdenadas = Object.keys(porFecha).sort();
  const totalPublicadas = publicaciones.filter(p => p.estado === 'publicada').length;
  const esBorrador = plan.estado === 'borrador';

  return (
    <>
      {/* Cabecera del plan */}
      <div className="bg-gradient-to-r from-gold/10 to-rosegold/5 rounded-2xl p-4 border border-gold-light/30 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif font-semibold text-foreground text-sm">{plan.nombre}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {fmtFecha(plan.fecha_inicio)} → {fmtFecha(plan.fecha_fin)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className={cn(
                'text-[10px] border',
                esBorrador ? 'bg-amber-50 border-amber-300/50 text-amber-600' : 'bg-emerald-50 border-emerald-300/50 text-emerald-600',
              )}>
                {plan.estado.charAt(0).toUpperCase() + plan.estado.slice(1)}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {publicaciones.length} publicaciones · {totalPublicadas} publicadas
              </span>
            </div>
          </div>
          {esBorrador && (
            <Button
              onClick={() => confirmarPlan.mutate(plan.id)}
              disabled={confirmarPlan.isPending}
              size="sm"
              variant="luxury"
              className="shrink-0 text-xs h-9"
            >
              ✓ Confirmar Plan
            </Button>
          )}
        </div>
        {plan.objetivos && (
          <p className="text-xs text-muted-foreground mt-3 italic border-t border-gold-light/20 pt-2">
            {plan.objetivos}
          </p>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {fechasOrdenadas.map(fecha => (
          <div key={fecha}>
            <p className="text-xs font-semibold text-gold/70 uppercase tracking-wider mb-2 px-1">
              {fmtFecha(fecha)}
            </p>
            <div className="space-y-2">
              {porFecha[fecha]
                .sort((a, b) => a.hora_publicacion.localeCompare(b.hora_publicacion))
                .map(pub => {
                  const plat = PLAT_CONFIG[pub.plataforma] ?? PLAT_CONFIG.todos;
                  const est  = ESTADO_CONFIG[pub.estado] ?? ESTADO_CONFIG.pendiente;
                  const EstIcon = est.icon;

                  return (
                    <button
                      key={pub.id}
                      onClick={() => esBorrador && setEditPub(pub)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                        `border-gold-light/20 bg-card hover:border-gold/30`,
                        esBorrador && 'cursor-pointer hover:shadow-sm',
                        !esBorrador && 'cursor-default',
                      )}
                    >
                      {/* Hora */}
                      <span className="text-xs font-mono text-gold font-semibold shrink-0 w-12">
                        {pub.hora_publicacion.slice(0, 5)}
                      </span>

                      {/* Plataforma */}
                      <span className={cn('text-xs px-2 py-0.5 rounded-full border shrink-0', plat.color)}>
                        {plat.emoji} {pub.plataforma}
                      </span>

                      {/* Título */}
                      <span className="flex-1 text-xs text-foreground truncate">
                        {pub.titulo ?? pub.texto_publicacion.slice(0, 40)}
                      </span>

                      {/* Estado */}
                      <EstIcon className={cn('h-4 w-4 shrink-0', est.color)} />
                    </button>
                  );
                })}
            </div>
          </div>
        ))}

        {publicaciones.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            El plan está vacío. Genera publicaciones desde el análisis.
          </div>
        )}
      </div>

      {/* Sheet edición */}
      <PublicacionSheet
        pub={editPub}
        open={!!editPub}
        onClose={() => setEditPub(null)}
      />
    </>
  );
}

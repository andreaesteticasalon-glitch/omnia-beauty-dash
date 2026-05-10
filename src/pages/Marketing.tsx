import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, BarChart3, CalendarDays, Bell, Wifi, History, Plus, CheckCircle2 } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

import { AnalisisPanel } from '@/components/marketing/AnalisisPanel';
import { PlanTimeline } from '@/components/marketing/PlanTimeline';
import { NotificacionCard } from '@/components/marketing/NotificacionCard';
import { ConexionesPanel } from '@/components/marketing/ConexionesPanel';

import { usePlanActivo, usePlanes, useCrearPlan } from '@/hooks/useMarketing';
import {
  useNotificacionesPendientes, useCountNotificacionesPendientes,
  useNotificacionPolling, solicitarPermisoNotificaciones,
} from '@/hooks/useMarketingNotificaciones';
import { AnalisisNegocio, generarPlanEditorial, HORARIOS_OPTIMOS } from '@/lib/marketingEngine';
import { PlataformaMkt } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

// ── Constantes ───────────────────────────────────────────────

const TODAS_PLATAFORMAS: PlataformaMkt[] = ['instagram', 'facebook', 'whatsapp', 'tiktok', 'x', 'web'];
const PLAT_EMOJI: Record<string, string>  = {
  instagram: '📸', facebook: '👥', whatsapp: '💬',
  tiktok: '🎵', x: '𝕏', web: '🌐',
};

const fmtFecha = (d: string) =>
  new Date(d + 'T12:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

// ── Modal permiso notificaciones ─────────────────────────────

function PermisoNotifDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const handlePermitir = async () => {
    await solicitarPermisoNotificaciones();
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="bg-card border border-gold-light/30 max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-foreground">Activar alertas de publicación</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            El sistema te avisará exactamente cuándo publicar en cada red social.
          </DialogDescription>
        </DialogHeader>
        <div className="py-3 space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gold/5 rounded-xl border border-gold-light/20">
            <Bell className="h-8 w-8 text-gold shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-foreground">Notificaciones del navegador</p>
              <p className="text-xs text-muted-foreground">Recibirás alertas 24h antes, 1h antes y en el momento exacto de cada publicación.</p>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-gold-light/50">Ahora no</Button>
          <Button onClick={handlePermitir} variant="luxury">Activar alertas</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Sheet: Generar plan ──────────────────────────────────────

function GenerarPlanSheet({
  open, onClose, analisis,
}: {
  open:     boolean;
  onClose:  () => void;
  analisis: AnalisisNegocio | null;
}) {
  const { data: evidencias = [] } = { data: analisis?.fotosMarketing ?? [] };
  const crearPlan = useCrearPlan();

  const [nombre,       setNombre]       = useState('');
  const [objetivos,    setObjetivos]    = useState('');
  const [plataformas,  setPlataformas]  = useState<PlataformaMkt[]>(['instagram', 'whatsapp']);
  const [diasPlan,     setDiasPlan]     = useState(10);

  const togglePlat = (p: PlataformaMkt) =>
    setPlataformas(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const hoy          = new Date();
  const fechaInicio  = hoy.toISOString().slice(0, 10);
  const fechaFin     = new Date(hoy.getTime() + diasPlan * 86400000).toISOString().slice(0, 10);

  const handleGenerar = async () => {
    if (!analisis || !nombre.trim()) return;

    const publicaciones = generarPlanEditorial({
      analisis,
      recomendaciones: analisis.recomendaciones,
      fechaInicio:     hoy,
      diasPlan,
      plataformas,
      evidenciasDisponibles: analisis.fotosMarketing,
    });

    await crearPlan.mutateAsync({
      nombre,
      fecha_inicio: fechaInicio,
      fecha_fin:    fechaFin,
      objetivos:    objetivos || undefined,
      publicaciones,
    });

    setNombre(''); setObjetivos('');
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-card border-l border-gold-light/30">
        <SheetHeader>
          <SheetTitle className="font-serif text-foreground flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-gold" />
            Generar Plan Editorial
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Resumen del análisis */}
          {analisis && (
            <div className="bg-gold/5 rounded-2xl border border-gold-light/20 p-4 space-y-1">
              <p className="text-xs font-medium text-gold-dark">Basado en tu análisis:</p>
              <p className="text-xs text-muted-foreground">
                📊 {analisis.serviciosMasDemandados[0]?.servicio.name ?? '—'} es tu servicio estrella
              </p>
              <p className="text-xs text-muted-foreground">
                📸 {analisis.fotosMarketing.length} foto{analisis.fotosMarketing.length !== 1 ? 's' : ''} disponibles para publicar
              </p>
              <p className="text-xs text-muted-foreground">
                💡 {analisis.recomendaciones.filter(r => r.prioridad === 'alta').length} oportunidades urgentes detectadas
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs text-gold-dark">Nombre del plan *</Label>
            <Input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder={`Plan Marketing ${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-gold-dark">Días de planificación</Label>
            <div className="flex gap-2">
              {[7, 10, 14].map(d => (
                <button
                  key={d}
                  onClick={() => setDiasPlan(d)}
                  className={cn(
                    'flex-1 py-2 rounded-xl border text-xs font-medium transition-all',
                    diasPlan === d ? 'border-gold/50 bg-gold/10 text-foreground' : 'border-gold-light/20 text-muted-foreground',
                  )}
                >
                  {d} días
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {fmtFecha(fechaInicio)} → {fmtFecha(fechaFin)}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-gold-dark">Plataformas a incluir</Label>
            <div className="grid grid-cols-3 gap-2">
              {TODAS_PLATAFORMAS.map(p => (
                <button
                  key={p}
                  onClick={() => togglePlat(p)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-all',
                    plataformas.includes(p)
                      ? 'border-gold/50 bg-gold/10 text-foreground'
                      : 'border-gold-light/20 text-muted-foreground',
                  )}
                >
                  <span className="text-base">{PLAT_EMOJI[p]}</span>
                  <span className="capitalize text-[10px]">{p}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-gold-dark">Objetivos del periodo (opcional)</Label>
            <Textarea
              value={objetivos}
              onChange={e => setObjetivos(e.target.value)}
              placeholder="Ej: Aumentar reservas de manicura semipermanente, promocionar producto X..."
              rows={2}
              className="rounded-xl border-gold-light/50 text-sm"
            />
          </div>

          <Button
            onClick={handleGenerar}
            disabled={!nombre.trim() || plataformas.length === 0 || crearPlan.isPending}
            variant="luxury"
            className="w-full"
            size="lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Generar {diasPlan}-días · {plataformas.length} plataformas
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Página principal ─────────────────────────────────────────

export default function Marketing() {
  const [tab,          setTab]          = useState('analisis');
  const [analisis,     setAnalisis]     = useState<AnalisisNegocio | null>(null);
  const [generarOpen,  setGenerarOpen]  = useState(false);
  const [permisoOpen,  setPermisoOpen]  = useState(false);

  const { data: planActivo }     = usePlanActivo();
  const { data: planes = [] }    = usePlanes();
  const { data: publicaciones }  = { data: planActivo?.marketing_publicaciones ?? [] };
  const { data: notifPendientes = [] } = useNotificacionesPendientes();
  const { data: badgeCount = 0 }       = useCountNotificacionesPendientes();

  // Activar polling de notificaciones
  useNotificacionPolling();

  // Solicitar permiso la primera vez que se abre el módulo
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      setTimeout(() => setPermisoOpen(true), 1500);
    }
  }, []);

  const handleGenerarPlan = (a: AnalisisNegocio) => {
    setAnalisis(a);
    setGenerarOpen(true);
    setTab('plan');
  };

  const planesArchivados = planes.filter(p => p.estado === 'archivado' || p.estado === 'completado');

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Marketing" />

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">

        {/* Badge de notificaciones urgentes */}
        {badgeCount > 0 && (
          <button
            onClick={() => setTab('notificaciones')}
            className="w-full flex items-center gap-3 p-3 rounded-2xl border border-rose-300/50 bg-rose-50/50 dark:bg-rose-400/5 hover:border-rose-400/70 transition-colors"
          >
            <div className="h-9 w-9 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
              <Bell className="h-5 w-5 text-rose-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">
                {badgeCount} publicación{badgeCount !== 1 ? 'es' : ''} pendiente{badgeCount !== 1 ? 's' : ''} de confirmar
              </p>
              <p className="text-xs text-muted-foreground">Toca para ver qué publicar ahora</p>
            </div>
            <span className="h-6 w-6 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-bold shrink-0">
              {badgeCount > 9 ? '9+' : badgeCount}
            </span>
          </button>
        )}

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full bg-gold/10 border border-gold-light/20 h-9 grid grid-cols-5">
            {[
              { value: 'analisis',       icon: BarChart3,    label: 'Análisis'  },
              { value: 'plan',           icon: CalendarDays, label: 'Plan'      },
              { value: 'notificaciones', icon: Bell,         label: 'Alertas',  badge: badgeCount },
              { value: 'conexiones',     icon: Wifi,         label: 'Redes'     },
              { value: 'historial',      icon: History,      label: 'Historial' },
            ].map(({ value, icon: Icon, label, badge }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex flex-col gap-0.5 h-full text-[9px] relative data-[state=active]:bg-card data-[state=active]:text-gold data-[state=active]:shadow-sm"
              >
                <div className="relative">
                  <Icon className="h-3.5 w-3.5" />
                  {badge != null && badge > 0 && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-rose-500 text-white text-[7px] flex items-center justify-center font-bold">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Tab ANÁLISIS ── */}
          <TabsContent value="analisis" className="mt-4">
            <AnalisisPanel onGenerarPlan={handleGenerarPlan} />
          </TabsContent>

          {/* ── Tab PLAN ── */}
          <TabsContent value="plan" className="mt-4">
            {planActivo ? (
              <PlanTimeline
                plan={planActivo}
                publicaciones={publicaciones}
              />
            ) : (
              <div className="text-center py-16 space-y-4">
                <div className="h-16 w-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto">
                  <CalendarDays className="h-8 w-8 text-gold/50" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">No hay plan activo</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ve a "Análisis", analiza los datos del negocio y genera tu primer plan editorial
                  </p>
                </div>
                <Button
                  onClick={() => setTab('analisis')}
                  variant="outline"
                  className="border-gold/40 text-gold"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ir al análisis
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ── Tab NOTIFICACIONES ── */}
          <TabsContent value="notificaciones" className="mt-4 space-y-3">
            {notifPendientes.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <CheckCircle2 className="h-16 w-16 text-emerald-500/40 mx-auto" strokeWidth={1.5} />
                <p className="text-sm text-muted-foreground">No hay publicaciones pendientes de confirmar</p>
                {planActivo?.estado === 'borrador' && (
                  <p className="text-xs text-muted-foreground">Confirma el plan para activar las notificaciones</p>
                )}
              </div>
            ) : (
              notifPendientes.map(n => (
                <NotificacionCard key={n.id} notificacion={n} />
              ))
            )}
          </TabsContent>

          {/* ── Tab CONEXIONES ── */}
          <TabsContent value="conexiones" className="mt-4">
            <ConexionesPanel />
          </TabsContent>

          {/* ── Tab HISTORIAL ── */}
          <TabsContent value="historial" className="mt-4 space-y-3">
            {planes.length === 0 ? (
              <p className="text-center py-10 text-sm text-muted-foreground">Aún no hay planes creados</p>
            ) : (
              planes.map(plan => {
                const pubs = (plan as { marketing_publicaciones?: { estado: string }[] }).marketing_publicaciones ?? [];
                const publicadas = pubs.filter(p => p.estado === 'publicada').length;
                return (
                  <div key={plan.id} className="bg-card border border-gold-light/20 rounded-2xl p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{plan.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {fmtFecha(plan.fecha_inicio)} → {fmtFecha(plan.fecha_fin)}
                        </p>
                      </div>
                      <span className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full border font-medium',
                        plan.estado === 'completado' ? 'bg-emerald-50 border-emerald-300/50 text-emerald-600' :
                        plan.estado === 'archivado'  ? 'bg-muted/40 border-muted text-muted-foreground' :
                        plan.estado === 'confirmado' ? 'bg-blue-50 border-blue-300/50 text-blue-600' :
                        'bg-amber-50 border-amber-300/50 text-amber-600',
                      )}>
                        {plan.estado}
                      </span>
                    </div>
                    {pubs.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {publicadas} / {pubs.length} publicaciones completadas
                      </p>
                    )}
                    {plan.objetivos && (
                      <p className="text-xs text-muted-foreground italic">{plan.objetivos}</p>
                    )}
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modales */}
      <GenerarPlanSheet
        open={generarOpen}
        onClose={() => setGenerarOpen(false)}
        analisis={analisis}
      />
      <PermisoNotifDialog
        open={permisoOpen}
        onClose={() => setPermisoOpen(false)}
      />
    </div>
  );
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  MarketingPlanRow, MarketingPublicacionRow, MarketingConexionRow,
  PlataformaMkt, EstadoPlan, EstadoPublicacion,
} from '@/integrations/supabase/types';
import { PublicacionDraft, programarNotificaciones } from '@/lib/marketingEngine';
import { toast } from 'sonner';

// ── Tipos con JOIN ──────────────────────────────────────────

export type PlanConPublicaciones = MarketingPlanRow & {
  marketing_publicaciones: MarketingPublicacionRow[];
};

// ── Planes ───────────────────────────────────────────────────

export function usePlanes() {
  return useQuery({
    queryKey: ['mkt-planes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_planes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MarketingPlanRow[];
    },
  });
}

export function usePlanActivo() {
  return useQuery({
    queryKey: ['mkt-plan-activo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_planes')
        .select('*, marketing_publicaciones(*)')
        .in('estado', ['borrador', 'confirmado', 'activo'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as PlanConPublicaciones | null;
    },
  });
}

export function usePublicacionesPlan(planId: string | null) {
  return useQuery({
    queryKey: ['mkt-publicaciones', planId],
    enabled: !!planId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_publicaciones')
        .select('*')
        .eq('plan_id', planId!)
        .order('fecha_publicacion')
        .order('hora_publicacion');
      if (error) throw error;
      return data as MarketingPublicacionRow[];
    },
  });
}

// ── Conexiones ───────────────────────────────────────────────

export function useConexiones() {
  return useQuery({
    queryKey: ['mkt-conexiones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_conexiones')
        .select('*')
        .order('plataforma');
      if (error) throw error;
      return data as MarketingConexionRow[];
    },
  });
}

export function useUpsertConexion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conexion: Partial<MarketingConexionRow> & { plataforma: PlataformaMkt }) => {
      const { data: existing } = await supabase
        .from('marketing_conexiones')
        .select('id')
        .eq('plataforma', conexion.plataforma)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('marketing_conexiones')
          .update(conexion)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('marketing_conexiones')
          .insert(conexion as { plataforma: PlataformaMkt });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mkt-conexiones'] });
      toast.success('Configuración guardada');
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Error al guardar'),
  });
}

// ── Crear plan ───────────────────────────────────────────────

export function useCrearPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      nombre:        string;
      fecha_inicio:  string;
      fecha_fin:     string;
      objetivos?:    string;
      publicaciones: PublicacionDraft[];
    }) => {
      // 1. Crear cabecera
      const { data: plan, error: planErr } = await supabase
        .from('marketing_planes')
        .insert({
          nombre:       params.nombre,
          fecha_inicio: params.fecha_inicio,
          fecha_fin:    params.fecha_fin,
          objetivos:    params.objetivos ?? null,
          estado:       'borrador',
        })
        .select()
        .single();
      if (planErr) throw planErr;

      // 2. Crear publicaciones
      if (params.publicaciones.length > 0) {
        const inserts = params.publicaciones.map(p => ({
          plan_id:           plan.id,
          plataforma:        p.plataforma,
          fecha_publicacion: p.fecha,
          hora_publicacion:  p.hora,
          tipo_contenido:    p.tipo_contenido,
          titulo:            p.titulo,
          texto_publicacion: p.texto,
          hashtags:          p.hashtags,
          evidencia_id:      p.evidencia_id ?? null,
          servicio_id:       p.servicio_id ?? null,
          oferta_descripcion: p.oferta_desc ?? null,
          estado:            'pendiente' as EstadoPublicacion,
        }));
        const { error: pubErr } = await supabase
          .from('marketing_publicaciones')
          .insert(inserts);
        if (pubErr) throw pubErr;
      }

      return plan;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mkt-planes'] });
      qc.invalidateQueries({ queryKey: ['mkt-plan-activo'] });
      toast.success('Plan generado correctamente');
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Error al crear el plan'),
  });
}

// ── Confirmar plan → genera notificaciones ───────────────────

export function useConfirmarPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (planId: string) => {
      // 1. Obtener publicaciones del plan
      const { data: pubs, error: pubsErr } = await supabase
        .from('marketing_publicaciones')
        .select('id, fecha_publicacion, hora_publicacion')
        .eq('plan_id', planId);
      if (pubsErr) throw pubsErr;

      // 2. Cambiar estado del plan
      const { error: planErr } = await supabase
        .from('marketing_planes')
        .update({ estado: 'confirmado' as EstadoPlan })
        .eq('id', planId);
      if (planErr) throw planErr;

      // 3. Crear notificaciones para cada publicación
      const notifInserts = (pubs ?? []).flatMap(pub => {
        const notifs = programarNotificaciones(pub.fecha_publicacion, pub.hora_publicacion);
        return notifs.map(n => ({
          publicacion_id: pub.id,
          tipo:           n.tipo,
          fecha_envio:    n.fecha_envio,
        }));
      });

      if (notifInserts.length > 0) {
        const { error: notifErr } = await supabase
          .from('marketing_notificaciones')
          .insert(notifInserts);
        if (notifErr) throw notifErr;
      }

      return { publicaciones: pubs?.length ?? 0, notificaciones: notifInserts.length };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['mkt-planes'] });
      qc.invalidateQueries({ queryKey: ['mkt-plan-activo'] });
      qc.invalidateQueries({ queryKey: ['mkt-notificaciones'] });
      toast.success(`Plan confirmado. ${result.notificaciones} notificaciones programadas.`);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Error al confirmar el plan'),
  });
}

// ── CRUD publicaciones ───────────────────────────────────────

export function useUpdatePublicacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<MarketingPublicacionRow> & { id: string }) => {
      const { error } = await supabase
        .from('marketing_publicaciones')
        .update(patch)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mkt-publicaciones'] });
      qc.invalidateQueries({ queryKey: ['mkt-plan-activo'] });
      toast.success('Publicación actualizada');
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Error al actualizar'),
  });
}

export function useDeletePublicacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('marketing_publicaciones').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mkt-publicaciones'] });
      qc.invalidateQueries({ queryKey: ['mkt-plan-activo'] });
      toast.success('Publicación eliminada');
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Error al eliminar'),
  });
}

export function useConfirmarPublicacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketing_publicaciones')
        .update({ estado: 'publicada' as EstadoPublicacion, confirmada_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      // Marcar notificaciones como confirmadas
      await supabase
        .from('marketing_notificaciones')
        .update({ confirmada: true })
        .eq('publicacion_id', id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mkt-publicaciones'] });
      qc.invalidateQueries({ queryKey: ['mkt-plan-activo'] });
      qc.invalidateQueries({ queryKey: ['mkt-notificaciones'] });
      qc.invalidateQueries({ queryKey: ['mkt-notif-badge'] });
      toast.success('¡Publicación confirmada! ✓');
    },
  });
}

export function useOmitirPublicacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketing_publicaciones')
        .update({ estado: 'omitida' as EstadoPublicacion })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mkt-publicaciones'] });
      qc.invalidateQueries({ queryKey: ['mkt-notificaciones'] });
      qc.invalidateQueries({ queryKey: ['mkt-notif-badge'] });
    },
  });
}

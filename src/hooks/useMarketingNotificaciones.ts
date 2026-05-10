import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MarketingNotificacionRow, MarketingPublicacionRow } from '@/integrations/supabase/types';
import { construirTextoNotificacion } from '@/lib/marketingEngine';

// ── Tipo con JOIN ────────────────────────────────────────────

export type NotificacionConPublicacion = MarketingNotificacionRow & {
  marketing_publicaciones: MarketingPublicacionRow | null;
};

// ── Queries ─────────────────────────────────────────────────

export function useNotificacionesPendientes() {
  return useQuery({
    queryKey: ['mkt-notificaciones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_notificaciones')
        .select('*, marketing_publicaciones(*)')
        .eq('enviada', true)
        .eq('confirmada', false)
        .order('fecha_envio');
      if (error) throw error;
      return data as NotificacionConPublicacion[];
    },
    refetchInterval: 30_000,
  });
}

export function useCountNotificacionesPendientes() {
  return useQuery({
    queryKey: ['mkt-notif-badge'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('marketing_notificaciones')
        .select('id', { count: 'exact', head: true })
        .eq('enviada', true)
        .eq('confirmada', false);
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 30_000,
  });
}

// ── Mutation: marcar enviada ─────────────────────────────────

export function useMarcarEnviada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketing_notificaciones')
        .update({ enviada: true, leida: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mkt-notificaciones'] });
      qc.invalidateQueries({ queryKey: ['mkt-notif-badge'] });
    },
  });
}

// ── Hook de polling: dispara browser notifications ───────────

export function useNotificacionPolling() {
  const qc = useQueryClient();

  useEffect(() => {
    const checkAndFire = async () => {
      const ahora = new Date();

      // Buscar notificaciones cuya fecha_envio ya pasó pero no están enviadas
      const { data: pendientes } = await supabase
        .from('marketing_notificaciones')
        .select('*, marketing_publicaciones(*)')
        .eq('enviada', false)
        .lte('fecha_envio', ahora.toISOString())
        .limit(20);

      if (!pendientes || pendientes.length === 0) return;

      for (const notif of pendientes as NotificacionConPublicacion[]) {
        const pub = notif.marketing_publicaciones;
        if (!pub) continue;

        const texto = construirTextoNotificacion(
          notif.tipo,
          pub.plataforma,
          pub.titulo ?? pub.texto_publicacion.slice(0, 40),
          pub.hora_publicacion.slice(0, 5),
        );

        // Marcar como enviada en BD
        await supabase
          .from('marketing_notificaciones')
          .update({ enviada: true })
          .eq('id', notif.id);

        // Disparar browser notification si hay permiso
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try {
            new Notification('AS Belleza — Marketing', {
              body: texto,
              icon: '/LOGO ANDREA.jpg',
              tag:  notif.id,
            });
          } catch {
            // Browser notification no soportada en este contexto
          }
        }
      }

      qc.invalidateQueries({ queryKey: ['mkt-notificaciones'] });
      qc.invalidateQueries({ queryKey: ['mkt-notif-badge'] });
    };

    checkAndFire();
    const interval = setInterval(checkAndFire, 60_000);
    return () => clearInterval(interval);
  }, [qc]);
}

// ── Solicitar permiso de notificaciones del navegador ─────────

export async function solicitarPermisoNotificaciones(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

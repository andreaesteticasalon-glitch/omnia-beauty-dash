import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SeguimientoPostRow, EstadoSeguimiento, CanalSeguimiento } from '@/integrations/supabase/types';
import { toast } from 'sonner';

// ── Tipos públicos ──────────────────────────────────────────

export type SeguimientoConCliente = SeguimientoPostRow & {
  clients: { name: string; phone: string | null; email: string | null } | null;
  appointments: { date: string; time: string; services: { name: string } | null } | null;
};

// ── Queries ─────────────────────────────────────────────────

export function useSeguimientosPendientes() {
  return useQuery({
    queryKey: ['seguimiento-pendientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seguimiento_post')
        .select('*, clients(name, phone, email), appointments(date, time, services(name))')
        .in('estado', ['pendiente', 'contactado'])
        .order('fecha_objetivo', { ascending: true });
      if (error) throw error;
      return data as SeguimientoConCliente[];
    },
    refetchInterval: 60_000,
  });
}

export function useCountPendientes() {
  return useQuery({
    queryKey: ['seguimiento-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('seguimiento_post')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'pendiente');
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 60_000,
  });
}

export function useClientSeguimientos(clientId: string | null) {
  return useQuery({
    queryKey: ['seguimiento-client', clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seguimiento_post')
        .select('*')
        .eq('client_id', clientId!)
        .order('fecha_objetivo', { ascending: false });
      if (error) throw error;
      return data as SeguimientoPostRow[];
    },
  });
}

export function useKPIsSeguimiento() {
  return useQuery({
    queryKey: ['seguimiento-kpis'],
    queryFn: async () => {
      const hoy = new Date().toISOString().slice(0, 10);

      const [{ count: pendientes }, { count: contactadosHoy }, { data: conSat }] = await Promise.all([
        supabase.from('seguimiento_post').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
        supabase.from('seguimiento_post').select('id', { count: 'exact', head: true })
          .eq('estado', 'contactado').gte('created_at', hoy + 'T00:00:00Z'),
        supabase.from('seguimiento_post').select('satisfaccion').not('satisfaccion', 'is', null),
      ]);

      const sats    = (conSat ?? []).map(r => r.satisfaccion as number);
      const satMedia = sats.length ? sats.reduce((a, b) => a + b, 0) / sats.length : null;

      return { pendientes: pendientes ?? 0, contactadosHoy: contactadosHoy ?? 0, satMedia };
    },
    refetchInterval: 60_000,
  });
}

// ── Mutations ────────────────────────────────────────────────

export function useCreateSeguimiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      client_id:      string;
      appointment_id: string;
      fecha_cita:     string;
      dias_post?:     number;
    }) => {
      const dias = params.dias_post ?? 7;
      const fechaObj = new Date(params.fecha_cita);
      fechaObj.setDate(fechaObj.getDate() + dias);
      const fecha_objetivo = fechaObj.toISOString().slice(0, 10);

      const { error } = await supabase.from('seguimiento_post').insert({
        client_id:      params.client_id,
        appointment_id: params.appointment_id,
        fecha_cita:     params.fecha_cita,
        fecha_objetivo,
        dias_post:      dias,
        estado:         'pendiente',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seguimiento-pendientes'] });
      qc.invalidateQueries({ queryKey: ['seguimiento-count'] });
      qc.invalidateQueries({ queryKey: ['seguimiento-kpis'] });
    },
  });
}

export function useUpdateSeguimiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id:            string;
      estado?:       EstadoSeguimiento;
      canal?:        CanalSeguimiento | null;
      satisfaccion?: number | null;
      notas?:        string | null;
    }) => {
      const { id, ...patch } = params;
      const { error } = await supabase.from('seguimiento_post').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seguimiento-pendientes'] });
      qc.invalidateQueries({ queryKey: ['seguimiento-count'] });
      qc.invalidateQueries({ queryKey: ['seguimiento-kpis'] });
      qc.invalidateQueries({ queryKey: ['seguimiento-client'] });
      toast.success('Seguimiento actualizado');
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : 'Error al actualizar seguimiento'),
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClientEvidenciaRow, TipoEvidencia, TipoMedia } from '@/integrations/supabase/types';
import { toast } from 'sonner';

// ── Tipos públicos ──────────────────────────────────────────

export type EvidenciaConCliente = ClientEvidenciaRow & {
  clients: { name: string } | null;
};

export interface AddEvidenciaPayload {
  client_id:      string;
  appointment_id: string | null;
  service_id:     string | null;
  tipo:           TipoEvidencia;
  tipo_media:     TipoMedia;
  file:           File;
  tratamiento:    string | null;
  descripcion:    string | null;
  fecha:          string;
  uso_marketing:  boolean;
}

// ── Queries ─────────────────────────────────────────────────

export function useClientEvidencias(clientId: string | null) {
  return useQuery({
    queryKey: ['evidencias', clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_evidencias')
        .select('*')
        .eq('client_id', clientId!)
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ClientEvidenciaRow[];
    },
  });
}

export function useRecentEvidencias(limit = 6) {
  return useQuery({
    queryKey: ['evidencias-recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_evidencias')
        .select('*, clients(name)')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as EvidenciaConCliente[];
    },
    refetchInterval: 60_000,
  });
}

// ── Mutations ────────────────────────────────────────────────

export function useAddEvidencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddEvidenciaPayload) => {
      // 1. Subir fichero a Storage
      const ext  = payload.file.name.split('.').pop() ?? 'jpg';
      const path = `${payload.client_id}/${Date.now()}-${payload.tipo}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('client-evidencias')
        .upload(path, payload.file, { contentType: payload.file.type, upsert: false });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage
        .from('client-evidencias')
        .getPublicUrl(path);

      // 2. Insertar registro
      const { data, error } = await supabase
        .from('client_evidencias')
        .insert({
          client_id:      payload.client_id,
          appointment_id: payload.appointment_id,
          service_id:     payload.service_id,
          tipo:           payload.tipo,
          tipo_media:     payload.tipo_media,
          url:            publicUrl,
          tratamiento:    payload.tratamiento,
          descripcion:    payload.descripcion,
          fecha:          payload.fecha,
          uso_marketing:  payload.uso_marketing,
        })
        .select()
        .single();
      if (error) throw error;
      return data as ClientEvidenciaRow;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['evidencias', vars.client_id] });
      qc.invalidateQueries({ queryKey: ['evidencias-recent'] });
      toast.success('Evidencia guardada correctamente');
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : 'Error al guardar la evidencia'),
  });
}

export function useDeleteEvidencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, clientId, url }: { id: string; clientId: string; url: string }) => {
      // Extraer path del Storage desde la URL pública
      const marker = '/client-evidencias/';
      const idx    = url.indexOf(marker);
      if (idx !== -1) {
        const storagePath = url.slice(idx + marker.length);
        await supabase.storage.from('client-evidencias').remove([storagePath]);
      }
      const { error } = await supabase.from('client_evidencias').delete().eq('id', id);
      if (error) throw error;
      return clientId;
    },
    onSuccess: (clientId) => {
      qc.invalidateQueries({ queryKey: ['evidencias', clientId] });
      qc.invalidateQueries({ queryKey: ['evidencias-recent'] });
      toast.success('Evidencia eliminada');
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : 'Error al eliminar la evidencia'),
  });
}

export function useToggleMarketing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, clientId, current }: { id: string; clientId: string; current: boolean }) => {
      const { error } = await supabase
        .from('client_evidencias')
        .update({ uso_marketing: !current })
        .eq('id', id);
      if (error) throw error;
      return clientId;
    },
    onSuccess: (clientId) => {
      qc.invalidateQueries({ queryKey: ['evidencias', clientId] });
      qc.invalidateQueries({ queryKey: ['evidencias-recent'] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : 'Error al actualizar permiso marketing'),
  });
}

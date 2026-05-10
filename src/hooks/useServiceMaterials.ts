import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ServiceMaterialRow } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export function useServiceMaterials(serviceId?: string) {
  return useQuery({
    queryKey: ['service-materials', serviceId ?? 'all'],
    queryFn: async () => {
      let q = supabase.from('service_materials').select('*').order('product');
      if (serviceId) q = q.eq('service_id', serviceId);
      const { data, error } = await q;
      if (error) throw error;
      return data as ServiceMaterialRow[];
    },
  });
}

export function useAddServiceMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (material: Omit<ServiceMaterialRow, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('service_materials').insert(material);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-materials'] });
      toast.success('Material añadido');
    },
    onError: () => toast.error('Error al añadir material'),
  });
}

export function useUpdateServiceMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ServiceMaterialRow> }) => {
      const { error } = await supabase.from('service_materials').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-materials'] }),
    onError: () => toast.error('Error al actualizar material'),
  });
}

export function useDeleteServiceMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('service_materials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-materials'] });
      toast.success('Material eliminado');
    },
    onError: () => toast.error('Error al eliminar material'),
  });
}

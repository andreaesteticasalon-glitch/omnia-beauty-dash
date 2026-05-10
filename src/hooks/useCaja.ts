import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PaymentRecordRow, PaymentMethod } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export function usePaymentRecords(from?: string, to?: string) {
  return useQuery({
    queryKey: ['payment-records', from, to],
    queryFn: async () => {
      let q = supabase
        .from('payment_records')
        .select('*')
        .order('created_at', { ascending: false });
      if (from) q = q.gte('created_at', from);
      if (to)   q = q.lte('created_at', to);
      const { data, error } = await q;
      if (error) throw error;
      return data as PaymentRecordRow[];
    },
  });
}

export function useTodayPayments() {
  const today = new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: ['payment-records-today'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_records')
        .select('*')
        .gte('created_at', today + 'T00:00:00')
        .lte('created_at', today + 'T23:59:59')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PaymentRecordRow[];
    },
    refetchInterval: 30_000,
  });
}

export function useCajaTotals() {
  return useQuery({
    queryKey: ['caja-totals'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

      const [todayRes, weekRes, monthRes] = await Promise.all([
        supabase.from('payment_records').select('amount, payment_method')
          .gte('created_at', today + 'T00:00:00'),
        supabase.from('payment_records').select('amount, payment_method')
          .gte('created_at', startOfWeek.toISOString()),
        supabase.from('payment_records').select('amount, payment_method')
          .gte('created_at', startOfMonth.toISOString()),
      ]);

      const sum = (rows: { amount: number }[] | null) =>
        (rows ?? []).reduce((acc, r) => acc + Number(r.amount), 0);

      const byMethod = (rows: { amount: number; payment_method: string }[] | null) => {
        const map: Record<string, number> = { efectivo: 0, tarjeta: 0, bizum: 0, transferencia: 0 };
        (rows ?? []).forEach(r => { map[r.payment_method] = (map[r.payment_method] ?? 0) + Number(r.amount); });
        return map;
      };

      return {
        today: sum(todayRes.data),
        week:  sum(weekRes.data),
        month: sum(monthRes.data),
        todayByMethod: byMethod(todayRes.data),
        count: {
          today: (todayRes.data ?? []).length,
          week:  (weekRes.data ?? []).length,
          month: (monthRes.data ?? []).length,
        },
      };
    },
    refetchInterval: 30_000,
  });
}

export function useRegisterPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      client_id?: string | null;
      appointment_id?: string | null;
      service_id?: string | null;
      client_name: string;
      service_name: string;
      amount: number;
      payment_method: PaymentMethod;
      notes?: string;
    }) => {
      // Register payment
      const { data, error } = await supabase
        .from('payment_records')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;

      // If linked to appointment, mark as completed
      if (payload.appointment_id) {
        await supabase
          .from('appointments')
          .update({ status: 'completed' })
          .eq('id', payload.appointment_id);
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment-records'] });
      qc.invalidateQueries({ queryKey: ['payment-records-today'] });
      qc.invalidateQueries({ queryKey: ['caja-totals'] });
      qc.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Pago registrado correctamente');
    },
    onError: () => toast.error('Error al registrar el pago'),
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('payment_records').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment-records'] });
      qc.invalidateQueries({ queryKey: ['payment-records-today'] });
      qc.invalidateQueries({ queryKey: ['caja-totals'] });
      toast.success('Pago eliminado');
    },
  });
}

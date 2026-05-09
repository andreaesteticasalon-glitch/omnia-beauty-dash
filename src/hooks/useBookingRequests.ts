import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BookingRequestRow } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export function useBookingRequests(status?: string) {
  return useQuery({
    queryKey: ['booking-requests', status ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('booking_requests')
        .select('*, services(name, price, duration, category)')
        .order('created_at', { ascending: false });
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return data as (BookingRequestRow & { services: { name: string; price: number; duration: number; category: string | null } | null })[];
    },
  });
}

export function usePendingCount() {
  return useQuery({
    queryKey: ['booking-requests-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('booking_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      return count ?? 0;
    },
    refetchInterval: 30_000,
  });
}

export function useCreateBookingRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      channel: 'whatsapp' | 'qr_web';
      client_name: string;
      phone: string;
      email?: string;
      service_id: string;
      requested_date: string;
      requested_time: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('booking_requests')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking-requests'] });
      qc.invalidateQueries({ queryKey: ['booking-requests-count'] });
    },
  });
}

export function useAcceptBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (booking: BookingRequestRow & { services: { name: string; price: number; duration: number; category: string | null } | null }) => {
      // 1. Find or create client
      let clientId: string;
      const { data: existing } = await supabase
        .from('clients')
        .select('id')
        .eq('phone', booking.phone)
        .maybeSingle();

      if (existing) {
        clientId = existing.id;
      } else {
        const { data: newClient, error: clientErr } = await supabase
          .from('clients')
          .insert({ name: booking.client_name, phone: booking.phone, email: booking.email ?? null })
          .select('id')
          .single();
        if (clientErr) throw clientErr;
        clientId = newClient.id;
      }

      // 2. Create appointment
      const { data: apt, error: aptErr } = await supabase
        .from('appointments')
        .insert({
          client_id: clientId,
          service_id: booking.service_id,
          date: booking.requested_date,
          time: booking.requested_time,
          price: booking.services?.price ?? 0,
          status: 'scheduled',
          notes: booking.notes ?? null,
        })
        .select('id')
        .single();
      if (aptErr) throw aptErr;

      // 3. Update booking_request
      const { error: bkgErr } = await supabase
        .from('booking_requests')
        .update({ status: 'accepted', appointment_id: apt.id })
        .eq('id', booking.id);
      if (bkgErr) throw bkgErr;

      // 4. Log WhatsApp (stub — real send happens when WhatsApp is connected)
      await supabase.from('whatsapp_log').insert({
        phone: booking.phone,
        direction: 'outbound',
        message: `✅ ¡Cita confirmada! ${booking.services?.name} el ${booking.requested_date} a las ${booking.requested_time}. AS Belleza y Bienestar 🌸`,
        status: 'pending_wa_setup',
        booking_request_id: booking.id,
      });

      return apt.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking-requests'] });
      qc.invalidateQueries({ queryKey: ['booking-requests-count'] });
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Reserva aceptada y cita creada en la agenda');
    },
    onError: () => toast.error('Error al aceptar la reserva'),
  });
}

export function useRejectBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, phone, notes }: { id: string; phone: string; notes?: string }) => {
      const { error } = await supabase
        .from('booking_requests')
        .update({ status: 'rejected' })
        .eq('id', id);
      if (error) throw error;

      await supabase.from('whatsapp_log').insert({
        phone,
        direction: 'outbound',
        message: notes
          ? `Lo sentimos, no podemos confirmar tu cita. ${notes}. Contáctanos para buscar otra fecha 🌸`
          : 'Lo sentimos, no podemos confirmar tu cita en esa fecha. Contáctanos para buscar otra opción 🌸',
        status: 'pending_wa_setup',
        booking_request_id: id,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking-requests'] });
      qc.invalidateQueries({ queryKey: ['booking-requests-count'] });
      toast.success('Reserva rechazada');
    },
    onError: () => toast.error('Error al rechazar la reserva'),
  });
}

// For tomorrow's appointments — used by materials panel
export function useUpcomingAppointments(days = 2) {
  return useQuery({
    queryKey: ['upcoming-appointments', days],
    queryFn: async () => {
      const today = new Date();
      const until = new Date(today);
      until.setDate(today.getDate() + days);
      const todayStr = today.toISOString().split('T')[0];
      const untilStr = until.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('appointments')
        .select('*, clients(name, phone), services(id, name, duration, category)')
        .gte('date', todayStr)
        .lte('date', untilStr)
        .eq('status', 'scheduled')
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      if (error) throw error;
      return data;
    },
    refetchInterval: 60_000,
  });
}

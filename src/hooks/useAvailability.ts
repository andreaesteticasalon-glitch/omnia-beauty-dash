import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  AvailabilityConfigRow, BlockedDateRow, AppointmentRow, BookingRequestRow, ServiceRow,
} from '@/integrations/supabase/types';

// ── Helpers ─────────────────────────────────────────────────

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

interface Interval { start: number; end: number }

function slotsForDay(
  openTime: string,
  closeTime: string,
  breakStart: string | null,
  breakEnd: string | null,
  slotDuration: number,
  serviceDuration: number,
): string[] {
  const openMin  = timeToMinutes(openTime);
  const closeMin = timeToMinutes(closeTime);
  const bsMin    = breakStart ? timeToMinutes(breakStart) : null;
  const beMin    = breakEnd   ? timeToMinutes(breakEnd)   : null;
  const slots: string[] = [];
  let cur = openMin;

  while (cur + serviceDuration <= closeMin) {
    if (bsMin !== null && beMin !== null && cur < beMin && cur + serviceDuration > bsMin) {
      cur = beMin;
      continue;
    }
    slots.push(minutesToTime(cur));
    cur += slotDuration;
  }
  return slots;
}

// ── useAvailableSlots ────────────────────────────────────────

export function useAvailableSlots(serviceId: string | null, date: string | null) {
  return useQuery({
    queryKey: ['available-slots', serviceId, date],
    enabled: !!serviceId && !!date,
    staleTime: 30_000,
    queryFn: async (): Promise<string[]> => {
      if (!serviceId || !date) return [];

      const dow = new Date(date + 'T12:00:00').getDay();

      const [svcRes, cfgRes, blockedRes, aptsRes, bkgRes] = await Promise.all([
        supabase.from('services').select('duration').eq('id', serviceId).single(),
        supabase.from('availability_config').select('*').eq('day_of_week', dow).single(),
        supabase.from('blocked_dates').select('all_day').eq('date', date),
        supabase.from('appointments').select('time, service_id').eq('date', date).neq('status', 'cancelled'),
        supabase.from('booking_requests').select('requested_time, service_id').eq('requested_date', date).eq('status', 'accepted'),
      ]);

      const cfg = cfgRes.data as AvailabilityConfigRow | null;
      if (!cfg || !cfg.is_open) return [];

      const blocked = (blockedRes.data ?? []) as Pick<BlockedDateRow, 'all_day'>[];
      if (blocked.some(b => b.all_day)) return [];

      const svc             = svcRes.data as Pick<ServiceRow, 'duration'> | null;
      const serviceDuration = svc?.duration ?? 60;

      const slots = slotsForDay(
        cfg.open_time, cfg.close_time,
        cfg.break_start, cfg.break_end,
        cfg.slot_duration, serviceDuration,
      );

      const apts = (aptsRes.data ?? []) as Pick<AppointmentRow, 'time' | 'service_id'>[];
      const bkgs = (bkgRes.data  ?? []) as Pick<BookingRequestRow, 'requested_time' | 'service_id'>[];

      const occupied: Interval[] = [
        ...apts.map(a => { const s = timeToMinutes(a.time); return { start: s, end: s + serviceDuration }; }),
        ...bkgs.map(b => { const s = timeToMinutes(b.requested_time); return { start: s, end: s + serviceDuration }; }),
      ];

      return slots.filter(slot => {
        const s = timeToMinutes(slot);
        const e = s + serviceDuration;
        return !occupied.some(o => s < o.end && e > o.start);
      });
    },
  });
}

// ── useAvailableDays ─────────────────────────────────────────

export function useAvailableDays(serviceId: string | null, year: number, month: number) {
  return useQuery({
    queryKey: ['available-days', serviceId, year, month],
    enabled: !!serviceId,
    staleTime: 60_000,
    queryFn: async (): Promise<Set<string>> => {
      if (!serviceId) return new Set();

      const first    = new Date(year, month, 1);
      const last     = new Date(year, month + 1, 0);
      const firstStr = first.toISOString().split('T')[0];
      const lastStr  = last.toISOString().split('T')[0];

      const [svcRes, cfgRes, blockedRes, aptsRes, bkgRes] = await Promise.all([
        supabase.from('services').select('duration').eq('id', serviceId).single(),
        supabase.from('availability_config').select('*'),
        supabase.from('blocked_dates').select('date, all_day').gte('date', firstStr).lte('date', lastStr),
        supabase.from('appointments').select('date, time').gte('date', firstStr).lte('date', lastStr).neq('status', 'cancelled'),
        supabase.from('booking_requests').select('requested_date, requested_time').gte('requested_date', firstStr).lte('requested_date', lastStr).eq('status', 'accepted'),
      ]);

      const configs  = (cfgRes.data  ?? []) as AvailabilityConfigRow[];
      const blocked  = (blockedRes.data ?? []) as Pick<BlockedDateRow, 'date' | 'all_day'>[];
      const apts     = (aptsRes.data ?? []) as Pick<AppointmentRow, 'date' | 'time'>[];
      const bkgs     = (bkgRes.data  ?? []) as Pick<BookingRequestRow, 'requested_date' | 'requested_time'>[];
      const svc      = svcRes.data as Pick<ServiceRow, 'duration'> | null;

      const configByDow  = Object.fromEntries(configs.map(c => [c.day_of_week, c]));
      const allDayBlocks = new Set(blocked.filter(b => b.all_day).map(b => b.date));
      const serviceDuration = svc?.duration ?? 60;

      const occupiedByDate: Record<string, Interval[]> = {};
      const addInterval = (date: string, time: string) => {
        if (!occupiedByDate[date]) occupiedByDate[date] = [];
        const s = timeToMinutes(time);
        occupiedByDate[date].push({ start: s, end: s + serviceDuration });
      };
      apts.forEach(a => addInterval(a.date, a.time));
      bkgs.forEach(b => addInterval(b.requested_date, b.requested_time));

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const available = new Set<string>();

      for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
        if (d < today) continue;
        const dateStr = d.toISOString().split('T')[0];
        const cfg = configByDow[d.getDay()] as AvailabilityConfigRow | undefined;
        if (!cfg || !cfg.is_open) continue;
        if (allDayBlocks.has(dateStr)) continue;

        const slots = slotsForDay(
          cfg.open_time, cfg.close_time,
          cfg.break_start, cfg.break_end,
          cfg.slot_duration, serviceDuration,
        );
        const occupied = occupiedByDate[dateStr] ?? [];
        const hasFree  = slots.some(slot => {
          const s = timeToMinutes(slot);
          const e = s + serviceDuration;
          return !occupied.some(o => s < o.end && e > o.start);
        });
        if (hasFree) available.add(dateStr);
      }
      return available;
    },
  });
}

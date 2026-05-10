// ============================================================
// whatsapp-reminders — Cron: envía recordatorios de cita
// Ejecutar 2 veces al día: 9:00 y 17:00
// En Supabase: pg_cron o Scheduled Edge Functions
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Find accepted bookings for tomorrow that haven't received reminder
  const { data: bookings, error } = await supabase
    .from('booking_requests')
    .select('id, phone, client_name, requested_time, services(name, duration)')
    .eq('requested_date', tomorrowStr)
    .eq('status', 'accepted')
    .eq('reminder_sent', false);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const results = [];
  const baseUrl = Deno.env.get('SUPABASE_URL');
  const key     = Deno.env.get('SUPABASE_ANON_KEY');

  for (const booking of (bookings ?? [])) {
    const svc = (booking as unknown as { services?: { name: string; duration: number } }).services;
    const message = `🔔 *Recordatorio de cita*\n\nMañana tienes cita en *AS Belleza y Bienestar*:\n💆 ${svc?.name ?? 'Tratamiento'}\n🕙 ${booking.requested_time}\n\nPor favor confirma tu asistencia:\n✅ Escribe *CONFIRMAR*\n❌ Escribe *CANCELAR*`;

    // Send via whatsapp-send function
    if (baseUrl && key) {
      await fetch(`${baseUrl}/functions/v1/whatsapp-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: key },
        body: JSON.stringify({ phone: booking.phone, message, booking_request_id: booking.id }),
      });
    }

    // Mark reminder as sent
    await supabase
      .from('booking_requests')
      .update({ reminder_sent: true, reminder_sent_at: new Date().toISOString() })
      .eq('id', booking.id);

    results.push({ id: booking.id, phone: booking.phone });
  }

  return new Response(
    JSON.stringify({ ok: true, reminders_sent: results.length, bookings: results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});

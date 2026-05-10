// ============================================================
// whatsapp-webhook — Recibe mensajes entrantes de Meta WhatsApp
// Implementa la máquina de estados del chatbot de reservas.
// Configurar en Meta: POST /functions/v1/whatsapp-webhook
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VERIFY_TOKEN = Deno.env.get('WEBHOOK_VERIFY_TOKEN') ?? 'as_beauty_webhook';

// ── GET: verificación del webhook por Meta ──────────────────
async function handleVerification(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const mode      = url.searchParams.get('hub.mode');
  const token     = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

// ── Envía un mensaje de texto via whatsapp-send ─────────────
async function sendMessage(phone: string, text: string, bookingId?: string) {
  const baseUrl = Deno.env.get('SUPABASE_URL');
  const key     = Deno.env.get('SUPABASE_ANON_KEY');
  if (!baseUrl || !key) return;

  await fetch(`${baseUrl}/functions/v1/whatsapp-send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: key },
    body: JSON.stringify({ phone, message: text, booking_request_id: bookingId }),
  });
}

// ── Máquina de estados ──────────────────────────────────────
type Step = 'WELCOME' | 'ASK_NAME' | 'SELECT_SERVICE' | 'SELECT_DATE' | 'SELECT_TIME' | 'CONFIRM' | 'DONE';

async function handleIncoming(phone: string, text: string): Promise<void> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const msg = text.trim();
  const msgUpper = msg.toUpperCase();

  // Log inbound
  await supabase.from('whatsapp_log').insert({ phone, direction: 'inbound', message: msg, status: 'received' });

  // Load or create session
  const { data: session } = await supabase
    .from('whatsapp_sessions')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  const step: Step = (session?.step as Step) ?? 'WELCOME';
  const isExpired = session ? new Date(session.expires_at) < new Date() : false;

  // Handle cancel at any point
  if (msgUpper === 'CANCELAR' && step !== 'WELCOME' && step !== 'ASK_NAME') {
    await supabase.from('whatsapp_sessions').delete().eq('phone', phone);
    await sendMessage(phone, '❌ Reserva cancelada. Cuando quieras, escríbenos de nuevo para reservar. 🌸');
    return;
  }

  // Reset expired sessions
  const currentStep: Step = (isExpired && step !== 'DONE') ? 'WELCOME' : step;

  // Get services for menus
  const { data: services } = await supabase
    .from('services')
    .select('id, name, price, duration, category')
    .eq('active', true)
    .order('category');

  // ── State machine ────────────────────────────────────────

  if (currentStep === 'WELCOME' || !session) {
    await supabase.from('whatsapp_sessions').upsert({
      phone, step: 'ASK_NAME',
      expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
      updated_at: new Date().toISOString(),
    });
    await sendMessage(phone,
      `👋 ¡Hola! Soy el asistente de *AS Belleza y Bienestar*.\n\n¿Cuál es tu nombre?`
    );
    return;
  }

  if (currentStep === 'ASK_NAME') {
    const serviceList = (services ?? [])
      .map((s, i) => `${i + 1}️⃣ ${s.name} — ${s.price}€ (${s.duration} min)`)
      .join('\n');

    await supabase.from('whatsapp_sessions').update({
      client_name: msg,
      step: 'SELECT_SERVICE',
      expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('phone', phone);

    await sendMessage(phone,
      `¡Hola, *${msg}*! 🌸\n\nEstos son nuestros tratamientos:\n\n${serviceList}\n\nResponde con el *número* del servicio.`
    );
    return;
  }

  if (currentStep === 'SELECT_SERVICE') {
    const idx = parseInt(msg) - 1;
    const service = services?.[idx];
    if (!service) {
      await sendMessage(phone, '⚠️ Por favor responde con un número válido de la lista.');
      return;
    }

    // Get next 7 available days (simplified: next working days)
    const dayNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const availDays: string[] = [];
    const d = new Date();
    d.setDate(d.getDate() + 1);
    while (availDays.length < 6) {
      const dow = d.getDay();
      if (dow !== 0) availDays.push(d.toISOString().split('T')[0]);
      d.setDate(d.getDate() + 1);
    }
    const dayList = availDays.map((dd, i) => {
      const dt = new Date(dd + 'T12:00:00');
      return `${i + 1}️⃣ ${dayNames[dt.getDay()]} ${dt.getDate()}/${dt.getMonth() + 1}`;
    }).join('\n');

    await supabase.from('whatsapp_sessions').update({
      service_id: service.id,
      step: 'SELECT_DATE',
      expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('phone', phone);

    await sendMessage(phone,
      `Has elegido: *${service.name}* ✨\n\nDías disponibles:\n\n${dayList}\n\n¿Qué día prefieres?`
    );
    return;
  }

  if (currentStep === 'SELECT_DATE') {
    const dayNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const availDays: string[] = [];
    const d = new Date();
    d.setDate(d.getDate() + 1);
    while (availDays.length < 6) {
      if (d.getDay() !== 0) availDays.push(d.toISOString().split('T')[0]);
      d.setDate(d.getDate() + 1);
    }
    const idx = parseInt(msg) - 1;
    const selectedDate = availDays[idx];
    if (!selectedDate) {
      await sendMessage(phone, '⚠️ Elige un número de la lista de días.');
      return;
    }
    const dt = new Date(selectedDate + 'T12:00:00');

    // Simplified: fixed time slots
    const slots = ['09:00','10:00','11:00','12:00','16:00','17:00','18:00','19:00'];
    const slotList = slots.map((t, i) => `${i + 1}️⃣ ${t}`).join('  ');

    await supabase.from('whatsapp_sessions').update({
      selected_date: selectedDate,
      step: 'SELECT_TIME',
      expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('phone', phone);

    await sendMessage(phone,
      `*${dayNames[dt.getDay()]} ${dt.getDate()}/${dt.getMonth() + 1}*\n\nHoras disponibles:\n${slotList}\n\n¿Qué hora prefieres?`
    );
    return;
  }

  if (currentStep === 'SELECT_TIME') {
    const slots = ['09:00','10:00','11:00','12:00','16:00','17:00','18:00','19:00'];
    const idx = parseInt(msg) - 1;
    const selectedTime = slots[idx];
    if (!selectedTime) {
      await sendMessage(phone, '⚠️ Elige un número de la lista de horas.');
      return;
    }

    const { data: svc } = await supabase.from('services').select('name, price, duration').eq('id', session.service_id!).single();

    await supabase.from('whatsapp_sessions').update({
      selected_time: selectedTime,
      step: 'CONFIRM',
      expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('phone', phone);

    const dt = new Date(session.selected_date! + 'T12:00:00');
    const dayNames = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

    await sendMessage(phone,
      `📋 *Resumen de tu reserva:*\n\n👤 ${session.client_name}\n💆 ${svc?.name}\n📅 ${dayNames[dt.getDay()]} ${dt.getDate()}/${dt.getMonth() + 1}\n🕙 ${selectedTime} (${svc?.duration} min)\n💰 ${svc?.price}€\n\nResponde *CONFIRMAR* para solicitar\no *CANCELAR* para empezar de nuevo`
    );
    return;
  }

  if (currentStep === 'CONFIRM' && msgUpper === 'CONFIRMAR') {
    const { data: booking } = await supabase.from('booking_requests').insert({
      channel: 'whatsapp',
      client_name: session.client_name!,
      phone,
      service_id: session.service_id,
      requested_date: session.selected_date!,
      requested_time: session.selected_time!,
    }).select('id').single();

    await supabase.from('whatsapp_sessions').update({
      step: 'DONE',
      updated_at: new Date().toISOString(),
    }).eq('phone', phone);

    await sendMessage(phone,
      `🌸 *¡Solicitud enviada, ${session.client_name}!*\n\nAndrea confirmará tu reserva en breve y recibirás un mensaje de confirmación.\n\n¡Hasta pronto! 💫`,
      booking?.id,
    );
    return;
  }

  // Default fallback
  await sendMessage(phone, '🌸 ¡Hola! Escribe *Hola* para empezar a reservar tu cita.');
}

// ── POST: mensajes entrantes de Meta ────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method === 'GET') return handleVerification(req);

  try {
    const body = await req.json() as {
      entry?: { changes?: { value?: { messages?: { from: string; text?: { body: string } }[] } }[] }[];
    };

    const messages = body.entry?.[0]?.changes?.[0]?.value?.messages;
    if (messages) {
      for (const msg of messages) {
        if (msg.text?.body) {
          await handleIncoming(msg.from, msg.text.body);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

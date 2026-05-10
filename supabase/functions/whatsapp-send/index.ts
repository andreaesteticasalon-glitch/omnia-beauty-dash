// ============================================================
// whatsapp-send — Envía un mensaje WhatsApp al cliente
// STUB: Registra en whatsapp_log pero NO llama a Meta API todavía.
// Activar cuando se configure WHATSAPP_TOKEN en Supabase Secrets.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { phone, message, booking_request_id } = await req.json() as {
      phone: string;
      message: string;
      booking_request_id?: string;
    };

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const waToken    = Deno.env.get('WHATSAPP_TOKEN');
    const phoneNumId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    let waStatus = 'pending_wa_setup';
    let waMessageId: string | null = null;

    // ── Real WhatsApp send (activo cuando se configuran los secrets) ──
    if (waToken && phoneNumId) {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${phoneNumId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${waToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone.replace(/\s/g, ''),
            type: 'text',
            text: { body: message },
          }),
        },
      );
      const json = await res.json() as { messages?: { id: string }[] };
      waMessageId = json.messages?.[0]?.id ?? null;
      waStatus = res.ok ? 'sent' : 'failed';
    }

    // ── Log en BD ──
    await supabase.from('whatsapp_log').insert({
      phone,
      direction: 'outbound',
      message,
      wa_message_id: waMessageId,
      status: waStatus,
      booking_request_id: booking_request_id ?? null,
    });

    return new Response(
      JSON.stringify({ ok: true, status: waStatus }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ ok: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

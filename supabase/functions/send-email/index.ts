// ============================================================
// send-email — Envía emails transaccionales via Resend
// Secrets necesarios en Supabase → Edge Functions → Secrets:
//   RESEND_API_KEY    → tu API key de resend.com
//   RESEND_FROM_EMAIL → "AS Belleza y Bienestar <pedidos@tudominio.com>"
// ============================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendEmailPayload {
  to:        string;          // email del proveedor
  subject:   string;
  html:      string;          // cuerpo HTML del email
  pdfBase64: string | null;   // PDF en base64 (adjunto)
  filename:  string;          // nombre del archivo PDF
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload = await req.json() as SendEmailPayload;
    const { to, subject, html, pdfBase64, filename } = payload;

    const apiKey   = Deno.env.get('RESEND_API_KEY');
    const fromAddr = Deno.env.get('RESEND_FROM_EMAIL') ?? 'AS Belleza y Bienestar <onboarding@resend.dev>';

    if (!apiKey) {
      return new Response(
        JSON.stringify({ ok: false, error: 'RESEND_API_KEY no configurada en Supabase Secrets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Construir payload Resend
    const resendBody: Record<string, unknown> = { from: fromAddr, to: [to], subject, html };
    if (pdfBase64) {
      resendBody.attachments = [{ filename, content: pdfBase64 }];
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(resendBody),
    });

    const resendData = await resendRes.json() as { id?: string; message?: string };

    if (!resendRes.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: resendData.message ?? 'Error de Resend' }),
        { status: resendRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true, id: resendData.id }),
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

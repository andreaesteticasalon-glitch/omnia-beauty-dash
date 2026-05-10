// ============================================================
// verificar-conexion — Verifica tokens de redes sociales
// sin exponer credenciales en el cliente
// ============================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificarPayload {
  plataforma: string;
  token:      string;
  page_id?:   string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { plataforma, token, page_id } = await req.json() as VerificarPayload;

    let ok = false;
    let nombre_cuenta: string | undefined;
    let error: string | undefined;

    if (plataforma === 'instagram' || plataforma === 'facebook') {
      // Verificar con Meta Graph API
      const url = page_id
        ? `https://graph.facebook.com/v19.0/${page_id}?fields=name,id&access_token=${token}`
        : `https://graph.facebook.com/v19.0/me?fields=name,id&access_token=${token}`;
      const res = await fetch(url);
      const data = await res.json() as { name?: string; error?: { message: string } };
      ok = res.ok && !data.error;
      nombre_cuenta = data.name;
      error = data.error?.message;

    } else if (plataforma === 'x') {
      // Verificar con Twitter API v2
      const res = await fetch('https://api.twitter.com/2/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { data?: { name: string }; errors?: { message: string }[] };
      ok = res.ok && !!data.data;
      nombre_cuenta = data.data?.name;
      error = data.errors?.[0]?.message;

    } else {
      // Para otras plataformas (tiktok, whatsapp, web): solo confirmamos que hay token
      ok = !!token && token.length > 10;
      nombre_cuenta = plataforma;
    }

    return new Response(
      JSON.stringify({ ok, nombre_cuenta, error }),
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

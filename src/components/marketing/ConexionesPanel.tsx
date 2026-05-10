import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Check, AlertCircle } from 'lucide-react';
import { MarketingConexionRow, PlataformaMkt } from '@/integrations/supabase/types';
import { useConexiones, useUpsertConexion } from '@/hooks/useMarketing';
import { cn } from '@/lib/utils';

// ── Definición de plataformas ────────────────────────────────

interface PlataformaConfig {
  id:     PlataformaMkt;
  nombre: string;
  emoji:  string;
  color:  string;
  campos: { key: string; label: string; tipo?: string; placeholder: string }[];
  nota?:  string;
}

const PLATAFORMAS_CONFIG: PlataformaConfig[] = [
  {
    id: 'instagram', nombre: 'Instagram', emoji: '📸', color: 'from-pink-500/10 to-rose-400/10',
    campos: [
      { key: 'page_id', label: 'Instagram Business Account ID', placeholder: '17841400000000000' },
      { key: 'token',   label: 'Access Token (Meta Graph API)', placeholder: 'EAABs...' },
    ],
    nota: 'Requiere una cuenta de Instagram Business y una App en Meta Developers.',
  },
  {
    id: 'facebook', nombre: 'Facebook', emoji: '👥', color: 'from-blue-500/10 to-sky-400/10',
    campos: [
      { key: 'page_id', label: 'Facebook Page ID', placeholder: '123456789' },
      { key: 'token',   label: 'Page Access Token', placeholder: 'EAABs...' },
    ],
    nota: 'Usa el mismo token de Meta que Instagram si es una cuenta vinculada.',
  },
  {
    id: 'whatsapp', nombre: 'WhatsApp Business', emoji: '💬', color: 'from-emerald-500/10 to-green-400/10',
    campos: [
      { key: 'page_id',      label: 'WhatsApp Business Account ID', placeholder: '110000000000000' },
      { key: 'nombre_cuenta', label: 'Número de teléfono', placeholder: '+34 600 000 000' },
      { key: 'token',        label: 'Token de acceso permanente', placeholder: 'EAABs...' },
    ],
    nota: 'La infraestructura de WhatsApp ya existe en el sistema (Edge Functions).',
  },
  {
    id: 'tiktok', nombre: 'TikTok', emoji: '🎵', color: 'from-gray-500/10 to-slate-400/10',
    campos: [
      { key: 'page_id', label: 'Open ID (cuenta TikTok Business)', placeholder: '6800000...' },
      { key: 'token',   label: 'Access Token', placeholder: 'act.xxxx' },
    ],
    nota: 'Requiere cuenta TikTok for Business y app registrada en TikTok Developers.',
  },
  {
    id: 'x', nombre: 'X (Twitter)', emoji: '𝕏', color: 'from-sky-500/10 to-blue-400/10',
    campos: [
      { key: 'nombre_cuenta', label: 'API Key',            placeholder: 'xxxxxxxxxx' },
      { key: 'page_id',       label: 'API Secret',         placeholder: 'xxxxxxxxxx' },
      { key: 'token',         label: 'Access Token',       placeholder: 'xxxxxxxxxx-xxxxxxxxxx' },
    ],
    nota: 'Requiere cuenta X Developer con acceso de escritura (v2 API).',
  },
  {
    id: 'web', nombre: 'Web (Webhook)', emoji: '🌐', color: 'from-violet-500/10 to-purple-400/10',
    campos: [
      { key: 'page_id', label: 'URL del webhook', tipo: 'url', placeholder: 'https://tusitio.com/api/marketing' },
      { key: 'token',   label: 'Token de autorización (opcional)', placeholder: 'Bearer xxxx' },
    ],
    nota: 'El sistema enviará un POST con el contenido de cada publicación a esta URL.',
  },
];

// ── Tarjeta por plataforma ───────────────────────────────────

function ConexionCard({ config, conexion }: { config: PlataformaConfig; conexion?: MarketingConexionRow }) {
  const [expanded, setExpanded] = useState(false);
  const [activa, setActiva]     = useState(conexion?.activa ?? false);
  const [campos, setCampos]     = useState<Record<string, string>>({
    page_id:       conexion?.page_id ?? '',
    token:         conexion?.token ?? '',
    nombre_cuenta: conexion?.nombre_cuenta ?? '',
  });
  const upsert = useUpsertConexion();

  const isConnected = !!conexion?.token && conexion.activa;

  const handleSave = () => {
    upsert.mutate({
      plataforma:    config.id,
      activa,
      page_id:       campos.page_id || null,
      token:         campos.token || null,
      nombre_cuenta: campos.nombre_cuenta || null,
    });
    setExpanded(false);
  };

  return (
    <div className={cn(
      'bg-card border rounded-2xl overflow-hidden transition-all',
      isConnected ? 'border-emerald-300/40' : 'border-gold-light/20',
    )}>
      <button
        className="w-full flex items-center gap-3 p-4"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Icono */}
        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br text-lg shrink-0', config.color)}>
          {config.emoji}
        </div>

        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-foreground">{config.nombre}</p>
          <p className={cn('text-[10px]', isConnected ? 'text-emerald-600' : conexion ? 'text-amber-500' : 'text-muted-foreground')}>
            {isConnected ? '● Conectado' : conexion?.token ? '● Sin activar' : '○ No configurado'}
          </p>
        </div>

        <Switch
          checked={activa}
          onCheckedChange={v => { setActiva(v); setExpanded(true); }}
          onClick={e => e.stopPropagation()}
        />
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gold-light/15">
          {config.nota && (
            <div className="flex items-start gap-2 bg-blue-50/50 dark:bg-blue-400/5 border border-blue-200/50 rounded-xl p-3 mt-3">
              <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-600/80">{config.nota}</p>
            </div>
          )}

          {config.campos.map(campo => (
            <div key={campo.key} className="space-y-1">
              <Label className="text-xs text-gold-dark">{campo.label}</Label>
              <Input
                type={campo.tipo ?? 'text'}
                value={campos[campo.key] ?? ''}
                onChange={e => setCampos(p => ({ ...p, [campo.key]: e.target.value }))}
                placeholder={campo.placeholder}
                className="text-xs h-9 font-mono"
              />
            </div>
          ))}

          <Button
            onClick={handleSave}
            disabled={upsert.isPending}
            size="sm"
            variant="luxury"
            className="w-full h-9 text-xs mt-2"
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            Guardar configuración
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Panel principal ──────────────────────────────────────────

export function ConexionesPanel() {
  const { data: conexiones = [] } = useConexiones();

  return (
    <div className="space-y-3">
      <div className="bg-gold/5 rounded-xl border border-gold-light/20 p-3 mb-2">
        <p className="text-xs text-muted-foreground">
          El módulo funciona sin ninguna conexión activa — en modo manual, Andrea copia el texto y publica en cada red social. Conecta plataformas para activar publicación automática.
        </p>
      </div>

      {PLATAFORMAS_CONFIG.map(config => (
        <ConexionCard
          key={config.id}
          config={config}
          conexion={conexiones.find(c => c.plataforma === config.id)}
        />
      ))}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SmartSelect } from '@/components/SmartSelect';
import { MarketingPublicacionRow, PlataformaMkt, TipoContenidoMkt } from '@/integrations/supabase/types';
import { useUpdatePublicacion, useDeletePublicacion } from '@/hooks/useMarketing';
import { useData } from '@/contexts/DataContext';
import { useRecentEvidencias } from '@/hooks/useEvidencias';
import { Check, Trash2, X } from 'lucide-react';

const PLATAFORMAS: { value: PlataformaMkt; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook',  label: 'Facebook'  },
  { value: 'whatsapp',  label: 'WhatsApp'  },
  { value: 'tiktok',    label: 'TikTok'    },
  { value: 'x',         label: 'X (Twitter)' },
  { value: 'web',       label: 'Web'        },
  { value: 'todos',     label: 'Todas'      },
];

const TIPOS: { value: TipoContenidoMkt; label: string }[] = [
  { value: 'foto',     label: 'Foto'     },
  { value: 'video',    label: 'Vídeo'    },
  { value: 'story',    label: 'Story'    },
  { value: 'reels',    label: 'Reels'    },
  { value: 'carrusel', label: 'Carrusel' },
  { value: 'texto',    label: 'Solo texto' },
  { value: 'oferta',   label: 'Oferta'   },
];

interface Props {
  pub:     MarketingPublicacionRow | null;
  open:    boolean;
  onClose: () => void;
}

export function PublicacionSheet({ pub, open, onClose }: Props) {
  const { services } = useData();
  const { data: evidencias = [] } = useRecentEvidencias(50);
  const updatePub = useUpdatePublicacion();
  const deletePub = useDeletePublicacion();

  const [plataforma,   setPlataforma]  = useState<PlataformaMkt>('instagram');
  const [fecha,        setFecha]       = useState('');
  const [hora,         setHora]        = useState('11:00');
  const [tipo,         setTipo]        = useState<TipoContenidoMkt>('foto');
  const [titulo,       setTitulo]      = useState('');
  const [texto,        setTexto]       = useState('');
  const [hashtags,     setHashtags]    = useState('');
  const [servicioId,   setServicioId]  = useState('');
  const [evidenciaId,  setEvidenciaId] = useState('');
  const [esOferta,     setEsOferta]    = useState(false);
  const [ofertaDesc,   setOfertaDesc]  = useState('');
  const [notas,        setNotas]       = useState('');

  useEffect(() => {
    if (pub) {
      setPlataforma(pub.plataforma);
      setFecha(pub.fecha_publicacion);
      setHora(pub.hora_publicacion.slice(0, 5));
      setTipo(pub.tipo_contenido);
      setTitulo(pub.titulo ?? '');
      setTexto(pub.texto_publicacion);
      setHashtags(pub.hashtags ?? '');
      setServicioId(pub.servicio_id ?? '');
      setEvidenciaId(pub.evidencia_id ?? '');
      setEsOferta(pub.tipo_contenido === 'oferta');
      setOfertaDesc(pub.oferta_descripcion ?? '');
      setNotas(pub.notas_andrea ?? '');
    }
  }, [pub]);

  const handleSave = async () => {
    if (!pub) return;
    await updatePub.mutateAsync({
      id:                pub.id,
      plataforma,
      fecha_publicacion: fecha,
      hora_publicacion:  hora,
      tipo_contenido:    tipo,
      titulo:            titulo || null,
      texto_publicacion: texto,
      hashtags:          hashtags || null,
      servicio_id:       servicioId || null,
      evidencia_id:      evidenciaId || null,
      oferta_descripcion: ofertaDesc || null,
      notas_andrea:      notas || null,
    });
    onClose();
  };

  const handleDelete = async () => {
    if (!pub || !confirm('¿Eliminar esta publicación del plan?')) return;
    await deletePub.mutateAsync(pub.id);
    onClose();
  };

  const evidenciaOptions = evidencias
    .filter(e => e.uso_marketing)
    .map(e => ({
      value:    e.id,
      label:    e.tratamiento ?? e.tipo,
      subtitle: e.tipo,
    }));

  const servicioOptions = services.map(s => ({
    value: s.id, label: s.name, subtitle: `${s.price} €`,
  }));

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-card border-l border-gold-light/30">
        <SheetHeader>
          <SheetTitle className="font-serif text-foreground text-base">
            Editar publicación
          </SheetTitle>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          {/* Plataforma */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gold-dark">Plataforma</Label>
            <Select value={plataforma} onValueChange={v => setPlataforma(v as PlataformaMkt)}>
              <SelectTrigger className="h-9 border-gold-light/30 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATAFORMAS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Fecha + Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-gold-dark">Fecha</Label>
              <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gold-dark">Hora</Label>
              <Input type="time" value={hora} onChange={e => setHora(e.target.value)} className="h-9 text-sm" />
            </div>
          </div>

          {/* Tipo */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gold-dark">Tipo de contenido</Label>
            <Select value={tipo} onValueChange={v => setTipo(v as TipoContenidoMkt)}>
              <SelectTrigger className="h-9 border-gold-light/30 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Título */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gold-dark">Título</Label>
            <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título de la publicación" className="text-sm" />
          </div>

          {/* Texto */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gold-dark">Texto *</Label>
              <span className="text-[10px] text-muted-foreground">{texto.length} car.</span>
            </div>
            <Textarea
              value={texto}
              onChange={e => setTexto(e.target.value)}
              rows={5}
              className="rounded-xl border-gold-light/50 text-sm resize-none"
            />
          </div>

          {/* Hashtags */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gold-dark">Hashtags</Label>
            <Input value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="#Belleza #Manicura..." className="text-sm" />
          </div>

          {/* Foto */}
          {evidenciaOptions.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-gold-dark">Foto/Vídeo (evidencias marketing)</Label>
              <SmartSelect
                value={evidenciaId}
                onChange={setEvidenciaId}
                options={evidenciaOptions}
                placeholder="Seleccionar foto..."
                createLabel="Ir a gestionar evidencias"
                onCreateNew={onClose}
              />
            </div>
          )}

          {/* Servicio */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gold-dark">Servicio a promover</Label>
            <SmartSelect
              value={servicioId}
              onChange={setServicioId}
              options={servicioOptions}
              placeholder="Seleccionar servicio..."
              createLabel="Ver servicios"
              onCreateNew={onClose}
            />
          </div>

          {/* Oferta */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gold/5 border border-gold-light/20">
            <div>
              <p className="text-sm font-medium text-foreground">Es una oferta</p>
              <p className="text-[10px] text-muted-foreground">Incluir descripción de la oferta</p>
            </div>
            <Switch checked={esOferta} onCheckedChange={setEsOferta} />
          </div>
          {esOferta && (
            <Input
              value={ofertaDesc}
              onChange={e => setOfertaDesc(e.target.value)}
              placeholder="Ej: 20% descuento manicura semipermanente"
              className="text-sm"
            />
          )}

          {/* Notas internas */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gold-dark">Notas para Andrea</Label>
            <Input value={notas} onChange={e => setNotas(e.target.value)} placeholder="Notas internas..." className="text-sm" />
          </div>

          {/* Acciones */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={!texto || updatePub.isPending} variant="luxury" className="flex-1">
              <Check className="h-4 w-4 mr-1" /> Guardar
            </Button>
            <Button onClick={handleDelete} variant="outline" className="border-rose-400/40 text-rose-500 hover:bg-rose-50">
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button onClick={onClose} variant="outline" className="border-gold-light/40">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

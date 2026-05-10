import { useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { SmartSelect } from '@/components/SmartSelect';
import { useAddEvidencia } from '@/hooks/useEvidencias';
import { TipoEvidencia } from '@/integrations/supabase/types';
import { Camera, Upload, X, Check, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Tipos ────────────────────────────────────────────────────

interface AppointmentOption {
  id: string;
  date: string;
  serviceName: string;
}

interface EvidenciaUploadSheetProps {
  open:         boolean;
  onClose:      () => void;
  clientId:     string;
  appointments: AppointmentOption[];
}

// ── Constantes ───────────────────────────────────────────────

const TIPOS: { value: TipoEvidencia; label: string; desc: string; color: string }[] = [
  { value: 'antes',     label: 'ANTES',     desc: 'Estado previo al tratamiento', color: 'border-amber-400 bg-amber-50 dark:bg-amber-400/10'   },
  { value: 'despues',   label: 'DESPUÉS',   desc: 'Resultado final',              color: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-400/10' },
  { value: 'proceso',   label: 'PROCESO',   desc: 'Durante la aplicación',        color: 'border-blue-400 bg-blue-50 dark:bg-blue-400/10'       },
  { value: 'resultado', label: 'RESULTADO', desc: 'Foto de presentación',         color: 'border-rosegold/60 bg-rosegold/5'                      },
];

const hoy = () => new Date().toISOString().slice(0, 10);

// ── Componente ───────────────────────────────────────────────

export function EvidenciaUploadSheet({
  open, onClose, clientId, appointments,
}: EvidenciaUploadSheetProps) {
  const addEvidencia = useAddEvidencia();
  const fileRef      = useRef<HTMLInputElement>(null);

  const [tipo,          setTipo]          = useState<TipoEvidencia>('antes');
  const [appointmentId, setAppointmentId] = useState('');
  const [tratamiento,   setTratamiento]   = useState('');
  const [descripcion,   setDescripcion]   = useState('');
  const [fecha,         setFecha]         = useState(hoy());
  const [marketing,     setMarketing]     = useState(false);
  const [file,          setFile]          = useState<File | null>(null);
  const [preview,       setPreview]       = useState<string | null>(null);
  const [dragging,      setDragging]      = useState(false);

  const reset = () => {
    setTipo('antes'); setAppointmentId(''); setTratamiento('');
    setDescripcion(''); setFecha(hoy()); setMarketing(false);
    setFile(null); setPreview(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.type.startsWith('image/') || f.type.startsWith('video/'))) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    await addEvidencia.mutateAsync({
      client_id:      clientId,
      appointment_id: appointmentId || null,
      service_id:     null,
      tipo,
      tipo_media:     file.type.startsWith('video/') ? 'video' : 'foto',
      file,
      tratamiento:    tratamiento || null,
      descripcion:    descripcion || null,
      fecha,
      uso_marketing:  marketing,
    });
    handleClose();
  };

  const aptOptions = appointments.map(a => ({
    value: a.id,
    label: a.serviceName,
    subtitle: new Date(a.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
  }));

  return (
    <Sheet open={open} onOpenChange={o => !o && handleClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-card border-l border-gold-light/30">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-serif text-foreground">
            <Camera className="h-5 w-5 text-gold" />
            Nueva evidencia
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">

          {/* Tipo */}
          <div className="space-y-2">
            <Label className="text-xs text-gold-dark">Tipo de evidencia *</Label>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTipo(t.value)}
                  className={cn(
                    'p-3 rounded-xl border-2 text-left transition-all',
                    tipo === t.value ? t.color + ' border-opacity-100' : 'border-gold-light/20 hover:border-gold/30',
                  )}
                >
                  <p className="text-xs font-bold text-foreground">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Upload */}
          <div className="space-y-2">
            <Label className="text-xs text-gold-dark">Archivo (foto o vídeo) *</Label>
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => !preview && fileRef.current?.click()}
              className={cn(
                'relative rounded-2xl border-2 border-dashed transition-all overflow-hidden',
                dragging ? 'border-gold bg-gold/5' : 'border-gold-light/30 hover:border-gold/40',
                preview ? 'cursor-default' : 'cursor-pointer',
              )}
            >
              {preview ? (
                <div className="relative">
                  {file?.type.startsWith('video/') ? (
                    <video src={preview} className="w-full max-h-56 object-cover rounded-2xl" controls />
                  ) : (
                    <img src={preview} alt="preview" className="w-full max-h-56 object-cover rounded-2xl" />
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); }}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8">
                  <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-gold" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Arrastra o <span className="text-gold font-medium">selecciona archivo</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">JPG, PNG, HEIC, MP4, MOV</p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={e => handleFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* Cita asociada */}
          {aptOptions.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-gold-dark">Cita asociada (opcional)</Label>
              <SmartSelect
                value={appointmentId}
                onChange={setAppointmentId}
                options={aptOptions}
                placeholder="Seleccionar cita…"
                createLabel=""
                onCreateNew={() => {}}
              />
            </div>
          )}

          {/* Tratamiento */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gold-dark">Tratamiento</Label>
            <Input
              value={tratamiento}
              onChange={e => setTratamiento(e.target.value)}
              placeholder="Ej: Manicura semipermanente, Pedicura…"
            />
          </div>

          {/* Fecha */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gold-dark">Fecha</Label>
            <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label className="text-xs text-gold-dark">Descripción (opcional)</Label>
            <Textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Notas sobre el estado, técnica aplicada…"
              rows={2}
              className="rounded-xl border-gold-light/50"
            />
          </div>

          {/* Toggle marketing */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gold/5 border border-gold-light/20">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-gold shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Autorizar uso en marketing</p>
                <p className="text-[10px] text-muted-foreground">Para publicaciones y redes sociales</p>
              </div>
            </div>
            <Switch checked={marketing} onCheckedChange={setMarketing} />
          </div>

          {/* Acciones */}
          <div className="flex gap-2 pt-1">
            <Button
              onClick={handleSubmit}
              disabled={!file || addEvidencia.isPending}
              variant="luxury"
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              Guardar evidencia
            </Button>
            <Button variant="outline" onClick={handleClose} className="border-gold-light/50">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

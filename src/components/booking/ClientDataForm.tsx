import { useState } from 'react';
import { User, Phone, Mail, MessageSquare, CalendarCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Service } from '@/lib/sampleData';

const MONTHS = ['enero','febrero','marzo','abril','mayo','junio',
                'julio','agosto','septiembre','octubre','noviembre','diciembre'];

function fmt(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  return `${days[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

interface ClientData { name: string; phone: string; email: string; notes: string }

interface Props {
  service: Service;
  date: string;
  time: string;
  loading: boolean;
  onSubmit: (data: ClientData) => void;
}

export function ClientDataForm({ service, date, time, loading, onSubmit }: Props) {
  const [form, setForm] = useState<ClientData>({ name: '', phone: '', email: '', notes: '' });
  const [errors, setErrors] = useState<Partial<ClientData>>({});

  const set = (k: keyof ClientData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const validate = () => {
    const errs: Partial<ClientData> = {};
    if (!form.name.trim())  errs.name  = 'El nombre es obligatorio';
    if (!form.phone.trim()) errs.phone = 'El teléfono es obligatorio';
    else if (!/^\+?[\d\s]{9,15}$/.test(form.phone.trim())) errs.phone = 'Teléfono no válido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-serif font-semibold text-foreground">Tus datos</h2>
        <p className="text-sm text-gold mt-1">Último paso para confirmar tu reserva</p>
      </div>

      {/* Booking summary */}
      <div className="bg-gradient-to-r from-gold/10 to-rosegold/10 rounded-2xl p-4 border border-gold-light/40 space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-2">Resumen</p>
        <div className="flex items-center gap-2 text-sm text-foreground">
          <CalendarCheck className="h-4 w-4 text-gold shrink-0" />
          <span className="capitalize">{fmt(date)} · {time}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-foreground">
          <span className="h-4 w-4 text-gold shrink-0 text-center leading-4">💆</span>
          <span>{service.name} · {service.duration} min · <strong>{service.price}€</strong></span>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-foreground">
          <User className="h-4 w-4 text-gold" /> Nombre completo *
        </Label>
        <Input value={form.name} onChange={set('name')} placeholder="Tu nombre" />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-foreground">
          <Phone className="h-4 w-4 text-gold" /> WhatsApp *
        </Label>
        <Input value={form.phone} onChange={set('phone')} placeholder="+34 600 000 000" type="tel" />
        {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
        <p className="text-xs text-muted-foreground">Recibirás la confirmación por WhatsApp</p>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-foreground">
          <Mail className="h-4 w-4 text-gold" /> Email <span className="text-muted-foreground text-xs">(opcional)</span>
        </Label>
        <Input value={form.email} onChange={set('email')} placeholder="tu@email.com" type="email" />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-foreground">
          <MessageSquare className="h-4 w-4 text-gold" /> Notas / alergias <span className="text-muted-foreground text-xs">(opcional)</span>
        </Label>
        <Textarea
          value={form.notes}
          onChange={set('notes')}
          placeholder="Alergias, preferencias de productos, información relevante..."
          rows={3}
          className="rounded-2xl border-gold-light/50 bg-card"
        />
      </div>

      <Button type="submit" disabled={loading} variant="luxury" size="lg" className="w-full">
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            Enviando reserva...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Solicitar Reserva
          </span>
        )}
      </Button>
    </form>
  );
}

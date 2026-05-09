import { useState } from 'react';
import { MessageCircle, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ReminderButtonProps {
  clientName: string;
  clientPhone?: string;
  serviceName: string;
  date: string;
  time: string;
  price: number;
}

export function ReminderButton({ 
  clientName, 
  clientPhone, 
  serviceName, 
  date, 
  time, 
  price 
}: ReminderButtonProps) {
  const [copied, setCopied] = useState(false);

  const formattedDate = new Date(date).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const message = `✨ *OMNIA Estética - Recordatorio de Cita* ✨

Hola ${clientName}! 👋

Te recordamos tu próxima cita:
📅 ${formattedDate}
🕐 ${time}
💆 ${serviceName}
💰 ${price}€

¡Te esperamos! 💖

_Para cambios o cancelaciones, contáctanos._`;

  const cleanPhone = clientPhone?.replace(/\s+/g, '').replace(/^\+/, '');
  
  const handleWhatsApp = () => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success('Mensaje copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-2">
      {clientPhone && (
        <Button 
          onClick={handleWhatsApp}
          variant="outline" 
          className="flex-1 border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          WhatsApp
        </Button>
      )}
      <Button 
        onClick={handleCopy}
        variant="outline" 
        className="flex-1 border-gold-light/50 hover:bg-gold/5 hover:border-gold"
      >
        {copied ? (
          <Check className="h-4 w-4 mr-2 text-green-500" />
        ) : (
          <Copy className="h-4 w-4 mr-2" />
        )}
        {copied ? 'Copiado' : 'Copiar'}
      </Button>
    </div>
  );
}
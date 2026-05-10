import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { BookingProgress } from '@/components/booking/BookingProgress';
import { ServicePicker } from '@/components/booking/ServicePicker';
import { AvailabilityCalendar } from '@/components/booking/AvailabilityCalendar';
import { TimeSlotPicker } from '@/components/booking/TimeSlotPicker';
import { ClientDataForm } from '@/components/booking/ClientDataForm';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { useCreateBookingRequest } from '@/hooks/useBookingRequests';
import { Service } from '@/lib/sampleData';

type Step = 1 | 2 | 3 | 4;

export default function BookingPortal() {
  const navigate = useNavigate();
  const { services } = useData();
  const createBooking = useCreateBookingRequest();

  const [step, setStep]               = useState<Step>(1);
  const [selectedService, setService] = useState<Service | null>(null);
  const [selectedDate, setDate]       = useState<string | null>(null);
  const [selectedTime, setTime]       = useState<string | null>(null);

  const activeServices = services.filter(s => (s as unknown as { active?: boolean }).active !== false);

  const goNext = () => setStep(s => Math.min(s + 1, 4) as Step);
  const goBack = () => {
    if (step === 1) return;
    setStep(s => (s - 1) as Step);
  };

  const handleSelectService = (s: Service) => {
    setService(s);
    setDate(null);
    setTime(null);
    goNext();
  };

  const handleSelectDate = (d: string) => {
    setDate(d);
    setTime(null);
    goNext();
  };

  const handleSelectTime = (t: string) => {
    setTime(t);
    goNext();
  };

  const handleSubmit = async (clientData: { name: string; phone: string; email: string; notes: string }) => {
    if (!selectedService || !selectedDate || !selectedTime) return;

    await createBooking.mutateAsync({
      channel: 'qr_web',
      client_name: clientData.name,
      phone: clientData.phone,
      email: clientData.email || undefined,
      service_id: selectedService.id,
      requested_date: selectedDate,
      requested_time: selectedTime,
      notes: clientData.notes || undefined,
    });

    navigate('/book/success', {
      state: {
        clientName: clientData.name,
        serviceName: selectedService.name,
        date: selectedDate,
        time: selectedTime,
      },
    });
  };

  return (
    <div className="min-h-screen marble-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-xl border-b border-gold-light/30">
        <div className="max-w-lg mx-auto px-4 flex h-14 items-center gap-3">
          {step > 1 && (
            <button onClick={goBack} className="p-1.5 -ml-1 rounded-xl text-gold hover:bg-gold/10 transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <img src="/LOGO ANDREA.jpg" alt="AS Belleza y Bienestar" className="h-9 w-auto object-contain" />
          <span className="text-xs text-muted-foreground ml-auto">Reserva online</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <BookingProgress current={step} />

        <div className="bg-card rounded-3xl border border-gold-light/30 shadow-luxury p-6">
          {step === 1 && (
            <ServicePicker
              services={activeServices}
              selectedId={selectedService?.id ?? null}
              onSelect={handleSelectService}
            />
          )}

          {step === 2 && selectedService && (
            <>
              <AvailabilityCalendar
                serviceId={selectedService.id}
                selectedDate={selectedDate}
                onSelect={handleSelectDate}
              />
              {selectedDate && (
                <Button onClick={goNext} variant="luxury" className="w-full mt-4">
                  Continuar con {selectedDate}
                </Button>
              )}
            </>
          )}

          {step === 3 && selectedService && selectedDate && (
            <>
              <TimeSlotPicker
                service={selectedService}
                date={selectedDate}
                selectedTime={selectedTime}
                onSelect={handleSelectTime}
              />
              {selectedTime && (
                <Button onClick={goNext} variant="luxury" className="w-full mt-4">
                  Continuar · {selectedTime}
                </Button>
              )}
            </>
          )}

          {step === 4 && selectedService && selectedDate && selectedTime && (
            <ClientDataForm
              service={selectedService}
              date={selectedDate}
              time={selectedTime}
              loading={createBooking.isPending}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </main>
    </div>
  );
}

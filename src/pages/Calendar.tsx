import Header from '@/components/Header';
import { WeekCalendar } from '@/components/WeekCalendar';

export default function Calendar() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-serif font-semibold text-foreground">Agenda</h1>
          <p className="text-sm text-gold mt-1">Vista semanal · Arrastra para reprogramar</p>
        </div>
        
        <div className="animate-fade-in">
          <WeekCalendar />
        </div>
      </main>
    </div>
  );
}

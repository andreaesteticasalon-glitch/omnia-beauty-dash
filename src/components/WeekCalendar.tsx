import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, GripVertical } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { cn } from '@/lib/utils';
import { QuickAppointmentSheet } from './QuickAppointmentSheet';
import { AppointmentDetailSheet } from './AppointmentDetailSheet';
import { Appointment } from '@/lib/sampleData';
import { toast } from 'sonner';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 9); // 9:00 - 20:00

interface DraggableAppointmentProps {
  appointment: Appointment;
  clientName: string;
  serviceName: string;
  onAppointmentClick: (apt: Appointment, e: React.MouseEvent) => void;
}

function DraggableAppointment({ appointment, clientName, serviceName, onAppointmentClick }: DraggableAppointmentProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: appointment.id,
    data: { appointment }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'text-[10px] p-1.5 rounded-xl mb-1 cursor-grab active:cursor-grabbing transition-all group',
        isDragging && 'opacity-50 scale-105 shadow-elevated z-50',
        appointment.status === 'completed'
          ? 'bg-sage/20 text-sage-foreground border border-sage/30'
          : appointment.status === 'cancelled'
          ? 'bg-muted text-muted-foreground line-through'
          : 'bg-gradient-to-r from-rosegold/20 to-gold/10 text-foreground border border-gold-light/40'
      )}
    >
      <div className="flex items-start gap-1">
        <div 
          {...attributes} 
          {...listeners}
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
        >
          <GripVertical className="h-3 w-3 text-gold/50" />
        </div>
        <div 
          className="flex-1 min-w-0"
          onClick={(e) => onAppointmentClick(appointment, e)}
        >
          <p className="font-medium truncate">{clientName}</p>
          <p className="truncate opacity-80">{serviceName}</p>
        </div>
      </div>
    </div>
  );
}

interface DroppableSlotProps {
  id: string;
  children: React.ReactNode;
  isToday: boolean;
  hasAppointments: boolean;
  onSlotClick: () => void;
}

function DroppableSlot({ id, children, isToday, hasAppointments, onSlotClick }: DroppableSlotProps) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      onClick={() => !hasAppointments && onSlotClick()}
      className={cn(
        'border-l border-gold-light/20 p-1 relative group transition-all duration-200 min-h-[60px]',
        isToday && 'bg-gold/5',
        !hasAppointments && 'cursor-pointer hover:bg-gold/10',
        isOver && 'bg-gold/20 ring-2 ring-gold ring-inset'
      )}
    >
      {/* Empty slot indicator */}
      {!hasAppointments && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="h-6 w-6 rounded-full bg-gold/20 flex items-center justify-center">
            <Plus className="h-3 w-3 text-gold" />
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

export function WeekCalendar() {
  const { appointments, getClientById, getServiceById, updateAppointment } = useData();
  const [weekOffset, setWeekOffset] = useState(0);
  const [quickAppointmentOpen, setQuickAppointmentOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState({ date: '', time: '' });
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  const weekDays = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7);
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  }, [weekOffset]);

  const getAppointmentsForSlot = (date: Date, hour: number) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(a => {
      const appointmentHour = parseInt(a.time.split(':')[0]);
      return a.date === dateStr && appointmentHour === hour;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleSlotClick = (date: Date, hour: number) => {
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    setSelectedSlot({ date: dateStr, time: timeStr });
    setQuickAppointmentOpen(true);
  };

  const handleAppointmentClick = (apt: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAppointment(apt);
    setDetailSheetOpen(true);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const appointmentId = active.id as string;
    const dropTargetId = over.id as string;

    // Parse the drop target ID (format: "date-hour")
    const [dateStr, hourStr] = dropTargetId.split('_');
    if (!dateStr || !hourStr) return;

    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment) return;

    // Check if moving to same slot
    const newTime = `${hourStr.padStart(2, '0')}:00`;
    if (appointment.date === dateStr && appointment.time === newTime) return;

    // Update appointment
    updateAppointment(appointmentId, {
      date: dateStr,
      time: newTime,
    });

    const client = getClientById(appointment.clientId);
    toast.success(
      <div className="flex flex-col gap-1">
        <p className="font-medium">Cita reprogramada</p>
        <p className="text-sm text-muted-foreground">
          {client?.name} movida al {new Date(dateStr).toLocaleDateString('es-ES')} a las {newTime}
        </p>
      </div>
    );
  };

  const activeAppointment = activeId ? appointments.find(a => a.id === activeId) : null;

  return (
    <>
      <DndContext 
        sensors={sensors}
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
      >
        <div className="bg-card rounded-3xl shadow-luxury border border-gold-light/30 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gold-light/30 bg-gradient-to-r from-card to-gold/5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setWeekOffset(prev => prev - 1)}
              className="h-9 w-9 text-gold hover:bg-gold/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h3 className="font-serif font-medium text-foreground capitalize">
              {weekDays[0].toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setWeekOffset(prev => prev + 1)}
              className="h-9 w-9 text-gold hover:bg-gold/10"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-8 border-b border-gold-light/30">
            <div className="p-2 text-center text-xs text-muted-foreground"></div>
            {weekDays.map((date, i) => (
              <div
                key={i}
                className={cn(
                  'p-2 text-center border-l border-gold-light/20',
                  isToday(date) && 'bg-gradient-to-b from-gold/10 to-transparent'
                )}
              >
                <p className="text-[10px] text-gold uppercase tracking-wide">
                  {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                </p>
                <p className={cn(
                  'text-sm font-medium mt-0.5',
                  isToday(date) ? 'text-gold font-semibold' : 'text-foreground'
                )}>
                  {date.getDate()}
                </p>
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="max-h-[400px] overflow-y-auto">
            {HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-8 border-b border-gold-light/20">
                <div className="p-2 text-xs text-gold/70 text-right pr-3 pt-1 font-medium">
                  {hour}:00
                </div>
                {weekDays.map((date, dayIndex) => {
                  const slotAppointments = getAppointmentsForSlot(date, hour);
                  const hasAppointments = slotAppointments.length > 0;
                  const dateStr = date.toISOString().split('T')[0];
                  const slotId = `${dateStr}_${hour}`;
                  
                  return (
                    <DroppableSlot
                      key={dayIndex}
                      id={slotId}
                      isToday={isToday(date)}
                      hasAppointments={hasAppointments}
                      onSlotClick={() => handleSlotClick(date, hour)}
                    >
                      {slotAppointments.map(apt => {
                        const client = getClientById(apt.clientId);
                        const service = getServiceById(apt.serviceId);
                        return (
                          <DraggableAppointment
                            key={apt.id}
                            appointment={apt}
                            clientName={client?.name || 'Cliente'}
                            serviceName={service?.name || ''}
                            onAppointmentClick={handleAppointmentClick}
                          />
                        );
                      })}
                    </DroppableSlot>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeAppointment && (
            <div className="bg-card border-2 border-gold rounded-xl p-2 shadow-elevated opacity-90">
              <p className="text-xs font-medium">{getClientById(activeAppointment.clientId)?.name}</p>
              <p className="text-xs text-muted-foreground">{getServiceById(activeAppointment.serviceId)?.name}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <QuickAppointmentSheet
        open={quickAppointmentOpen}
        onOpenChange={setQuickAppointmentOpen}
        prefilledDate={selectedSlot.date}
        prefilledTime={selectedSlot.time}
      />

      <AppointmentDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        appointment={selectedAppointment}
      />
    </>
  );
}

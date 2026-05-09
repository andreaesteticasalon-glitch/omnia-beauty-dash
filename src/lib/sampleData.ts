export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  preferences?: string;
  createdAt: Date;
  loyaltyPoints?: number;
  loyaltyTier?: LoyaltyTier;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
  category?: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  serviceId: string;
  date: string;
  time: string;
  price: number;
  notes?: string;
  photoUrl?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export const sampleClients: Client[] = [
  { id: '1', name: 'María García', phone: '+34 612 345 678', email: 'maria@email.com', preferences: 'Prefiere citas por la mañana', createdAt: new Date('2024-01-15') },
  { id: '2', name: 'Laura Martínez', phone: '+34 623 456 789', email: 'laura@email.com', preferences: 'Alérgica a ciertos productos', createdAt: new Date('2024-02-20') },
  { id: '3', name: 'Carmen López', phone: '+34 634 567 890', email: 'carmen@email.com', notes: 'Cliente VIP', createdAt: new Date('2024-03-10') },
  { id: '4', name: 'Ana Fernández', phone: '+34 645 678 901', email: 'ana@email.com', createdAt: new Date('2024-04-05') },
  { id: '5', name: 'Isabel Ruiz', phone: '+34 656 789 012', email: 'isabel@email.com', preferences: 'Solo productos naturales', createdAt: new Date('2024-05-12') },
];

export const sampleServices: Service[] = [
  { id: '1', name: 'Limpieza Facial Profunda', price: 45, duration: 60, category: 'Facial', description: 'Limpieza completa con extracción' },
  { id: '2', name: 'Tratamiento Antiedad', price: 75, duration: 90, category: 'Facial', description: 'Tratamiento rejuvenecedor premium' },
  { id: '3', name: 'Manicura Semipermanente', price: 25, duration: 45, category: 'Uñas', description: 'Esmalte de larga duración' },
  { id: '4', name: 'Pedicura Spa', price: 35, duration: 60, category: 'Uñas', description: 'Tratamiento completo de pies' },
  { id: '5', name: 'Masaje Relajante', price: 50, duration: 60, category: 'Masajes', description: 'Masaje corporal completo' },
  { id: '6', name: 'Depilación Láser Axilas', price: 40, duration: 30, category: 'Depilación', description: 'Tecnología láser diodo' },
  { id: '7', name: 'Micropigmentación Cejas', price: 150, duration: 120, category: 'Micropigmentación', description: 'Diseño personalizado' },
  { id: '8', name: 'Hidratación Corporal', price: 55, duration: 75, category: 'Corporal', description: 'Envolvimiento nutritivo' },
];

const today = new Date();
const getDateString = (daysOffset: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

export const sampleAppointments: Appointment[] = [
  { id: '1', clientId: '1', serviceId: '1', date: getDateString(0), time: '10:00', price: 45, status: 'scheduled' },
  { id: '2', clientId: '2', serviceId: '3', date: getDateString(0), time: '11:30', price: 25, status: 'scheduled' },
  { id: '3', clientId: '3', serviceId: '5', date: getDateString(0), time: '14:00', price: 50, status: 'completed' },
  { id: '4', clientId: '4', serviceId: '2', date: getDateString(1), time: '09:00', price: 75, status: 'scheduled' },
  { id: '5', clientId: '5', serviceId: '4', date: getDateString(1), time: '16:00', price: 35, status: 'scheduled' },
  { id: '6', clientId: '1', serviceId: '6', date: getDateString(2), time: '12:00', price: 40, status: 'scheduled' },
  { id: '7', clientId: '2', serviceId: '7', date: getDateString(-1), time: '10:00', price: 150, status: 'completed' },
  { id: '8', clientId: '3', serviceId: '1', date: getDateString(-2), time: '11:00', price: 45, status: 'completed' },
  { id: '9', clientId: '4', serviceId: '5', date: getDateString(-3), time: '15:00', price: 50, status: 'completed' },
  { id: '10', clientId: '5', serviceId: '8', date: getDateString(-4), time: '09:30', price: 55, status: 'completed' },
  { id: '11', clientId: '1', serviceId: '3', date: getDateString(-5), time: '14:00', price: 25, status: 'completed' },
  { id: '12', clientId: '2', serviceId: '2', date: getDateString(-6), time: '10:30', price: 75, status: 'completed' },
  { id: '13', clientId: '3', serviceId: '4', date: getDateString(-7), time: '16:30', price: 35, status: 'completed' },
];

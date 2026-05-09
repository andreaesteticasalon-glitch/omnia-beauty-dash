import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client, Service, Appointment, LoyaltyTier } from '@/lib/sampleData';
import { ClientRow, ServiceRow, AppointmentRow } from '@/integrations/supabase/types';

// --- Mappers: DB row → app type ---

function rowToClient(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    notes: row.notes ?? undefined,
    preferences: row.preferences ?? undefined,
    loyaltyPoints: row.loyalty_points,
    loyaltyTier: row.loyalty_tier,
    createdAt: new Date(row.created_at),
  };
}

function rowToService(row: ServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    duration: row.duration,
    description: row.description ?? undefined,
    category: row.category ?? undefined,
  };
}

function rowToAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    clientId: row.client_id,
    serviceId: row.service_id ?? '',
    date: row.date,
    time: row.time,
    price: row.price,
    notes: row.notes ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    status: row.status,
  };
}

// --- Context type ---

interface DataContextType {
  clients: Client[];
  services: Service[];
  appointments: Appointment[];
  isLoading: boolean;
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addService: (service: Omit<Service, 'id'>) => void;
  updateService: (id: string, service: Partial<Service>) => void;
  deleteService: (id: string) => void;
  addAppointment: (appointment: Omit<Appointment, 'id'>) => void;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  getClientById: (id: string) => Client | undefined;
  getServiceById: (id: string) => Service | undefined;
  addLoyaltyPoints: (clientId: string, points: number) => void;
  calculateLoyaltyTier: (points: number) => LoyaltyTier;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// --- Provider ---

export function DataProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // --- Queries ---

  const { data: clientRows = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ClientRow[];
    },
  });

  const { data: serviceRows = [], isLoading: loadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('active', true)
        .order('category', { ascending: true });
      if (error) throw error;
      return data as ServiceRow[];
    },
  });

  const { data: appointmentRows = [], isLoading: loadingAppointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return data as AppointmentRow[];
    },
  });

  const clients = clientRows.map(rowToClient);
  const services = serviceRows.map(rowToService);
  const appointments = appointmentRows.map(rowToAppointment);
  const isLoading = loadingClients || loadingServices || loadingAppointments;

  // --- Helpers ---

  const calculateLoyaltyTier = useCallback((points: number): LoyaltyTier => {
    if (points >= 600) return 'platinum';
    if (points >= 300) return 'gold';
    if (points >= 100) return 'silver';
    return 'bronze';
  }, []);

  const getClientById = useCallback((id: string) => clients.find(c => c.id === id), [clients]);
  const getServiceById = useCallback((id: string) => services.find(s => s.id === id), [services]);

  // --- Client mutations ---

  const addClientMutation = useMutation({
    mutationFn: async (client: Omit<Client, 'id' | 'createdAt'>) => {
      const { error } = await supabase.from('clients').insert({
        name: client.name,
        phone: client.phone ?? null,
        email: client.email ?? null,
        notes: client.notes ?? null,
        preferences: client.preferences ?? null,
        loyalty_points: client.loyaltyPoints ?? 0,
        loyalty_tier: client.loyaltyTier ?? 'bronze',
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Client> }) => {
      const patch: Record<string, unknown> = {};
      if (updates.name !== undefined) patch.name = updates.name;
      if (updates.phone !== undefined) patch.phone = updates.phone ?? null;
      if (updates.email !== undefined) patch.email = updates.email ?? null;
      if (updates.notes !== undefined) patch.notes = updates.notes ?? null;
      if (updates.preferences !== undefined) patch.preferences = updates.preferences ?? null;
      if (updates.loyaltyPoints !== undefined) patch.loyalty_points = updates.loyaltyPoints;
      if (updates.loyaltyTier !== undefined) patch.loyalty_tier = updates.loyaltyTier;
      const { error } = await supabase.from('clients').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  // --- Service mutations ---

  const addServiceMutation = useMutation({
    mutationFn: async (service: Omit<Service, 'id'>) => {
      const { error } = await supabase.from('services').insert({
        name: service.name,
        price: service.price,
        duration: service.duration,
        description: service.description ?? null,
        category: service.category ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Service> }) => {
      const patch: Record<string, unknown> = {};
      if (updates.name !== undefined) patch.name = updates.name;
      if (updates.price !== undefined) patch.price = updates.price;
      if (updates.duration !== undefined) patch.duration = updates.duration;
      if (updates.description !== undefined) patch.description = updates.description ?? null;
      if (updates.category !== undefined) patch.category = updates.category ?? null;
      const { error } = await supabase.from('services').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      // Soft delete — keeps referential integrity on appointments
      const { error } = await supabase.from('services').update({ active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });

  // --- Appointment mutations ---

  const addAppointmentMutation = useMutation({
    mutationFn: async (appointment: Omit<Appointment, 'id'>) => {
      const { error } = await supabase.from('appointments').insert({
        client_id: appointment.clientId,
        service_id: appointment.serviceId || null,
        date: appointment.date,
        time: appointment.time,
        price: appointment.price,
        notes: appointment.notes ?? null,
        photo_url: appointment.photoUrl ?? null,
        status: appointment.status,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Appointment> }) => {
      const patch: Record<string, unknown> = {};
      if (updates.clientId !== undefined) patch.client_id = updates.clientId;
      if (updates.serviceId !== undefined) patch.service_id = updates.serviceId || null;
      if (updates.date !== undefined) patch.date = updates.date;
      if (updates.time !== undefined) patch.time = updates.time;
      if (updates.price !== undefined) patch.price = updates.price;
      if (updates.notes !== undefined) patch.notes = updates.notes ?? null;
      if (updates.photoUrl !== undefined) patch.photo_url = updates.photoUrl ?? null;
      if (updates.status !== undefined) patch.status = updates.status;
      const { error } = await supabase.from('appointments').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const deleteAppointmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  // --- Loyalty ---

  const addLoyaltyPoints = useCallback((clientId: string, points: number) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const newPoints = (client.loyaltyPoints ?? 0) + points;
    updateClientMutation.mutate({
      id: clientId,
      updates: { loyaltyPoints: newPoints, loyaltyTier: calculateLoyaltyTier(newPoints) },
    });
  }, [clients, updateClientMutation, calculateLoyaltyTier]);

  return (
    <DataContext.Provider value={{
      clients,
      services,
      appointments,
      isLoading,
      addClient: (c) => addClientMutation.mutate(c),
      updateClient: (id, updates) => updateClientMutation.mutate({ id, updates }),
      deleteClient: (id) => deleteClientMutation.mutate(id),
      addService: (s) => addServiceMutation.mutate(s),
      updateService: (id, updates) => updateServiceMutation.mutate({ id, updates }),
      deleteService: (id) => deleteServiceMutation.mutate(id),
      addAppointment: (a) => addAppointmentMutation.mutate(a),
      updateAppointment: (id, updates) => updateAppointmentMutation.mutate({ id, updates }),
      deleteAppointment: (id) => deleteAppointmentMutation.mutate(id),
      getClientById,
      getServiceById,
      addLoyaltyPoints,
      calculateLoyaltyTier,
    }}>
      {children}
    </DataContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
}

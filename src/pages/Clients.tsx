import { useState } from 'react';
import { Search, Plus, User, Phone, Mail, Calendar, X, Award } from 'lucide-react';
import Header from '@/components/Header';
import { ClientCard } from '@/components/ClientCard';
import { LoyaltyBadge } from '@/components/LoyaltyBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useData } from '@/contexts/DataContext';
import { Client } from '@/lib/sampleData';

export default function Clients() {
  const { clients, appointments, addClient, updateClient, deleteClient, getServiceById } = useData();
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', preferences: '', notes: '' });

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const handleAddClient = () => {
    if (!formData.name.trim()) return;
    addClient(formData);
    setFormData({ name: '', phone: '', email: '', preferences: '', notes: '' });
    setIsAdding(false);
  };

  const handleUpdateClient = () => {
    if (!selectedClient || !formData.name.trim()) return;
    updateClient(selectedClient.id, formData);
    setSelectedClient(null);
  };

  const handleDeleteClient = () => {
    if (!selectedClient) return;
    deleteClient(selectedClient.id);
    setSelectedClient(null);
  };

  const openClientDetail = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      phone: client.phone || '',
      email: client.email || '',
      preferences: client.preferences || '',
      notes: client.notes || '',
    });
  };

  const clientAppointments = selectedClient
    ? appointments.filter(a => a.clientId === selectedClient.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const getNextTierInfo = (points: number): string => {
    if (points >= 600) return '¡Máximo nivel!';
    if (points >= 300) return `${600 - points} pts para Platino`;
    if (points >= 100) return `${300 - points} pts para Oro`;
    return `${100 - points} pts para Plata`;
  };

  return (
    <div className="min-h-screen marble-bg pb-24">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-2xl font-serif font-semibold text-foreground">Clientes</h1>
            <p className="text-sm text-gold">{clients.length} clientes registrados</p>
          </div>
          <Button onClick={() => setIsAdding(true)} variant="gold" className="gap-2">
            <Plus className="h-4 w-4" />
            Añadir
          </Button>
        </div>

        {/* Search */}
        <div className="relative animate-fade-in">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gold" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11"
          />
        </div>

        {/* Client List */}
        <div className="space-y-3">
          {filteredClients.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              appointments={appointments}
              onClick={() => openClientDetail(client)}
            />
          ))}
          {filteredClients.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No se encontraron clientes</p>
          )}
        </div>
      </main>

      {/* Add Client Sheet */}
      <Sheet open={isAdding} onOpenChange={setIsAdding}>
        <SheetContent side="bottom" className="rounded-t-3xl bg-card border-t border-gold-light/30">
          <SheetHeader>
            <SheetTitle className="font-serif text-foreground">Nuevo Cliente</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-gold-dark">Nombre *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre completo"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-gold-dark">Teléfono</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+34 600..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gold-dark">Email</Label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@ejemplo.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gold-dark">Preferencias</Label>
              <Textarea
                value={formData.preferences}
                onChange={(e) => setFormData(prev => ({ ...prev, preferences: e.target.value }))}
                placeholder="Horarios preferidos, productos favoritos..."
                className="rounded-2xl border-gold-light/50 focus:border-gold focus:ring-gold/30 bg-card"
              />
            </div>
            <Button onClick={handleAddClient} variant="luxury" className="w-full">
              Guardar Cliente
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Client Detail Sheet */}
      <Sheet open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto bg-card border-t border-gold-light/30">
          <SheetHeader>
            <SheetTitle className="font-serif text-foreground">Detalle del Cliente</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-gold-dark">Nombre</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-gold-dark">Teléfono</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gold-dark">Email</Label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gold-dark">Preferencias</Label>
              <Textarea
                value={formData.preferences}
                onChange={(e) => setFormData(prev => ({ ...prev, preferences: e.target.value }))}
                className="rounded-2xl border-gold-light/50 focus:border-gold focus:ring-gold/30 bg-card"
              />
            </div>

            {/* Loyalty Program Section */}
            {selectedClient && (
              <div className="pt-4 border-t border-gold-light/30">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="h-4 w-4 text-gold" strokeWidth={1.5} />
                  <h4 className="text-sm font-medium text-gold-dark">Programa de Fidelidad</h4>
                </div>
                <div className="bg-gradient-to-r from-gold/10 to-rosegold/10 rounded-2xl p-4 border border-gold-light/30">
                  <div className="flex items-center justify-between">
                    <LoyaltyBadge 
                      tier={selectedClient.loyaltyTier || 'bronze'} 
                      points={selectedClient.loyaltyPoints || 0} 
                      size="md"
                    />
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Próximo nivel</p>
                      <p className="text-sm font-medium text-gold">
                        {getNextTierInfo(selectedClient.loyaltyPoints || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appointment History */}
            {clientAppointments.length > 0 && (
              <div className="pt-4 border-t border-gold-light/30">
                <h4 className="text-sm font-medium text-gold-dark mb-3">Historial de Citas</h4>
                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                  {clientAppointments.slice(0, 10).map(apt => {
                    const service = getServiceById(apt.serviceId);
                    return (
                      <div key={apt.id} className="flex items-center justify-between text-sm p-3 bg-gold/5 rounded-2xl border border-gold-light/30">
                        <div>
                          <p className="font-medium text-foreground">{service?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(apt.date).toLocaleDateString('es-ES')} - {apt.time}
                          </p>
                        </div>
                        <span className="text-gold font-serif font-medium">{apt.price} €</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={handleDeleteClient} className="flex-1 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10">
                Eliminar
              </Button>
              <Button onClick={handleUpdateClient} variant="luxury" className="flex-1">
                Guardar Cambios
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

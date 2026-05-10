import { useState } from 'react';
import { Plus } from 'lucide-react';
import Header from '@/components/Header';
import { ServiceCard } from '@/components/ServiceCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useData } from '@/contexts/DataContext';
import { Service } from '@/lib/sampleData';

export default function Services() {
  const { services, addService, updateService, deleteService } = useData();
  const [isAdding, setIsAdding] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', duration: '', category: '', description: '' });

  const categories = [...new Set(services.map(s => s.category).filter(Boolean))];
  const groupedServices = services.reduce((acc, service) => {
    const cat = service.category || 'Otros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const resetForm = () => {
    setFormData({ name: '', price: '', duration: '', category: '', description: '' });
  };

  const handleAddService = () => {
    if (!formData.name.trim() || !formData.price || !formData.duration) return;
    addService({
      name: formData.name,
      price: parseFloat(formData.price),
      duration: parseInt(formData.duration),
      category: formData.category || undefined,
      description: formData.description || undefined,
    });
    resetForm();
    setIsAdding(false);
  };

  const handleUpdateService = () => {
    if (!editingService || !formData.name.trim()) return;
    updateService(editingService.id, {
      name: formData.name,
      price: parseFloat(formData.price),
      duration: parseInt(formData.duration),
      category: formData.category || undefined,
      description: formData.description || undefined,
    });
    setEditingService(null);
    resetForm();
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      price: service.price.toString(),
      duration: service.duration.toString(),
      category: service.category || '',
      description: service.description || '',
    });
  };

  const handleDelete = (service: Service) => {
    deleteService(service.id);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-2xl font-serif font-semibold text-foreground">Servicios</h1>
            <p className="text-sm text-gold">{services.length} servicios disponibles</p>
          </div>
          <Button onClick={() => setIsAdding(true)} variant="gold" className="gap-2">
            <Plus className="h-4 w-4" />
            Añadir
          </Button>
        </div>

        {/* Services by Category */}
        {Object.entries(groupedServices).map(([category, categoryServices]) => (
          <div key={category} className="animate-fade-in">
            <h2 className="text-sm font-medium text-gold uppercase tracking-wider mb-3">
              {category}
            </h2>
            <div className="grid gap-3">
              {categoryServices.map(service => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onEdit={() => handleEdit(service)}
                  onDelete={() => handleDelete(service)}
                />
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* Add/Edit Service Sheet */}
      <Sheet open={isAdding || !!editingService} onOpenChange={() => { setIsAdding(false); setEditingService(null); resetForm(); }}>
        <SheetContent side="bottom" className="rounded-t-3xl bg-card border-t border-gold-light/30">
          <SheetHeader>
            <SheetTitle className="font-serif text-foreground">
              {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-gold-dark">Nombre del servicio *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Limpieza Facial"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-gold-dark">Precio (€) *</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="45"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gold-dark">Duración (min) *</Label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="60"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gold-dark">Categoría</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Ej: Facial, Uñas, Masajes"
                list="categories"
              />
              <datalist id="categories">
                {categories.map(cat => <option key={cat} value={cat} />)}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label className="text-gold-dark">Descripción</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción breve del servicio..."
                className="rounded-2xl border-gold-light/50 focus:border-gold focus:ring-gold/30 bg-card"
              />
            </div>
            <Button 
              onClick={editingService ? handleUpdateService : handleAddService} 
              variant="luxury"
              className="w-full"
            >
              {editingService ? 'Guardar Cambios' : 'Crear Servicio'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

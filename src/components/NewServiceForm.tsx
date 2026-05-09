import { useState } from "react";
import { Plus, Tag, Euro, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const NewServiceForm = () => {
  const { toast } = useToast();
  const [serviceName, setServiceName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Servicio creado",
      description: `"${serviceName}" añadido al catálogo.`,
    });

    // Reset form
    setServiceName("");
    setPrice("");
    setDuration("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      {/* Service Name */}
      <div className="space-y-2">
        <Label htmlFor="serviceName" className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Tag className="h-4 w-4 text-gold" strokeWidth={1.5} />
          Nombre del servicio
        </Label>
        <Input
          id="serviceName"
          placeholder="Ej: Manicura francesa"
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
          required
        />
      </div>

      {/* Price and Duration Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="servicePrice" className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Euro className="h-4 w-4 text-gold" strokeWidth={1.5} />
            Precio (€)
          </Label>
          <Input
            id="servicePrice"
            type="number"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="0"
            step="0.01"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="serviceDuration" className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Clock className="h-4 w-4 text-gold" strokeWidth={1.5} />
            Duración (min)
          </Label>
          <Input
            id="serviceDuration"
            type="number"
            placeholder="30"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min="0"
            step="5"
            required
          />
        </div>
      </div>

      {/* Submit Button */}
      <Button type="submit" variant="gold" size="lg" className="w-full">
        <Plus className="h-5 w-5" />
        Crear Servicio
      </Button>
    </form>
  );
};

export default NewServiceForm;

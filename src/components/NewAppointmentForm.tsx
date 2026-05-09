import { useState, useRef } from "react";
import { CalendarPlus, User, Scissors, Euro, Camera, FileText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FloralFrame } from "./FloralFrame";

const services = [
  { id: "1", name: "Manicura", price: 25 },
  { id: "2", name: "Pedicura", price: 30 },
  { id: "3", name: "Limpieza facial", price: 45 },
  { id: "4", name: "Depilación láser", price: 80 },
  { id: "5", name: "Masaje relajante", price: 55 },
];

const NewAppointmentForm = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [client, setClient] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleServiceChange = (serviceId: string) => {
    setSelectedService(serviceId);
    const service = services.find((s) => s.id === serviceId);
    if (service) {
      setPrice(service.price.toString());
    }
  };

  const handleImageChange = (file: File | null) => {
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleImageChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Cita guardada",
      description: `Cita para ${client} registrada correctamente.`,
    });

    // Reset form
    setClient("");
    setSelectedService("");
    setPrice("");
    setNotes("");
    removeImage();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      {/* Client Name */}
      <div className="space-y-2">
        <Label htmlFor="client" className="flex items-center gap-2 text-sm font-medium text-foreground">
          <User className="h-4 w-4 text-gold" strokeWidth={1.5} />
          Cliente
        </Label>
        <Input
          id="client"
          placeholder="Nombre del cliente"
          value={client}
          onChange={(e) => setClient(e.target.value)}
          required
        />
      </div>

      {/* Service Select */}
      <div className="space-y-2">
        <Label htmlFor="service" className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Scissors className="h-4 w-4 text-gold" strokeWidth={1.5} />
          Servicio
        </Label>
        <Select value={selectedService} onValueChange={handleServiceChange} required>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un servicio" />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {service.name} - {service.price}€
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price */}
      <div className="space-y-2">
        <Label htmlFor="price" className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Euro className="h-4 w-4 text-gold" strokeWidth={1.5} />
          Precio (€)
        </Label>
        <Input
          id="price"
          type="number"
          placeholder="0.00"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          min="0"
          step="0.01"
          required
        />
      </div>

      {/* Photo Upload with Floral Frame */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Camera className="h-4 w-4 text-gold" strokeWidth={1.5} />
          Foto (opcional)
        </Label>
        <FloralFrame>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative text-center transition-all duration-300 ${
              isDragging
                ? "bg-gold/10"
                : "bg-transparent"
            }`}
          >
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-32 rounded-xl shadow-card"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 h-7 w-7 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-card hover:scale-110 transition-transform"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3 py-4">
                <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto">
                  <Upload className="h-6 w-6 text-gold" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Arrastra una imagen o{" "}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-gold hover:text-gold-dark font-medium transition-colors"
                  >
                    selecciona un archivo
                  </button>
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
              className="hidden"
            />
          </div>
        </FloralFrame>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="flex items-center gap-2 text-sm font-medium text-foreground">
          <FileText className="h-4 w-4 text-gold" strokeWidth={1.5} />
          Notas
        </Label>
        <Textarea
          id="notes"
          placeholder="Añade notas adicionales..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="rounded-2xl border-gold-light/50 focus:border-gold focus:ring-gold/30 bg-card"
        />
      </div>

      {/* Submit Button */}
      <Button type="submit" variant="luxury" size="xl" className="w-full">
        <CalendarPlus className="h-5 w-5" />
        Guardar Cita
      </Button>
    </form>
  );
};

export default NewAppointmentForm;

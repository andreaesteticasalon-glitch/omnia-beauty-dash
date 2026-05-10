export type LoyaltyTier     = 'bronze' | 'silver' | 'gold' | 'platinum';
export type CategoriaProducto = 'tinte' | 'cosmético' | 'consumible' | 'herramienta' | 'limpieza' | 'otro';
export type TipoMovimiento  = 'entrada' | 'salida' | 'ajuste' | 'merma';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';
export type BookingStatus   = 'pending' | 'accepted' | 'rejected' | 'cancelled';
export type BookingChannel  = 'whatsapp' | 'qr_web';
export type WaDirection     = 'inbound' | 'outbound';
export type PaymentMethod   = 'efectivo' | 'tarjeta' | 'bizum' | 'transferencia';

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string; name: string; phone: string | null; email: string | null;
          notes: string | null; preferences: string | null;
          loyalty_points: number; loyalty_tier: LoyaltyTier; created_at: string;
        };
        Insert: {
          id?: string; name: string; phone?: string | null; email?: string | null;
          notes?: string | null; preferences?: string | null;
          loyalty_points?: number; loyalty_tier?: LoyaltyTier; created_at?: string;
        };
        Update: {
          id?: string; name?: string; phone?: string | null; email?: string | null;
          notes?: string | null; preferences?: string | null;
          loyalty_points?: number; loyalty_tier?: LoyaltyTier; created_at?: string;
        };
      };
      services: {
        Row: {
          id: string; name: string; price: number; duration: number;
          description: string | null; category: string | null;
          active: boolean; created_at: string;
        };
        Insert: {
          id?: string; name: string; price: number; duration: number;
          description?: string | null; category?: string | null;
          active?: boolean; created_at?: string;
        };
        Update: {
          id?: string; name?: string; price?: number; duration?: number;
          description?: string | null; category?: string | null;
          active?: boolean; created_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string; client_id: string; service_id: string | null;
          date: string; time: string; price: number;
          notes: string | null; photo_url: string | null;
          status: AppointmentStatus; created_at: string;
        };
        Insert: {
          id?: string; client_id: string; service_id?: string | null;
          date: string; time: string; price: number;
          notes?: string | null; photo_url?: string | null;
          status?: AppointmentStatus; created_at?: string;
        };
        Update: {
          id?: string; client_id?: string; service_id?: string | null;
          date?: string; time?: string; price?: number;
          notes?: string | null; photo_url?: string | null;
          status?: AppointmentStatus; created_at?: string;
        };
      };
      availability_config: {
        Row: {
          id: string; day_of_week: number; is_open: boolean;
          open_time: string; close_time: string; slot_duration: number;
          break_start: string | null; break_end: string | null;
        };
        Insert: {
          id?: string; day_of_week: number; is_open?: boolean;
          open_time?: string; close_time?: string; slot_duration?: number;
          break_start?: string | null; break_end?: string | null;
        };
        Update: {
          id?: string; day_of_week?: number; is_open?: boolean;
          open_time?: string; close_time?: string; slot_duration?: number;
          break_start?: string | null; break_end?: string | null;
        };
      };
      blocked_dates: {
        Row: {
          id: string; date: string; reason: string | null;
          all_day: boolean; block_start: string | null; block_end: string | null;
        };
        Insert: {
          id?: string; date: string; reason?: string | null;
          all_day?: boolean; block_start?: string | null; block_end?: string | null;
        };
        Update: {
          id?: string; date?: string; reason?: string | null;
          all_day?: boolean; block_start?: string | null; block_end?: string | null;
        };
      };
      whatsapp_sessions: {
        Row: {
          id: string; phone: string; step: string; client_name: string | null;
          service_id: string | null; selected_date: string | null;
          selected_time: string | null; expires_at: string; updated_at: string;
        };
        Insert: {
          id?: string; phone: string; step?: string; client_name?: string | null;
          service_id?: string | null; selected_date?: string | null;
          selected_time?: string | null; expires_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; phone?: string; step?: string; client_name?: string | null;
          service_id?: string | null; selected_date?: string | null;
          selected_time?: string | null; expires_at?: string; updated_at?: string;
        };
      };
      booking_requests: {
        Row: {
          id: string; channel: BookingChannel; client_name: string; phone: string;
          email: string | null; service_id: string | null;
          requested_date: string; requested_time: string;
          status: BookingStatus; appointment_id: string | null;
          reminder_sent: boolean; reminder_sent_at: string | null;
          client_confirmed: boolean | null; client_confirmed_at: string | null;
          notes: string | null; created_at: string;
        };
        Insert: {
          id?: string; channel?: BookingChannel; client_name: string; phone: string;
          email?: string | null; service_id?: string | null;
          requested_date: string; requested_time: string;
          status?: BookingStatus; appointment_id?: string | null;
          reminder_sent?: boolean; reminder_sent_at?: string | null;
          client_confirmed?: boolean | null; client_confirmed_at?: string | null;
          notes?: string | null; created_at?: string;
        };
        Update: {
          id?: string; channel?: BookingChannel; client_name?: string; phone?: string;
          email?: string | null; service_id?: string | null;
          requested_date?: string; requested_time?: string;
          status?: BookingStatus; appointment_id?: string | null;
          reminder_sent?: boolean; reminder_sent_at?: string | null;
          client_confirmed?: boolean | null; client_confirmed_at?: string | null;
          notes?: string | null; created_at?: string;
        };
      };
      service_materials: {
        Row: {
          id: string; service_id: string; product: string;
          quantity: number | null; unit: string | null;
          brand: string | null; notes: string | null; created_at: string;
        };
        Insert: {
          id?: string; service_id: string; product: string;
          quantity?: number | null; unit?: string | null;
          brand?: string | null; notes?: string | null; created_at?: string;
        };
        Update: {
          id?: string; service_id?: string; product?: string;
          quantity?: number | null; unit?: string | null;
          brand?: string | null; notes?: string | null; created_at?: string;
        };
      };
      whatsapp_log: {
        Row: {
          id: string; phone: string; direction: WaDirection | null;
          message: string | null; wa_message_id: string | null;
          status: string | null; booking_request_id: string | null; sent_at: string;
        };
        Insert: {
          id?: string; phone: string; direction?: WaDirection | null;
          message?: string | null; wa_message_id?: string | null;
          status?: string | null; booking_request_id?: string | null; sent_at?: string;
        };
        Update: {
          id?: string; phone?: string; direction?: WaDirection | null;
          message?: string | null; wa_message_id?: string | null;
          status?: string | null; booking_request_id?: string | null; sent_at?: string;
        };
      };
      payment_records: {
        Row: {
          id: string; client_id: string | null; appointment_id: string | null;
          service_id: string | null; client_name: string; service_name: string;
          amount: number; payment_method: PaymentMethod; notes: string | null; created_at: string;
        };
        Insert: {
          id?: string; client_id?: string | null; appointment_id?: string | null;
          service_id?: string | null; client_name: string; service_name: string;
          amount: number; payment_method?: PaymentMethod; notes?: string | null; created_at?: string;
        };
        Update: {
          id?: string; client_id?: string | null; appointment_id?: string | null;
          service_id?: string | null; client_name?: string; service_name?: string;
          amount?: number; payment_method?: PaymentMethod; notes?: string | null; created_at?: string;
        };
      };
      proveedores: {
        Row: {
          id: string; empresa: string; marca: string | null; representante: string | null;
          telefono: string | null; email_empresa: string | null; email_comercial: string | null;
          direccion: string | null; web: string | null; notas: string | null;
          active: boolean; catalogo_pdf_url: string | null; created_at: string;
        };
        Insert: {
          id?: string; empresa: string; marca?: string | null; representante?: string | null;
          telefono?: string | null; email_empresa?: string | null; email_comercial?: string | null;
          direccion?: string | null; web?: string | null; notas?: string | null;
          active?: boolean; catalogo_pdf_url?: string | null; created_at?: string;
        };
        Update: {
          id?: string; empresa?: string; marca?: string | null; representante?: string | null;
          telefono?: string | null; email_empresa?: string | null; email_comercial?: string | null;
          direccion?: string | null; web?: string | null; notas?: string | null;
          active?: boolean; catalogo_pdf_url?: string | null; created_at?: string;
        };
      };
      proveedor_productos: {
        Row: {
          id: string; proveedor_id: string; producto: string; referencia: string | null;
          categoria: string | null; precio: number | null; unidad: string | null;
          descripcion: string | null; activo: boolean; created_at: string;
        };
        Insert: {
          id?: string; proveedor_id: string; producto: string; referencia?: string | null;
          categoria?: string | null; precio?: number | null; unidad?: string | null;
          descripcion?: string | null; activo?: boolean; created_at?: string;
        };
        Update: {
          id?: string; proveedor_id?: string; producto?: string; referencia?: string | null;
          categoria?: string | null; precio?: number | null; unidad?: string | null;
          descripcion?: string | null; activo?: boolean; created_at?: string;
        };
      };
      pedidos: {
        Row: {
          id: string; proveedor_id: string | null; numero_pedido: string | null;
          estado: 'borrador' | 'enviado' | 'parcial' | 'completado' | 'incidencia';
          urgencia: 'normal' | 'urgente' | 'muy_urgente';
          metodo_envio: 'email' | 'whatsapp' | 'manual' | null;
          empresa_solicitante: string;
          email_destino: string | null; telefono_destino: string | null;
          notas: string | null; coste_total_estimado: number;
          enviado_at: string | null; pdf_url: string | null; created_at: string;
        };
        Insert: {
          id?: string; proveedor_id?: string | null; numero_pedido?: string | null;
          estado?: 'borrador' | 'enviado' | 'parcial' | 'completado' | 'incidencia';
          urgencia?: 'normal' | 'urgente' | 'muy_urgente';
          metodo_envio?: 'email' | 'whatsapp' | 'manual' | null;
          empresa_solicitante?: string;
          email_destino?: string | null; telefono_destino?: string | null;
          notas?: string | null; coste_total_estimado?: number;
          enviado_at?: string | null; pdf_url?: string | null; created_at?: string;
        };
        Update: {
          id?: string; proveedor_id?: string | null; numero_pedido?: string | null;
          estado?: 'borrador' | 'enviado' | 'parcial' | 'completado' | 'incidencia';
          urgencia?: 'normal' | 'urgente' | 'muy_urgente';
          metodo_envio?: 'email' | 'whatsapp' | 'manual' | null;
          empresa_solicitante?: string;
          email_destino?: string | null; telefono_destino?: string | null;
          notas?: string | null; coste_total_estimado?: number;
          enviado_at?: string | null; pdf_url?: string | null; created_at?: string;
        };
      };
      pedido_lineas: {
        Row: {
          id: string; pedido_id: string; producto_id: string | null;
          nombre_producto: string; referencia: string | null;
          precio_unitario: number | null; cantidad: number; unidad: string | null;
          subtotal: number | null; notas: string | null; created_at: string;
        };
        Insert: {
          id?: string; pedido_id: string; producto_id?: string | null;
          nombre_producto: string; referencia?: string | null;
          precio_unitario?: number | null; cantidad: number; unidad?: string | null;
          notas?: string | null; created_at?: string;
        };
        Update: {
          id?: string; pedido_id?: string; producto_id?: string | null;
          nombre_producto?: string; referencia?: string | null;
          precio_unitario?: number | null; cantidad?: number; unidad?: string | null;
          notas?: string | null; created_at?: string;
        };
      };
      inventario_productos: {
        Row: {
          id: string; nombre: string; referencia: string | null;
          categoria: CategoriaProducto | null; proveedor_id: string | null;
          unidad: string; precio_coste: number | null;
          stock_actual: number; stock_minimo: number; stock_optimo: number | null;
          activo: boolean; notas: string | null; created_at: string;
        };
        Insert: {
          id?: string; nombre: string; referencia?: string | null;
          categoria?: CategoriaProducto | null; proveedor_id?: string | null;
          unidad?: string; precio_coste?: number | null;
          stock_actual?: number; stock_minimo?: number; stock_optimo?: number | null;
          activo?: boolean; notas?: string | null; created_at?: string;
        };
        Update: {
          id?: string; nombre?: string; referencia?: string | null;
          categoria?: CategoriaProducto | null; proveedor_id?: string | null;
          unidad?: string; precio_coste?: number | null;
          stock_actual?: number; stock_minimo?: number; stock_optimo?: number | null;
          activo?: boolean; notas?: string | null; created_at?: string;
        };
      };
      inventario_movimientos: {
        Row: {
          id: string; producto_id: string; tipo: TipoMovimiento;
          cantidad: number; stock_antes: number; stock_despues: number;
          motivo: string | null; referencia_id: string | null;
          referencia_tipo: string | null; notas: string | null; created_at: string;
        };
        Insert: {
          id?: string; producto_id: string; tipo: TipoMovimiento;
          cantidad: number; stock_antes: number; stock_despues: number;
          motivo?: string | null; referencia_id?: string | null;
          referencia_tipo?: string | null; notas?: string | null; created_at?: string;
        };
        Update: {
          id?: string; producto_id?: string; tipo?: TipoMovimiento;
          cantidad?: number; stock_antes?: number; stock_despues?: number;
          motivo?: string | null; referencia_id?: string | null;
          referencia_tipo?: string | null; notas?: string | null; created_at?: string;
        };
      };
      stock_entradas: {
        Row: {
          id: string; pedido_id: string | null; pedido_linea_id: string | null;
          proveedor_id: string | null; producto_nombre: string; referencia: string | null;
          cantidad_pedida: number | null; cantidad_recibida: number | null;
          unidad: string | null; precio_unitario: number | null;
          estado: 'pendiente' | 'recibido' | 'incidencia';
          notas_incidencia: string | null; fecha_esperada: string | null;
          fecha_recibida: string | null; created_at: string;
        };
        Insert: {
          id?: string; pedido_id?: string | null; pedido_linea_id?: string | null;
          proveedor_id?: string | null; producto_nombre: string; referencia?: string | null;
          cantidad_pedida?: number | null; cantidad_recibida?: number | null;
          unidad?: string | null; precio_unitario?: number | null;
          estado?: 'pendiente' | 'recibido' | 'incidencia';
          notas_incidencia?: string | null; fecha_esperada?: string | null;
          fecha_recibida?: string | null; created_at?: string;
        };
        Update: {
          id?: string; pedido_id?: string | null; pedido_linea_id?: string | null;
          proveedor_id?: string | null; producto_nombre?: string; referencia?: string | null;
          cantidad_pedida?: number | null; cantidad_recibida?: number | null;
          unidad?: string | null; precio_unitario?: number | null;
          estado?: 'pendiente' | 'recibido' | 'incidencia';
          notas_incidencia?: string | null; fecha_esperada?: string | null;
          fecha_recibida?: string | null; created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type ClientRow          = Database['public']['Tables']['clients']['Row'];
export type ServiceRow         = Database['public']['Tables']['services']['Row'];
export type AppointmentRow     = Database['public']['Tables']['appointments']['Row'];
export type AvailabilityConfigRow = Database['public']['Tables']['availability_config']['Row'];
export type BlockedDateRow     = Database['public']['Tables']['blocked_dates']['Row'];
export type BookingRequestRow  = Database['public']['Tables']['booking_requests']['Row'];
export type ServiceMaterialRow = Database['public']['Tables']['service_materials']['Row'];
export type WhatsappLogRow     = Database['public']['Tables']['whatsapp_log']['Row'];
export type PaymentRecordRow   = Database['public']['Tables']['payment_records']['Row'];
export type ProveedorRow         = Database['public']['Tables']['proveedores']['Row'];
export type ProveedorProductoRow = Database['public']['Tables']['proveedor_productos']['Row'];
export type PedidoRow            = Database['public']['Tables']['pedidos']['Row'];
export type PedidoLineaRow       = Database['public']['Tables']['pedido_lineas']['Row'];
export type StockEntradaRow         = Database['public']['Tables']['stock_entradas']['Row'];
export type InventarioProductoRow   = Database['public']['Tables']['inventario_productos']['Row'];
export type InventarioMovimientoRow = Database['public']['Tables']['inventario_movimientos']['Row'];

// ============================================================
// Motor de Marketing Inteligente — puro, sin efectos secundarios
// ============================================================
import { PlataformaMkt, TipoContenidoMkt } from '@/integrations/supabase/types';

// ── Tipos internos ───────────────────────────────────────────

export interface ServiceData {
  id: string; name: string; price: number; category?: string | null;
}
export interface AppointmentData {
  id: string; clientId: string; serviceId: string; date: string;
  time: string; price: number; status: string;
}
export interface PaymentData {
  id: string; service_name: string; amount: number; created_at: string;
  service_id?: string | null;
}
export interface InventarioData {
  id: string; nombre: string; stock_actual: number;
  stock_minimo: number; stock_optimo: number | null; precio_coste: number | null;
  categoria?: string | null;
}
export interface EvidenciaData {
  id: string; tipo: string; url: string;
  tratamiento: string | null; uso_marketing: boolean;
  client_id: string; appointment_id: string | null; service_id: string | null;
}
export interface SeguimientoData {
  satisfaccion: number | null;
}

export interface Recomendacion {
  prioridad: 'alta' | 'media' | 'baja';
  tipo: 'promover_servicio' | 'liquidar_stock' | 'fidelizacion' | 'temporada' | 'top_servicio';
  servicio?: ServiceData;
  producto?: InventarioData;
  motivo: string;
  sugerencia: string;
}

export interface AnalisisNegocio {
  periodo: { desde: string; hasta: string; dias: number };
  serviciosMasDemandados:   { servicio: ServiceData; citas: number; ingresos: number }[];
  serviciosMenosDemandados: { servicio: ServiceData; citas: number; ingresos: number }[];
  servicioSinCitas:         ServiceData[];
  ingresoTotal:             number;
  ticketMedio:              number;
  diaMasRentable:           string;
  productosExceso:          InventarioData[];
  fotosMarketing:           EvidenciaData[];
  satisfaccionMedia:        number | null;
  totalValoraciones:        number;
  recomendaciones:          Recomendacion[];
}

export interface PublicacionDraft {
  plataforma:        PlataformaMkt;
  fecha:             string;           // YYYY-MM-DD
  hora:              string;           // HH:MM
  tipo_contenido:    TipoContenidoMkt;
  titulo:            string;
  texto:             string;
  hashtags:          string;
  evidencia_id?:     string;
  servicio_id?:      string;
  oferta_desc?:      string;
}

// ── Horarios óptimos ─────────────────────────────────────────

export const HORARIOS_OPTIMOS: Record<PlataformaMkt, string[]> = {
  instagram:  ['11:00', '17:00', '20:00'],
  facebook:   ['10:00', '14:00', '19:00'],
  whatsapp:   ['10:00', '18:00'],
  tiktok:     ['11:00', '17:00', '21:00'],
  x:          ['09:00', '13:00', '18:00'],
  web:        ['10:00'],
  todos:      ['11:00', '18:00'],
};

const DIAS_SEMANA = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

// ── Plantillas de texto ──────────────────────────────────────

export const PLANTILLAS = {
  antes_despues: (servicio: string) => ({
    titulo:   `Transformación real — ${servicio}`,
    texto:    `¿Lista para el cambio? ✨ Así quedó el trabajo de nuestro equipo en ${servicio}.\n\nResultados reales, sin filtros. En AS Belleza y Bienestar cada detalle importa. 💅\n\n📍 Pide tu cita en el enlace de la bio.`,
    hashtags: `#AsBellezaBienestar #${servicio.replace(/\s+/g,'')} #AntesDespues #Manicura #Belleza #Estilista`,
  }),
  oferta_servicio: (servicio: string, descuento: number, precio: number) => ({
    titulo:   `OFERTA — ${servicio} ${descuento}% dto.`,
    texto:    `🌟 Esta semana oferta especial en ${servicio}.\n\n✂️ Precio especial: ${Math.round(precio * (1 - descuento / 100))}€ (antes ${precio}€)\n\nPlazas limitadas. Reserva ahora y asegura tu cita. 👇`,
    hashtags: `#Oferta #${servicio.replace(/\s+/g,'')} #AsBelleza #Descuento #Belleza`,
  }),
  servicio_estrella: (servicio: string, valoracion: number) => ({
    titulo:   `Nuestro servicio más valorado: ${servicio}`,
    texto:    `⭐ ${valoracion.toFixed(1)} de media — nuestras clientas hablan por nosotras.\n\n${servicio} es uno de los servicios favoritos del salón. ¿Ya lo has probado?\n\n💬 "Lo mejor es que dura semanas y queda perfecto" — clienta real.\n\nReserva tu cita en el enlace. ✨`,
    hashtags: `#${servicio.replace(/\s+/g,'')} #Valoraciones #Recomendado #Salon #Belleza`,
  }),
  fidelizacion: () => ({
    titulo:   'Programa de Fidelidad — AS Belleza',
    texto:    `¿Sabías que tienes puntos acumulados con nosotras? 🥇\n\nCada visita suma puntos que se convierten en descuentos y ventajas exclusivas.\n\nNivel Bronze → Silver → Gold → Platinum 💎\n\nPregunta en tu próxima visita cuántos puntos tienes. ¡Te esperamos!`,
    hashtags: `#Fidelidad #Clientas #AsBelleza #Premium #Salon`,
  }),
  presentacion: () => ({
    titulo:   'El equipo de AS Belleza',
    texto:    `Detrás de cada resultado hay profesionales apasionadas por su trabajo. 💪\n\nEn AS Belleza y Bienestar nos formamos continuamente para ofrecerte las últimas técnicas.\n\nTu belleza es nuestra prioridad. ✨`,
    hashtags: `#Equipo #AsBelleza #Profesionales #Belleza #Salon`,
  }),
  resultado_semana: () => ({
    titulo:   'Trabajos de esta semana ✨',
    texto:    `¡Otra semana llena de resultados increíbles! 💅\n\nNuestras clientas salen siempre con una sonrisa y un look impecable.\n\n¿La próxima eres tú? Reserva tu cita ahora. 📍 Enlace en la bio.`,
    hashtags: `#AsBelleza #ResultadosReales #Manicura #NailArt #Belleza #Salon`,
  }),
};

// ── Motor de análisis ────────────────────────────────────────

export function analizarNegocio(params: {
  appointments:  AppointmentData[];
  payments:      PaymentData[];
  services:      ServiceData[];
  inventario:    InventarioData[];
  evidencias:    EvidenciaData[];
  seguimientos:  SeguimientoData[];
  periodoDias:   number;
}): AnalisisNegocio {
  const { appointments, payments, services, inventario, evidencias, seguimientos, periodoDias } = params;

  const ahora = new Date();
  const desde = new Date(ahora.getTime() - periodoDias * 86400000);
  const desdeStr = desde.toISOString().slice(0, 10);
  const hastaStr = ahora.toISOString().slice(0, 10);

  // Filtrar por periodo
  const aptsEnPeriodo = appointments.filter(a =>
    a.status === 'completed' && a.date >= desdeStr && a.date <= hastaStr
  );
  const paymentsEnPeriodo = payments.filter(p =>
    p.created_at.slice(0, 10) >= desdeStr
  );

  // Citas por servicio
  const citasPorServicio: Record<string, number> = {};
  aptsEnPeriodo.forEach(a => {
    citasPorServicio[a.serviceId] = (citasPorServicio[a.serviceId] || 0) + 1;
  });

  // Ingresos por servicio
  const ingresosPorServicio: Record<string, number> = {};
  aptsEnPeriodo.forEach(a => {
    ingresosPorServicio[a.serviceId] = (ingresosPorServicio[a.serviceId] || 0) + a.price;
  });

  // Ranking de servicios
  const ranking = services.map(s => ({
    servicio: s,
    citas:    citasPorServicio[s.id] || 0,
    ingresos: ingresosPorServicio[s.id] || 0,
  })).sort((a, b) => b.citas - a.citas);

  const serviciosMasDemandados   = ranking.filter(r => r.citas > 0).slice(0, 3);
  const serviciosMenosDemandados = [...ranking].reverse().filter(r => r.citas < (ranking[0]?.citas || 1)).slice(0, 3);
  const servicioSinCitas         = services.filter(s => !citasPorServicio[s.id]);

  // Ingresos totales
  const ingresoTotal = paymentsEnPeriodo.reduce((s, p) => s + p.amount, 0);
  const ticketMedio  = paymentsEnPeriodo.length ? ingresoTotal / paymentsEnPeriodo.length : 0;

  // Día más rentable
  const ingresoPorDia: Record<number, number> = {};
  aptsEnPeriodo.forEach(a => {
    const dow = new Date(a.date + 'T12:00').getDay();
    ingresoPorDia[dow] = (ingresoPorDia[dow] || 0) + a.price;
  });
  const mejorDow = Object.entries(ingresoPorDia).sort(([,a],[,b]) => b - a)[0];
  const diaMasRentable = mejorDow ? DIAS_SEMANA[parseInt(mejorDow[0])] : 'Viernes';

  // Productos con exceso
  const productosExceso = inventario.filter(p =>
    p.stock_optimo != null && p.stock_actual > p.stock_optimo * 1.5
  );

  // Fotos para marketing
  const fotosMarketing = evidencias.filter(e => e.uso_marketing);

  // Satisfacción media
  const valoraciones = seguimientos.map(s => s.satisfaccion).filter((v): v is number => v !== null);
  const satisfaccionMedia = valoraciones.length ? valoraciones.reduce((a, b) => a + b, 0) / valoraciones.length : null;

  const recomendaciones = generarRecomendaciones({
    serviciosMenosDemandados,
    serviciosMasDemandados,
    productosExceso,
    satisfaccionMedia,
    fotosMarketing: fotosMarketing.length,
  });

  return {
    periodo: { desde: desdeStr, hasta: hastaStr, dias: periodoDias },
    serviciosMasDemandados,
    serviciosMenosDemandados,
    servicioSinCitas,
    ingresoTotal,
    ticketMedio,
    diaMasRentable,
    productosExceso,
    fotosMarketing,
    satisfaccionMedia,
    totalValoraciones: valoraciones.length,
    recomendaciones,
  };
}

// ── Generador de recomendaciones ─────────────────────────────

function generarRecomendaciones(params: {
  serviciosMenosDemandados: { servicio: ServiceData; citas: number }[];
  serviciosMasDemandados:   { servicio: ServiceData; citas: number; ingresos: number }[];
  productosExceso:          InventarioData[];
  satisfaccionMedia:        number | null;
  fotosMarketing:           number;
}): Recomendacion[] {
  const recomendaciones: Recomendacion[] = [];

  // Servicios poco demandados → promover
  params.serviciosMenosDemandados.slice(0, 2).forEach(({ servicio, citas }) => {
    recomendaciones.push({
      prioridad: 'alta',
      tipo: 'promover_servicio',
      servicio,
      motivo: `${servicio.name} solo tuvo ${citas} cita${citas !== 1 ? 's' : ''} en el periodo`,
      sugerencia: `Crear oferta con 15–20% descuento y publicar en Instagram + WhatsApp`,
    });
  });

  // Productos en exceso → liquidar
  params.productosExceso.slice(0, 2).forEach(producto => {
    recomendaciones.push({
      prioridad: 'alta',
      tipo: 'liquidar_stock',
      producto,
      motivo: `${producto.nombre} tiene stock excedido (${producto.stock_actual} ud, óptimo: ${producto.stock_optimo})`,
      sugerencia: `Promover servicios que usen este producto con precio especial`,
    });
  });

  // Servicio estrella → amplificar
  if (params.serviciosMasDemandados[0]) {
    const top = params.serviciosMasDemandados[0];
    recomendaciones.push({
      prioridad: 'media',
      tipo: 'top_servicio',
      servicio: top.servicio,
      motivo: `${top.servicio.name} es el servicio más demandado (${top.citas} citas, ${top.ingresos.toFixed(0)}€)`,
      sugerencia: `Publicar foto antes/después + destacar como servicio estrella del salón`,
    });
  }

  // Fidelización si hay fotos disponibles
  if (params.fotosMarketing > 0) {
    recomendaciones.push({
      prioridad: 'media',
      tipo: 'fidelizacion',
      motivo: `Tienes ${params.fotosMarketing} foto${params.fotosMarketing !== 1 ? 's' : ''} autorizadas para marketing`,
      sugerencia: `Publicar galería de resultados reales con antes/después para atraer nuevas clientas`,
    });
  }

  // Satisfacción alta → testimonial
  if (params.satisfaccionMedia && params.satisfaccionMedia >= 4) {
    recomendaciones.push({
      prioridad: 'baja',
      tipo: 'temporada',
      motivo: `Valoración media del salón: ${params.satisfaccionMedia.toFixed(1)}/5 ⭐`,
      sugerencia: `Publicar un post de agradecimiento con la valoración real del salón`,
    });
  }

  return recomendaciones;
}

// ── Generador de plan editorial ──────────────────────────────

export function generarPlanEditorial(params: {
  analisis:             AnalisisNegocio;
  recomendaciones:      Recomendacion[];
  fechaInicio:          Date;
  diasPlan:             number;
  plataformas:          PlataformaMkt[];
  evidenciasDisponibles: EvidenciaData[];
}): PublicacionDraft[] {
  const { analisis, recomendaciones, fechaInicio, diasPlan, plataformas, evidenciasDisponibles } = params;
  const publicaciones: PublicacionDraft[] = [];

  // Encontrar foto de marketing disponible por servicio
  const fotoParaServicio = (servicioId?: string): string | undefined => {
    const foto = evidenciasDisponibles.find(e =>
      e.tipo === 'despues' && (!servicioId || e.service_id === servicioId)
    );
    return foto?.id;
  };

  // Distribuir publicaciones por día y plataforma
  for (let dia = 0; dia < diasPlan; dia++) {
    const fecha = new Date(fechaInicio.getTime() + dia * 86400000);
    const fechaStr = fecha.toISOString().slice(0, 10);
    const dow = fecha.getDay(); // 0=dom, 1=lun...

    plataformas.forEach(plataforma => {
      if (plataforma === 'todos') return;

      const horas = HORARIOS_OPTIMOS[plataforma];

      // Instagram: publicar casi todos los días
      if (plataforma === 'instagram') {
        const horaIdx = dia % horas.length;
        const recom = recomendaciones[dia % recomendaciones.length];

        if (recom?.tipo === 'promover_servicio' && recom.servicio) {
          const p = PLANTILLAS.oferta_servicio(recom.servicio.name, 15, recom.servicio.price);
          publicaciones.push({
            plataforma, fecha: fechaStr, hora: horas[horaIdx],
            tipo_contenido: 'oferta', ...p,
            evidencia_id: fotoParaServicio(recom.servicio.id),
            servicio_id: recom.servicio.id,
            oferta_desc: `${recom.servicio.name} 15% descuento esta semana`,
          });
        } else if (analisis.fotosMarketing.length > 0) {
          const ev = analisis.fotosMarketing[dia % analisis.fotosMarketing.length];
          const svc = analisis.serviciosMasDemandados[0]?.servicio;
          const p = PLANTILLAS.antes_despues(ev.tratamiento ?? svc?.name ?? 'tratamiento');
          publicaciones.push({
            plataforma, fecha: fechaStr, hora: horas[horaIdx],
            tipo_contenido: 'foto', ...p, evidencia_id: ev.id,
            servicio_id: svc?.id,
          });
        } else {
          const p = PLANTILLAS.resultado_semana();
          publicaciones.push({
            plataforma, fecha: fechaStr, hora: horas[horaIdx],
            tipo_contenido: 'foto', ...p,
          });
        }
      }

      // Facebook: cada 2 días
      if (plataforma === 'facebook' && dia % 2 === 0) {
        const svc = analisis.serviciosMenosDemandados[0]?.servicio ?? analisis.serviciosMasDemandados[0]?.servicio;
        const p = svc
          ? PLANTILLAS.oferta_servicio(svc.name, 10, svc.price)
          : PLANTILLAS.presentacion();
        publicaciones.push({
          plataforma, fecha: fechaStr, hora: horas[0],
          tipo_contenido: 'foto', ...p,
          servicio_id: svc?.id,
          evidencia_id: svc ? fotoParaServicio(svc.id) : undefined,
        });
      }

      // WhatsApp: una vez a la semana (día 0 y 6)
      if (plataforma === 'whatsapp' && (dia === 0 || dia === 6)) {
        const svc = analisis.serviciosMenosDemandados[0]?.servicio;
        const p = svc
          ? PLANTILLAS.oferta_servicio(svc.name, 20, svc.price)
          : PLANTILLAS.fidelizacion();
        publicaciones.push({
          plataforma, fecha: fechaStr, hora: horas[1],
          tipo_contenido: 'oferta', ...p, servicio_id: svc?.id,
        });
      }

      // TikTok: 2 veces/semana (martes y jueves)
      if (plataforma === 'tiktok' && (dow === 2 || dow === 4)) {
        const svc = analisis.serviciosMasDemandados[0]?.servicio;
        const p = svc
          ? PLANTILLAS.antes_despues(svc.name)
          : PLANTILLAS.resultado_semana();
        publicaciones.push({
          plataforma, fecha: fechaStr, hora: horas[1],
          tipo_contenido: 'video', ...p, servicio_id: svc?.id,
          evidencia_id: svc ? fotoParaServicio(svc.id) : undefined,
        });
      }

      // X: 2 veces/semana (lunes y miércoles)
      if (plataforma === 'x' && (dow === 1 || dow === 3)) {
        const svc = analisis.serviciosMasDemandados[0]?.servicio;
        const p = svc
          ? PLANTILLAS.servicio_estrella(svc.name, analisis.satisfaccionMedia ?? 4.5)
          : PLANTILLAS.presentacion();
        publicaciones.push({
          plataforma, fecha: fechaStr, hora: horas[0],
          tipo_contenido: 'texto', ...p, servicio_id: svc?.id,
        });
      }

      // Web: una vez por semana (viernes)
      if (plataforma === 'web' && dow === 5) {
        const p = PLANTILLAS.resultado_semana();
        publicaciones.push({
          plataforma, fecha: fechaStr, hora: horas[0],
          tipo_contenido: 'foto', ...p,
        });
      }
    });
  }

  // Ordenar por fecha + hora
  return publicaciones.sort((a, b) =>
    (a.fecha + a.hora).localeCompare(b.fecha + b.hora)
  );
}

// ── Programador de notificaciones ────────────────────────────

export interface NotificacionDraft {
  tipo:       TipoNotificacionMkt;
  fecha_envio: string; // ISO string
}

import { TipoNotificacionMkt } from '@/integrations/supabase/types';

export function programarNotificaciones(
  fechaPublicacion: string,
  horaPublicacion: string,
): NotificacionDraft[] {
  const momentoISO = new Date(`${fechaPublicacion}T${horaPublicacion}:00`);

  const diaAntes   = new Date(momentoISO.getTime() - 24 * 3600000);
  const horaAntes  = new Date(momentoISO.getTime() -      3600000);
  const recordatorio = new Date(momentoISO.getTime() + 30 * 60000);

  return [
    { tipo: 'dia_antes',          fecha_envio: diaAntes.toISOString()    },
    { tipo: 'hora_antes',         fecha_envio: horaAntes.toISOString()   },
    { tipo: 'momento',            fecha_envio: momentoISO.toISOString()  },
    { tipo: 'recordatorio_30min', fecha_envio: recordatorio.toISOString() },
  ];
}

// ── Texto de notificación ────────────────────────────────────

export function construirTextoNotificacion(
  tipo: TipoNotificacionMkt,
  plataforma: PlataformaMkt,
  titulo: string,
  hora: string,
): string {
  const plat = plataforma.charAt(0).toUpperCase() + plataforma.slice(1);
  switch (tipo) {
    case 'dia_antes':
      return `Mañana a las ${hora} — Publicar en ${plat}: "${titulo}". Revisa el texto y la foto.`;
    case 'hora_antes':
      return `En 1 hora — ${plat} a las ${hora}: "${titulo}". Prepara el contenido.`;
    case 'momento':
      return `🔔 AHORA — Publica en ${plat}: "${titulo}"`;
    case 'recordatorio_30min':
      return `¿Ya publicaste en ${plat}? Confirma la publicación: "${titulo}"`;
  }
}

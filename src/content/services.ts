/**
 * Respaldo de servicios si Supabase no responde. Precio 0 = "Consultar" (TODO_REAL).
 * Textos orientativos, sin promesas de resultado (deontologia).
 */
export type ServiceItem = {
  slug: string;
  name: string;
  short: string;
  description: string;
  durationMin: number;
  priceCents: number; // 0 = TODO_REAL
  modality: 'in_person' | 'online' | 'both';
  forWhom: string[];
  process: string[];
};

export const fallbackServices: ServiceItem[] = [
  {
    slug: 'primera-consulta',
    name: 'Primera consulta',
    short: 'Un primer encuentro para conocernos y ver si encajamos, sin compromiso.',
    description:
      'Es una sesión de valoración. Me cuentas lo que te trae, yo te explico cómo trabajo y decidimos juntas si seguimos y con qué ritmo. No hace falta llegar con las ideas claras.',
    durationMin: 60,
    priceCents: 0,
    modality: 'both',
    forWhom: ['Personas que nunca han ido a terapia', 'Quien duda si es el momento', 'Quien busca una segunda opinión'],
    process: ['Hablamos de lo que te preocupa', 'Te explico el encuadre y la confidencialidad', 'Decidimos los siguientes pasos, sin presión'],
  },
  {
    slug: 'terapia-individual',
    name: 'Terapia individual',
    short: 'Sesiones regulares para trabajar con calma lo que te pesa.',
    description:
      'Acompañamiento psicológico para adultos en momentos de ansiedad, tristeza, cambios vitales, duelo o dificultades en las relaciones. Cada proceso se adapta a ti y a tu ritmo.',
    durationMin: 50,
    priceCents: 0,
    modality: 'both',
    forWhom: ['Ansiedad y estrés sostenido', 'Duelo y cambios vitales', 'Autoestima y relaciones'],
    process: ['Definimos objetivos realistas', 'Sesiones semanales o quincenales', 'Revisamos juntas cómo vas'],
  },
  {
    slug: 'terapia-online',
    name: 'Terapia online',
    short: 'La misma consulta, desde tu casa, por videollamada.',
    description:
      'Sesiones por videollamada con la misma confidencialidad y el mismo encuadre que en persona. Útil si vives lejos, tienes poco tiempo o te sientes más cómoda en tu entorno.',
    durationMin: 50,
    priceCents: 0,
    modality: 'online',
    forWhom: ['Quien vive lejos o viaja', 'Agendas con poco margen', 'Quien prefiere su propio espacio'],
    process: ['Te envío el enlace seguro por correo', 'Necesitas un lugar tranquilo y conexión estable', 'Mismo formato y duración que presencial'],
  },
  {
    slug: 'terapia-de-pareja',
    name: 'Orientación de pareja',
    short: 'Un espacio para entenderos mejor y comunicaros sin herirse. (TODO_REAL: confirmar si se ofrece.)',
    description:
      'Sesiones conjuntas para mejorar la comunicación y acordar cómo seguir. TODO_REAL: la profesional confirma si ofrece este servicio, su duración y su tarifa.',
    durationMin: 75,
    priceCents: 0,
    modality: 'both',
    forWhom: ['Parejas con conflictos repetidos', 'Decisiones importantes en común', 'Dificultades de comunicación'],
    process: ['Sesión inicial conjunta', 'Acuerdos sobre qué trabajar', 'Seguimiento periódico'],
  },
];

export const modalityLabel: Record<ServiceItem['modality'], string> = {
  in_person: 'Presencial',
  online: 'Online',
  both: 'Presencial u online',
};

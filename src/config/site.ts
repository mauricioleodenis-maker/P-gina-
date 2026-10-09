/**
 * Datos de marca y contacto. Todo lo marcado TODO_REAL lo aporta la profesional.
 * No poner aquí secretos.
 */
export const site = {
  name: 'Caromafla',
  domain: 'caromafla.online',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://caromafla.online',
  tagline: 'Un espacio tranquilo para hablar de lo que pesa',
  description: 'Consulta de psicología sanitaria en un espacio cálido y sin prisas. TODO_REAL: nombre.',
  professional: {
    name: 'TODO_REAL: nombre de la psicóloga',
    collegiateNumber: 'TODO_REAL: nº de colegiada',
    college: 'TODO_REAL: Colegio Oficial de la Psicología',
  },
  contact: {
    email: 'TODO_REAL@caromafla.online',
    phone: 'TODO_REAL: teléfono',
    whatsapp: '' as string, // TODO_REAL: número internacional sin +, p. ej. 34600000000. Vacío = botón oculto.
    address: 'TODO_REAL: dirección y ciudad',
    mapUrl: '' as string, // TODO_REAL: enlace OSM
  },
  crisis: {
    emergency: '112',
    suicidePrevention: '024',
    text: 'Si estás en una situación de crisis o piensas en hacerte daño, llama al 112 o al 024 (atención a la conducta suicida, 24 h).',
  },
  bookingHref: '/reservar',
  nav: [
    { href: '/sobre-mi', label: 'Sobre mí' },
    { href: '/servicios', label: 'Servicios' },
    { href: '/tarifas', label: 'Tarifas' },
    { href: '/contacto', label: 'Contacto' },
  ],
  legalNav: [
    { href: '/aviso-legal', label: 'Aviso legal' },
    { href: '/privacidad', label: 'Privacidad' },
    { href: '/cookies', label: 'Cookies' },
    { href: '/consentimiento-informado', label: 'Consentimiento informado' },
  ],
  blogEnabled: process.env.NEXT_PUBLIC_BLOG_ENABLED === 'true',
} as const;

export type Site = typeof site;

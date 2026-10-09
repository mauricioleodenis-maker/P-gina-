import type { LegalDoc } from './types';

export const cookies: LegalDoc = {
  slug: 'cookies',
  title: 'Política de cookies',
  lead: 'Este sitio solo usa tecnologías estrictamente necesarias. No hay publicidad ni seguimiento.',
  version: '2026-10-draft',
  updated: '2026-10-09',
  sections: [
    {
      id: 'que-son',
      heading: 'Qué son las cookies',
      paragraphs: ['Son pequeños archivos que un sitio guarda en tu dispositivo para recordar información. Algunas son imprescindibles para que el sitio funcione.'],
    },
    {
      id: 'uso',
      heading: 'Qué usamos en este sitio',
      paragraphs: [
        'La web pública no instala cookies analíticas, publicitarias ni de redes sociales. Las tipografías se sirven desde el propio sitio y no se cargan recursos de Google ni de Meta.',
        'Las cookies técnicas, exentas de consentimiento (art. 22.2 LSSI), son:',
      ],
      list: [
        'Sesión de la zona privada (solo profesional autenticada): cookies de autenticación, httpOnly y Secure, mientras dura la sesión.',
        'Verificación antiabuso (Cloudflare Turnstile) en formularios: puede almacenar un identificador técnico solo para distinguir personas de robots. TODO_REAL: verificar su declaración actual.',
        'Preferencias locales en tu navegador (por ejemplo, tu elección sobre este aviso, si algún día se activase analítica).',
      ],
    },
    {
      id: 'mapa',
      heading: 'Mapas y contenido de terceros',
      paragraphs: ['Si se muestra un mapa, se usa OpenStreetMap mediante enlace externo. No se incrusta contenido de terceros que rastree sin tu consentimiento.'],
    },
    {
      id: 'analitica',
      heading: 'Analítica',
      paragraphs: [
        'Por defecto no hay analítica. Si en el futuro se activa una medición, será sin cookies ni dirección IP identificable; si requiriese cookies no técnicas, se mostrará un aviso con "Aceptar" y "Rechazar" al mismo nivel y podrás cambiar de opinión cuando quieras.',
      ],
    },
    {
      id: 'gestion',
      heading: 'Cómo gestionarlas',
      paragraphs: ['Puedes bloquear o borrar cookies desde la configuración de tu navegador. Hacerlo no afecta a la navegación de la web pública.'],
    },
  ],
};

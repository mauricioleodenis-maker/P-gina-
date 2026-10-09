import type { LegalDoc } from './types';

/** Modelo orientativo de consentimiento informado. El texto definitivo lo fija la profesional con su colegio (COP). */
export const consentimientoInformado: LegalDoc = {
  slug: 'consentimiento-informado',
  title: 'Consentimiento informado',
  lead: 'Modelo de información que recibirás antes de empezar. Léelo con calma; puedes preguntar cualquier duda.',
  version: '2026-10-draft',
  updated: '2026-10-09',
  sections: [
    {
      id: 'servicio',
      heading: 'En qué consiste la atención',
      paragraphs: [
        'La psicoterapia es un proceso de colaboración en el que trabajamos sobre aquello que te preocupa. No puedo garantizar resultados concretos; sí me comprometo a emplear los medios profesionales adecuados. TODO_REAL: enfoque terapéutico y duración orientativa.',
        'Puedes interrumpir el proceso cuando lo decidas. Te ruego que me lo comuniques para poder cerrarlo con cuidado.',
      ],
    },
    {
      id: 'encuadre',
      heading: 'Encuadre: sesiones, honorarios y cancelaciones',
      list: [
        'Duración de la sesión: TODO_REAL (por defecto 50-60 minutos).',
        'Honorarios: TODO_REAL por sesión, pago en consulta o por transferencia.',
        'Cancelaciones o cambios: con al menos 24 horas de antelación sin coste. Las faltas sin aviso pueden facturarse: TODO_REAL.',
        'Modalidad: presencial y/o online (TODO_REAL). En sesiones online, usa un lugar privado y una conexión segura.',
      ],
    },
    {
      id: 'confidencialidad',
      heading: 'Confidencialidad y sus límites',
      paragraphs: ['Todo lo que compartas está protegido por el secreto profesional. Solo podría romperse en los supuestos que marca la ley:'],
      list: [
        'Riesgo grave e inminente para tu vida o integridad, o la de terceras personas.',
        'Sospecha fundada de maltrato o abuso a menores o personas en situación de vulnerabilidad.',
        'Requerimiento de un juez o tribunal.',
        'Con tu autorización expresa y por escrito (por ejemplo, para coordinarme con otro profesional).',
      ],
    },
    {
      id: 'registro',
      heading: 'Registro y grabaciones',
      paragraphs: [
        'Elaboro notas de cada sesión (historia clínica), conservadas con medidas de seguridad y cifrado durante el plazo legal. Las sesiones no se graban ni en audio ni en vídeo, y te pido que tú tampoco las grabes sin acordarlo antes.',
      ],
    },
    {
      id: 'datos',
      heading: 'Protección de datos',
      paragraphs: ['El tratamiento de tus datos se describe en la política de privacidad. Tienes derecho de acceso, rectificación y los demás derechos allí indicados.'],
    },
    {
      id: 'menores',
      heading: 'Menores de edad',
      paragraphs: ['Para menores se requiere la firma de quienes ejerzan la patria potestad o tutela, y se atenderá la opinión del menor según su madurez. TODO_REAL: criterios.'],
    },
    {
      id: 'urgencias',
      heading: 'Urgencias',
      paragraphs: ['Esta consulta no es un servicio de urgencias. Ante una crisis llama al 112 o al 024 (24 horas).'],
    },
    {
      id: 'aceptacion',
      heading: 'Aceptación',
      paragraphs: [
        'Antes de la primera sesión se te pedirá aceptar este documento, con tu nombre y fecha. Se guarda una copia firmada en un espacio privado y puedes pedirla cuando quieras. Puedes revocar tu consentimiento en cualquier momento.',
      ],
    },
  ],
};

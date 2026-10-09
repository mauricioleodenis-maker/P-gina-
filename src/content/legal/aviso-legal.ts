import type { LegalDoc } from './types';

export const avisoLegal: LegalDoc = {
  slug: 'aviso-legal',
  title: 'Aviso legal',
  lead: 'Información general del sitio web conforme a la Ley 34/2002 (LSSI-CE).',
  version: '2026-10-draft',
  updated: '2026-10-09',
  sections: [
    {
      id: 'titular',
      heading: 'Titular del sitio',
      list: [
        'Titular: TODO_REAL: nombre y apellidos de la psicóloga',
        'NIF: TODO_REAL',
        'Domicilio profesional: TODO_REAL: dirección y ciudad',
        'Correo electrónico: TODO_REAL@caromafla.online',
        'Teléfono: TODO_REAL',
        'Nº de colegiada: TODO_REAL, Colegio Oficial de la Psicología de TODO_REAL',
        'Titulación: TODO_REAL (profesional sanitaria, Psicología General Sanitaria si procede)',
      ],
      paragraphs: ['"Caromafla" es el nombre provisional de la consulta (TODO_REAL: confirmar nombre comercial definitivo).'],
    },
    {
      id: 'objeto',
      heading: 'Objeto',
      paragraphs: [
        'Este sitio ofrece información sobre los servicios de psicología de la titular y permite solicitar una cita o enviar una consulta. La información publicada es orientativa y no sustituye a una valoración profesional individual.',
        'La web no es un servicio de urgencias. Si estás en una situación de crisis, llama al 112 o al 024 (atención a la conducta suicida, 24 horas).',
      ],
    },
    {
      id: 'condiciones',
      heading: 'Condiciones de uso',
      paragraphs: [
        'El acceso es gratuito. La persona usuaria se compromete a hacer un uso lícito del sitio y a no emplearlo para fines contrarios a la ley, a la buena fe o al orden público, ni para introducir contenidos dañinos.',
        'Te pedimos que no incluyas datos clínicos ni información sensible en los formularios públicos: están pensados solo para contacto y solicitud de cita.',
      ],
    },
    {
      id: 'propiedad',
      heading: 'Propiedad intelectual',
      paragraphs: [
        'Los textos, imágenes, diseño y código del sitio pertenecen a su titular o se usan con licencia. Queda prohibida su reproducción o distribución sin autorización, salvo citas con indicación de la fuente.',
      ],
    },
    {
      id: 'responsabilidad',
      heading: 'Responsabilidad y enlaces',
      paragraphs: [
        'La titular no garantiza la disponibilidad continua del sitio ni se responsabiliza de interrupciones puntuales. Los enlaces a sitios de terceros se ofrecen como referencia; no controlamos su contenido ni sus políticas.',
      ],
    },
    {
      id: 'deontologia',
      heading: 'Deontología y secreto profesional',
      paragraphs: [
        'La actividad se rige por el Código Deontológico del Psicólogo y la normativa sanitaria aplicable, incluida la Ley 41/2002 de autonomía del paciente. Se garantiza el secreto profesional dentro de los límites legales, que se detallan en el consentimiento informado.',
      ],
    },
    {
      id: 'ley',
      heading: 'Legislación y jurisdicción',
      paragraphs: [
        'Este aviso se rige por la legislación española. Para cualquier controversia, y salvo que la normativa de consumo disponga otro fuero, las partes se someten a los juzgados y tribunales del domicilio de la persona consumidora. TODO_REAL: confirmar con asesor.',
      ],
    },
  ],
};

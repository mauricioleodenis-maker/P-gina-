import type { LegalDoc } from './types';

/** Politica de privacidad por capas (art. 13 RGPD). Capa 1 = resumen; capa 2 = secciones. */
export const privacidad: LegalDoc = {
  slug: 'privacidad',
  title: 'Política de privacidad',
  lead: 'Cómo trato tus datos personales y qué derechos tienes. Resumen primero, detalle después.',
  version: '2026-10-draft',
  updated: '2026-10-09',
  sections: [
    {
      id: 'resumen',
      heading: 'Resumen (primera capa)',
      list: [
        'Responsable: TODO_REAL: nombre y NIF de la psicóloga, contacto en privacidad@caromafla.online (TODO_REAL).',
        'Finalidad: atender tu solicitud de cita o consulta y, si iniciamos terapia, prestarte asistencia psicológica y gestionar la facturación.',
        'Base legal: tu consentimiento para contestar a formularios, la ejecución del contrato asistencial y, para datos de salud, el art. 9.2.h RGPD (asistencia sanitaria bajo secreto profesional).',
        'Destinatarios: solo proveedores técnicos que actúan por mi cuenta (encargados del tratamiento). No vendo ni cedo datos.',
        'Derechos: acceso, rectificación, supresión, oposición, limitación y portabilidad, y reclamar ante la AEPD.',
      ],
    },
    {
      id: 'responsable',
      heading: 'Responsable del tratamiento',
      paragraphs: [
        'TODO_REAL: nombre y apellidos, NIF, domicilio profesional y correo de contacto. Delegado de protección de datos: TODO_REAL (no obligatorio salvo dictamen del asesor).',
      ],
    },
    {
      id: 'datos',
      heading: 'Qué datos trato y para qué',
      list: [
        'Formulario de contacto: nombre, correo, teléfono (opcional) y mensaje. Finalidad: responderte. Conservación: hasta 12 meses sin continuidad.',
        'Solicitud de cita: nombre, correo, teléfono, servicio y horario elegido, y un motivo genérico opcional y corto. Finalidad: gestionar la cita. Conservación: 12 meses si no hay continuidad.',
        'Historia clínica (solo si eres paciente): datos identificativos, notas de sesión y consentimientos. Son datos de salud (categoría especial). Finalidad: asistencia sanitaria. Conservación: mínimo 5 años desde el alta (Ley 41/2002); TODO_REAL: plazo autonómico.',
        'Facturación: datos fiscales e importes. Conservación: 6 años (obligación mercantil y tributaria).',
        'Recordatorios por correo: solo si los aceptas expresamente y puedes retirarlos en cualquier momento.',
        'Registros de seguridad: dirección IP en forma de huella irreversible (hash) para prevenir abusos. Conservación: 2 años como máximo.',
      ],
      paragraphs: ['No tomo decisiones automatizadas ni elaboro perfiles. No uses los formularios públicos para enviar información clínica.'],
    },
    {
      id: 'legitimacion',
      heading: 'Base legal',
      list: [
        'Art. 6.1.a RGPD: consentimiento (formulario de contacto, recordatorios).',
        'Art. 6.1.b RGPD: medidas precontractuales y ejecución del contrato asistencial.',
        'Art. 6.1.c RGPD: obligaciones legales (facturación, historia clínica).',
        'Art. 9.2.h RGPD: tratamiento de datos de salud para asistencia sanitaria por profesional sujeto a secreto.',
        'Art. 9.2.a RGPD: consentimiento explícito para finalidades accesorias.',
      ],
    },
    {
      id: 'destinatarios',
      heading: 'Destinatarios y encargados del tratamiento',
      paragraphs: [
        'Para operar el sitio y la consulta utilizo proveedores con contrato de encargado (art. 28 RGPD). TODO_REAL: confirmar y firmar los acuerdos antes del lanzamiento.',
      ],
      list: [
        'Supabase (base de datos y autenticación), región UE.',
        'Vercel (alojamiento web), región Fráncfort (fra1).',
        'Resend (envío de correos transaccionales). TODO_REAL: confirmar proveedor.',
        'Upstash (limitación de peticiones, solo huella de IP).',
        'Cloudflare Turnstile (verificación antiabuso en formularios, sin cookies publicitarias).',
        'Asesoría fiscal/gestoría: TODO_REAL, si aplica.',
      ],
    },
    {
      id: 'transferencias',
      heading: 'Transferencias internacionales',
      paragraphs: [
        'Los datos se alojan en la Unión Europea. Si algún proveedor (p. ej. soporte o red de entrega) tratase datos fuera del EEE, se apoya en el Marco de Privacidad de Datos UE-EE. UU. o en cláusulas contractuales tipo. TODO_REAL: verificar con cada proveedor.',
      ],
    },
    {
      id: 'conservacion',
      heading: 'Plazos de conservación y bloqueo',
      paragraphs: [
        'Pasado el plazo, los datos se bloquean (art. 32 LOPDGDD) mientras puedan derivarse responsabilidades y después se destruyen de forma segura. Las copias de seguridad desaparecen al expirar su retención.',
      ],
    },
    {
      id: 'seguridad',
      heading: 'Medidas de seguridad',
      paragraphs: [
        'Cifrado en tránsito (HTTPS con HSTS) y en reposo; las notas clínicas se cifran además a nivel de aplicación. Acceso restringido con doble factor, registro de accesos, copias de seguridad y separación de entornos. Ningún dato clínico se envía por correo electrónico.',
      ],
    },
    {
      id: 'derechos',
      heading: 'Tus derechos',
      paragraphs: [
        'Puedes solicitar acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad, y retirar tu consentimiento en cualquier momento sin que afecte a lo ya realizado. Responderé en el plazo de un mes (ampliable en casos complejos).',
        'Respecto a la historia clínica, la supresión no procede mientras rija la obligación legal de conservarla; en ese caso se bloquean los datos. El acceso a las anotaciones subjetivas del profesional puede limitarse conforme al art. 18.3 de la Ley 41/2002.',
        'Ejercicio: escribe a TODO_REAL@caromafla.online o usa el formulario de la página "Ejercer tus derechos". Podría pedirte verificar tu identidad si hay dudas razonables.',
        'Si consideras que no se han atendido tus derechos, puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).',
      ],
    },
    {
      id: 'menores',
      heading: 'Menores de edad',
      paragraphs: [
        'Los menores de 14 años requieren el consentimiento de sus representantes legales. Entre 14 y 17 años se valora la madurez conforme a la normativa de autonomía del paciente. TODO_REAL: criterio de edad mínima de atención.',
      ],
    },
    {
      id: 'cambios',
      heading: 'Cambios en esta política',
      paragraphs: ['Esta política está versionada. Cuando cambie de forma relevante se actualizará la fecha y, si procede, se te informará.'],
    },
  ],
};

/** Version del texto de consentimientos. Subirla al cambiar los textos (REVISAR_CON_ABOGADO). */
export const CONSENT_TEXT_VERSION = '2026-10-v1';

export const CONSENT_TEXTS = {
  privacy: 'He leído la política de privacidad y entiendo cómo se tratarán mis datos para gestionar mi cita.',
  health:
    'Doy mi consentimiento explícito para que se traten los datos de salud necesarios para atenderme (art. 9.2.a RGPD). Puedo retirarlo en cualquier momento.',
  reminders: 'Quiero recibir un recordatorio por correo electrónico antes de mi cita (opcional).',
} as const;

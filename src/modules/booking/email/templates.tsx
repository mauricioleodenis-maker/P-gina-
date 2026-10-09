import { Link, Text } from '@react-email/components';
import { EmailLayout, btn, p } from './Layout';

type When = { whenText: string; serviceName: string; modalityText: string };

/** Confirmacion a la persona que reserva. Incluye enlace firmado para cancelar. */
export function BookingConfirmationEmail({ name, whenText, serviceName, modalityText, manageUrl, autoConfirmed }: When & { name: string; manageUrl: string; autoConfirmed: boolean }) {
  return (
    <EmailLayout preview="Hemos recibido tu solicitud de cita">
      <Text style={p}>Hola, {name}:</Text>
      <Text style={p}>
        {autoConfirmed ? 'Tu cita está confirmada.' : 'He recibido tu solicitud. La revisaré y te confirmaré la cita por correo lo antes posible.'}
      </Text>
      <Text style={p}>
        <strong>{serviceName}</strong>
        <br />
        {whenText} (hora de Madrid)
        <br />
        {modalityText}
      </Text>
      <Text style={p}>Adjunto un archivo de calendario (.ics) para que lo guardes.</Text>
      <Text style={p}>
        <Link href={manageUrl} style={btn}>Ver o cancelar mi cita</Link>
      </Text>
      <Text style={{ ...p, fontSize: 14, color: '#5E544B' }}>Puedes cancelar desde ese enlace hasta 24 horas antes. Pasado ese plazo, escríbeme.</Text>
    </EmailLayout>
  );
}

/** Aviso a la profesional: asunto y cuerpo neutros, sin nota ni motivo. */
export function ProfessionalNoticeEmail({ whenText, serviceName, adminUrl }: Omit<When, 'modalityText'> & { adminUrl: string }) {
  return (
    <EmailLayout preview="Nueva solicitud de cita">
      <Text style={p}>Hay una nueva solicitud de cita:</Text>
      <Text style={p}><strong>{serviceName}</strong><br />{whenText}</Text>
      <Text style={p}><Link href={adminUrl} style={btn}>Abrir solicitudes</Link></Text>
    </EmailLayout>
  );
}

export function ReminderEmail({ name, whenText, serviceName, modalityText, contactUrl }: When & { name: string; contactUrl: string }) {
  return (
    <EmailLayout preview="Recordatorio de tu cita de mañana">
      <Text style={p}>Hola, {name}:</Text>
      <Text style={p}>Te recuerdo tu cita de mañana:</Text>
      <Text style={p}><strong>{serviceName}</strong><br />{whenText} (hora de Madrid)<br />{modalityText}</Text>
      <Text style={p}>Si necesitas cambiarla, <Link href={contactUrl}>escríbeme</Link> cuanto antes.</Text>
    </EmailLayout>
  );
}

export function CancellationEmail({ name, whenText, serviceName, bookUrl }: Omit<When, 'modalityText'> & { name: string; bookUrl: string }) {
  return (
    <EmailLayout preview="Tu cita ha sido cancelada">
      <Text style={p}>Hola, {name}:</Text>
      <Text style={p}>Tu cita de <strong>{serviceName}</strong> ({whenText}) ha quedado cancelada.</Text>
      <Text style={p}>Cuando quieras, puedes <Link href={bookUrl}>elegir otro día</Link>.</Text>
    </EmailLayout>
  );
}

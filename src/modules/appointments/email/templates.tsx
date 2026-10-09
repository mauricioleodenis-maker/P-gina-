import { Link, Text } from '@react-email/components';
import { EmailLayout, btn, p } from '@/modules/booking/email/Layout';

type When = { name: string; whenText: string; serviceName: string; modalityText: string };

/** La profesional acepta la solicitud. Sin datos clinicos ni motivo. */
export function RequestAcceptedEmail({ name, whenText, serviceName, modalityText }: When) {
  return (
    <EmailLayout preview="Tu cita está confirmada">
      <Text style={p}>Hola, {name}:</Text>
      <Text style={p}>Tu cita está confirmada.</Text>
      <Text style={p}>
        <strong>{serviceName}</strong>
        <br />
        {whenText} (hora de Madrid)
        <br />
        {modalityText}
      </Text>
      <Text style={p}>Adjunto un archivo de calendario (.ics) para que la guardes.</Text>
    </EmailLayout>
  );
}

/** Rechazo neutro: el motivo interno NO se envia. */
export function RequestRejectedEmail({ name, whenText, serviceName, bookUrl }: Omit<When, 'modalityText'> & { bookUrl: string }) {
  return (
    <EmailLayout preview="Sobre tu solicitud de cita">
      <Text style={p}>Hola, {name}:</Text>
      <Text style={p}>
        No puedo confirmar la cita de <strong>{serviceName}</strong> ({whenText}). Lo siento.
      </Text>
      <Text style={p}>
        <Link href={bookUrl} style={btn}>Elegir otro día</Link>
      </Text>
    </EmailLayout>
  );
}

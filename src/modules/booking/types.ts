export type Modality = 'in_person' | 'online';

export type BookableService = {
  id: string;
  slug: string;
  name: string;
  description: string;
  durationMin: number;
  priceCents: number; // 0 = TODO_REAL ("Consultar")
  modality: 'in_person' | 'online' | 'both';
};

export type PublicSlot = { start: string; end: string };

export type BookingSummary = {
  status: 'requested' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  startsAt: string;
  endsAt: string;
  modality: Modality;
  serviceName: string;
  cancellable: boolean;
  cancellationHours: number;
};

export type BookingErrorCode =
  | 'validation'
  | 'rate_limited'
  | 'captcha'
  | 'slot_taken'
  | 'too_soon'
  | 'too_far'
  | 'invalid_service'
  | 'server';

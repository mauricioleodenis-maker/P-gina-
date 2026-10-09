/** Resultado estandar de Server Actions (PLAN s.3). */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Estado de formulario para useActionState. */
export type FormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Pide Turnstile en el siguiente intento (tras 3 fallos). */
  needsCaptcha?: boolean;
};

export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const IDLE_COOKIE = 'cm_last';

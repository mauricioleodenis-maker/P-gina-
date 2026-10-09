/** Navegacion fija del admin (PLAN s.6). Unico dueno: P3. `icon` es una clave de shell/icons.ts. */
export type NavItem = {
  href: string;
  label: string;
  icon: 'home' | 'users' | 'calendar' | 'inbox' | 'wallet' | 'message' | 'settings';
  /** Palabras extra para el buscador Cmd+K. */
  keywords?: string[];
};

export const navItems: readonly NavItem[] = [
  { href: '/admin', label: 'Inicio', icon: 'home', keywords: ['dashboard', 'resumen'] },
  { href: '/admin/pacientes', label: 'Pacientes', icon: 'users', keywords: ['fichas', 'notas'] },
  { href: '/admin/calendario', label: 'Calendario', icon: 'calendar', keywords: ['citas', 'agenda'] },
  { href: '/admin/solicitudes', label: 'Solicitudes', icon: 'inbox', keywords: ['reservas', 'pendientes'] },
  { href: '/admin/ingresos', label: 'Ingresos', icon: 'wallet', keywords: ['pagos', 'facturas', 'cobros'] },
  { href: '/admin/mensajes', label: 'Mensajes', icon: 'message', keywords: ['contacto', 'rgpd', 'derechos'] },
  { href: '/admin/ajustes', label: 'Ajustes', icon: 'settings', keywords: ['perfil', 'servicios', 'horario', 'seguridad'] },
];

/** Accesos rapidos extra para Cmd+K. */
export const quickActions: readonly { href: string; label: string; keywords?: string[] }[] = [
  { href: '/admin/pacientes/nuevo', label: 'Nuevo paciente', keywords: ['alta', 'crear'] },
  { href: '/admin/calendario', label: 'Nueva cita', keywords: ['crear', 'agendar'] },
  { href: '/admin/ingresos/facturas', label: 'Facturas', keywords: ['emitir'] },
  { href: '/admin/ajustes/seguridad', label: 'Seguridad y MFA', keywords: ['contrasena', '2fa', 'codigos'] },
  { href: '/admin/ajustes/horario', label: 'Horario de atencion' },
  { href: '/admin/ajustes/auditoria', label: 'Registro de auditoria' },
];

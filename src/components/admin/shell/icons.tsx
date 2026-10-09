import { CalendarDays, Home, Inbox, MessageSquare, Settings, Users, Wallet, type LucideIcon } from 'lucide-react';
import type { NavItem } from '../nav-items';

export const navIcons: Record<NavItem['icon'], LucideIcon> = {
  home: Home,
  users: Users,
  calendar: CalendarDays,
  inbox: Inbox,
  wallet: Wallet,
  message: MessageSquare,
  settings: Settings,
};

import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Scissors,
  ReceiptText,
  HandCoins,
  Wallet,
  FileBarChart,
  Settings,
  LifeBuoy,
} from 'lucide-react';

export type NavItem = {
  title: string;
  key: string;
  url: string;
  icon: LucideIcon;
  badge?: number | null;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    title: 'nav.overview',
    items: [
      { title: 'nav.dashboard', key: 'nav.dashboard', url: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'nav.management',
    items: [
      { title: 'nav.barbers', key: 'nav.barbers', url: '/barbers', icon: Scissors },
      { title: 'nav.transactions', key: 'nav.transactions', url: '/transactions', icon: ReceiptText },
      { title: 'nav.loans', key: 'nav.loans', url: '/loans', icon: HandCoins },
      { title: 'nav.wallet', key: 'nav.wallet', url: '/wallet', icon: Wallet },
    ],
  },
  {
    title: 'nav.insights',
    items: [{ title: 'nav.reports', key: 'nav.reports', url: '/reports', icon: FileBarChart }],
  },
  {
    title: 'nav.settingsGroup',
    items: [
      { title: 'nav.settings', key: 'nav.settings', url: '/settings', icon: Settings },
      { title: 'nav.support', key: 'nav.support', url: '/support', icon: LifeBuoy },
    ],
  },
];
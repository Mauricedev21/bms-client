import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CURRENCY = 'RWF';

export function formatCurrency(amount: number | undefined | null): string {
  const value = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  return `${CURRENCY} ${new Intl.NumberFormat('en-RW', { maximumFractionDigits: 2 }).format(value)}`;
}

export function formatNumber(value: number | undefined | null): string {
  return new Intl.NumberFormat('en-RW', { maximumFractionDigits: 2 }).format(value ?? 0);
}

export function formatDate(value: string | Date | undefined | null): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function formatDateOnly(value: string | Date | undefined | null): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(date);
}

export function relativeTime(value: string | Date): string {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function initials(name: string | undefined | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', kin: 'Amafaranga y\'amafaranga mboneza' },
  { value: 'mobile_money', label: 'Mobile Money', kin: 'Mobile Money' },
  { value: 'card', label: 'Card', kin: 'Ikadiri' },
  { value: 'bank_transfer', label: 'Bank Transfer', kin: 'Kohereza mu banki' },
  { value: 'other', label: 'Other', kin: 'Ibindi' },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value'];

export function paymentMethodLabel(method: string): string {
  return PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method;
}
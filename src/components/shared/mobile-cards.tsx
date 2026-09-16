import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Renders a list of data as stacked cards on small screens (hidden on md+).
 * Used as the phone-friendly companion to a `<Table>` that only shows at md+.
 */
export function MobileCards<T>({
  items,
  render,
  className,
  emptyClassName,
}: {
  items: T[];
  render: (item: T) => ReactNode;
  className?: string;
  emptyClassName?: string;
}) {
  if (!items.length) return null;
  return (
    <div className={cn('divide-y divide-border md:hidden', className)}>
      {items.map((item, i) => (
        <div key={i} className={cn('p-4', emptyClassName)}>{render(item)}</div>
      ))}
    </div>
  );
}
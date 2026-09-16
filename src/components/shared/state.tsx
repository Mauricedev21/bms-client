import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
  className,
}: {
  icon: LucideIcon;
  title?: string;
  message: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-14 text-center', className)}>
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-7" />
      </div>
      {title ? <p className="font-semibold">{title}</p> : null}
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

export function LoadingRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full" />
      ))}
    </div>
  );
}

export function LoadingCards({ cards = 6, className }: { cards?: number; className?: string }) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {Array.from({ length: cards }).map((_, i) => (
        <Card key={i} className="p-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-9 w-32" />
          <Skeleton className="mt-3 h-3 w-full" />
        </Card>
      ))}
    </div>
  );
}
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

export function PageHeader({
  title,
  description,
  actions,
  icon: Icon,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex items-center gap-3">
        {Icon ? (
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
        ) : null}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  title,
  value,
  icon: Icon,
  hint,
  loading,
  className,
  accent = 'primary',
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  loading?: boolean;
  className?: string;
  accent?: 'primary' | 'success' | 'info' | 'warning' | 'danger';
}) {
  const tones: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-600/10 text-emerald-600 dark:text-emerald-400',
    info: 'bg-sky-600/10 text-sky-600 dark:text-sky-400',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    danger: 'bg-destructive/10 text-destructive',
  };
  return (
    <Card className={cn('card-shadow overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn('flex size-9 items-center justify-center rounded-lg', tones[accent])}>
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <div className="px-4 pb-4">
        {loading ? (
          <Skeleton className="h-9 w-28" />
        ) : (
          <div className="text-2xl font-bold tracking-tight tabular-nums">{value}</div>
        )}
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </Card>
  );
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  actions,
  children,
  footer,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Card className={cn('card-shadow flex h-full flex-col', className)}>
      {title ? (
        <CardHeader className="flex flex-row items-start justify-between gap-2 border-b pb-3">
          <div className="flex items-start gap-2">
            {Icon ? (
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" />
              </div>
            ) : null}
            <div>
              <div className="text-base font-semibold tracking-tight">{title}</div>
              {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
            </div>
          </div>
          {actions ? <div className="flex flex-shrink-0 items-center gap-2">{actions}</div> : null}
        </CardHeader>
      ) : null}
      <div className={cn('flex-1 p-5', bodyClassName)}>{children}</div>
      {footer ? <CardFooter className="border-t px-5 py-3">{footer}</CardFooter> : null}
    </Card>
  );
}

export function QuickAction({
  icon: Icon,
  label,
  onClick,
  href,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  href?: string;
}) {
  const inner = (
    <>
      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="size-4" />
      </div>
      <span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">{label}</span>
    </>
  );
  const cls =
    'group inline-flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left shadow-sm transition-all hover:shadow-md hover:border-primary/30';
  if (href) {
    return (
      <Button asChild variant="ghost" className="h-auto w-full p-0">
        <a href={href} className={cls}>
          {inner}
        </a>
      </Button>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}
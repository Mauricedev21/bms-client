import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const TONES: Record<string, { variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'success' | 'warning' | 'info'; dot: string }> = {
  active: { variant: 'success', dot: 'bg-emerald-500' },
  completed: { variant: 'success', dot: 'bg-emerald-500' },
  settled: { variant: 'success', dot: 'bg-emerald-500' },
  paid: { variant: 'success', dot: 'bg-emerald-500' },
  expiring: { variant: 'warning', dot: 'bg-amber-500' },
  pending: { variant: 'warning', dot: 'bg-amber-500' },
  inactive: { variant: 'secondary', dot: 'bg-muted-foreground' },
  void: { variant: 'secondary', dot: 'bg-muted-foreground' },
  cancelled: { variant: 'secondary', dot: 'bg-muted-foreground' },
  suspended: { variant: 'destructive', dot: 'bg-red-500' },
  expired: { variant: 'destructive', dot: 'bg-red-500' },
  overdue: { variant: 'destructive', dot: 'bg-red-500' },
  default: { variant: 'info', dot: 'bg-sky-500' },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = TONES[status.toLowerCase()] ?? TONES.default;
  return (
    <Badge variant={tone.variant} className={cn('gap-1.5 capitalize', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
      {status}
    </Badge>
  );
}
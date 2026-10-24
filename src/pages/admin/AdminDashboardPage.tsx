import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, Scissors, ReceiptText, HandCoins, UserPlus, ArrowRight, Bell, UserCheck, UserX, Clock, Database } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { api, errorMessage } from '@/lib/api';
import { formatDate, relativeTime, initials } from '@/lib/utils';
import { PageHeader, StatCard, SectionCard } from '@/components/shared/cards';
import { StatusBadge } from '@/components/shared/status-badge';
import { ConfirmDialog } from '@/components/shared/dialogs';
import { EmptyState, LoadingRows } from '@/components/shared/state';
import { MobileCards } from '@/components/shared/mobile-cards';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PendingRequest {
  _id: string;
  username: string;
  fullName?: string;
  phone: string;
  email: string;
  requestedSalonName?: string;
  createdAt: string;
}

interface AdminDashboardData {
  counts: { total: number; active: number; pending: number; expiring: number; expired: number; suspended: number; rejected?: number };
  barberCount: number;
  totalTransactions: number;
  totalLoans: number;
  activeLoans: number;
  recentRegistrations: {
    user: { _id: string; username: string; fullName?: string; phone: string; email: string; createdAt: string; status: string; subscriptionEnd?: string | null };
    salonName: string;
  }[];
  pendingRequests: PendingRequest[];
  notifications: { _id: string; title: string; message: string; read: boolean; createdAt: string }[];
}

type Decision = { user: PendingRequest; action: 'approve' | 'reject' };

interface StorageUsage {
  available: boolean;
  usedMb: number;
  dataMb: number;
  totalMb: number | null;
  percent: number | null;
  remainingMb: number | null;
  source: 'config' | 'filesystem' | 'none';
  collections: number;
  objects: number;
  error?: string;
  updatedAt: string;
}

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [decision, setDecision] = useState<Decision | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data.data as AdminDashboardData;
    },
    retry: 2,
    retryDelay: 1000,
  });

  const { data: storage, isLoading: storageLoading } = useQuery({
    queryKey: ['admin-storage'],
    queryFn: async () => {
      const res = await api.get('/admin/storage');
      return res.data.data as StorageUsage;
    },
    retry: 1,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const decide = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'reject' }) => {
      const res = await api.post(`/admin/users/${id}/${action}`);
      return res.data.data;
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.action === 'approve' ? t('admin.approved') : t('admin.rejected'));
      setDecision(null);
      void qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
      void qc.invalidateQueries({ queryKey: ['admin-requests'] });
      void qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (isError && !isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage(error as Error)}
        </div>
        <Button onClick={() => window.location.reload()} className="mt-4">
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  const c = data?.counts;
  const recentRegistrations = data?.recentRegistrations ?? [];
  const pendingRequests = data?.pendingRequests ?? [];
  const notifications = data?.notifications ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader title={t('nav.admin')} description={t('admin.subtitle')} icon={Building2} />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t('admin.managers')} icon={Building2} value={String(c?.total ?? 0)} loading={isLoading} hint={`${t('admin.active')}: ${c?.active ?? 0}`} accent="primary" />
        <StatCard title={t('admin.expiring')} icon={Bell} value={String(c?.expiring ?? 0)} loading={isLoading} hint={`${t('admin.expired')}: ${c?.expired ?? 0} · ${t('admin.suspended')}: ${c?.suspended ?? 0}`} accent="warning" />
        <StatCard title={t('admin.barbers')} icon={Scissors} value={String(data?.barberCount ?? 0)} loading={isLoading} accent="success" />
        <StatCard title={t('admin.transactions')} icon={ReceiptText} value={String(data?.totalTransactions ?? 0)} loading={isLoading} accent="info" />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t('admin.loans')} icon={HandCoins} value={String(data?.totalLoans ?? 0)} loading={isLoading} hint={`${t('admin.activeLoans')}: ${data?.activeLoans ?? 0}`} accent="primary" />
        <StatCard
          title={t('admin.pendingRequests')}
          icon={Clock}
          value={String(c?.pending ?? pendingRequests.length)}
          loading={isLoading}
          hint={`${t('admin.rejectedLabel')}: ${c?.rejected ?? 0}`}
          accent="warning"
        />
        <StatCard title={t('admin.notifications')} icon={Bell} value={String(notifications.length)} loading={isLoading} accent="info" />
        <StatCard title={t('admin.registeredOn')} icon={UserPlus} value={String(recentRegistrations.length)} loading={isLoading} hint={t('admin.recentRegistrations')} accent="success" />
      </div>

      {/* Database usage widget — percentage + remaining space */}
      <SectionCard
        title={t('admin.storageTitle')}
        icon={Database}
        description={t('admin.storageSubtitle')}
        className="mb-6"
      >
        {storageLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : !storage?.available ? (
          <p className="text-sm text-muted-foreground">{t('admin.storageUnavailable')}</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight tabular-nums">
                {storage.percent !== null ? `${storage.percent}%` : `${storage.usedMb} MB`}
              </span>
              <span className="text-sm text-muted-foreground">{t('admin.storageUsedLabel')}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={storage.percent ?? 0} aria-valuemin={0} aria-valuemax={100}>
              <div
                className={`h-full rounded-full transition-all ${
                  (storage.percent ?? 0) >= 90 ? 'bg-destructive' : (storage.percent ?? 0) >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, storage.percent ?? 0)}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {storage.totalMb !== null ? (
                <>
                  {storage.usedMb} MB / {storage.totalMb} MB · {t('admin.storageRemaining')}: <span className="font-medium text-foreground">{storage.remainingMb} MB</span>
                </>
              ) : (
                <>
                  {storage.usedMb} MB · {t('admin.storageNoLimit')}
                </>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('admin.storageMeta')}: {storage.collections} · {t('admin.storageObjects')}: {storage.objects}
            </p>
          </div>
        )}
      </SectionCard>

      {/* Manager Requests — review, approve or deny from the dashboard */}
      <SectionCard
        title={t('admin.pendingRequests')}
        icon={UserCheck}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/requests">
              {t('common.viewAll')} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        }
        bodyClassName="p-0"
        className="mb-6"
      >
        {isLoading ? (
          <div className="p-5">
            <LoadingRows rows={3} />
          </div>
        ) : pendingRequests.length === 0 ? (
          <EmptyState icon={UserCheck} message={t('admin.noPending')} />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('auth.fullName')}</TableHead>
                    <TableHead>{t('admin.requestedSalon')}</TableHead>
                    <TableHead>{t('admin.registeredOn')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((r) => (
                    <TableRow key={r._id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 border border-primary/20 bg-primary/10">
                            <AvatarFallback className="text-xs text-primary">{initials(r.fullName || r.username)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{r.fullName || r.username}</p>
                            <p className="text-xs text-muted-foreground">{r.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{r.requestedSalonName || '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{relativeTime(r.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => setDecision({ user: r, action: 'approve' })}>
                            <UserCheck className="mr-1 h-4 w-4" />
                            {t('admin.approve')}
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDecision({ user: r, action: 'reject' })}>
                            <UserX className="mr-1 h-4 w-4" />
                            {t('admin.reject')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <MobileCards
              className="bg-card"
              items={pendingRequests}
              render={(r) => (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar className="h-8 w-8 shrink-0 border border-primary/20 bg-primary/10">
                        <AvatarFallback className="text-xs text-primary">{initials(r.fullName || r.username)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium">{r.fullName || r.username}</p>
                        <p className="truncate text-xs text-muted-foreground">{r.email}</p>
                      </div>
                    </div>
                    <StatusBadge status="pending" />
                  </div>
                  <p className="text-xs text-muted-foreground">{r.requestedSalonName || '—'} · {relativeTime(r.createdAt)}</p>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" onClick={() => setDecision({ user: r, action: 'approve' })}>
                      <UserCheck className="mr-1 h-4 w-4" />
                      {t('admin.approve')}
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDecision({ user: r, action: 'reject' })}>
                      <UserX className="mr-1 h-4 w-4" />
                      {t('admin.reject')}
                    </Button>
                  </div>
                </div>
              )}
            />
          </>
        )}
      </SectionCard>

      <SectionCard
        title={t('admin.recentRegistrations')}
        icon={UserPlus}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/users">
              {t('common.viewAll')} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        }
        bodyClassName="p-0"
        className="mb-6"
      >
        {isLoading ? (
          <div className="p-5">
            <LoadingRows rows={4} />
          </div>
        ) : recentRegistrations.length === 0 ? (
          <EmptyState icon={UserPlus} message={t('common.noData')} />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('auth.fullName')}</TableHead>
                    <TableHead>{t('settings.salonTitle')}</TableHead>
                    <TableHead>{t('admin.subscription')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRegistrations.map((r) => (
                    <TableRow key={r.user._id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 border border-primary/20 bg-primary/10">
                            <AvatarFallback className="text-xs text-primary">{initials(r.user.fullName || r.user.username)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{r.user.fullName || r.user.username}</p>
                            <p className="text-xs text-muted-foreground">@{r.user.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{r.salonName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{relativeTime(r.user.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <MobileCards
              className="bg-card"
              items={recentRegistrations}
              render={(r) => (
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 shrink-0 border border-primary/20 bg-primary/10">
                    <AvatarFallback className="text-xs text-primary">{initials(r.user.fullName || r.user.username)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{r.user.fullName || r.user.username}</p>
                    <p className="truncate text-xs text-muted-foreground">@{r.user.username} · {r.salonName}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(r.user.createdAt)}</span>
                </div>
              )}
            />
          </>
        )}
      </SectionCard>

      <SectionCard
        title={t('admin.platformNotifications')}
        icon={Bell}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/activity">
              {t('common.viewAll')} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        }
        bodyClassName="p-0"
      >
        <div className="max-h-80 overflow-auto">
          {isLoading ? (
            <div className="p-5">
              <LoadingRows rows={5} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={Bell} message={t('common.noNotifications')} />
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n._id} className="flex items-start gap-3 border-b px-4 py-3 last:border-0">
                <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-muted-foreground/30' : 'bg-primary'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground/70">{formatDate(n.createdAt)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        <UserPlus className="mr-1 inline h-3 w-3" />
        {t('admin.footerHint')}
      </p>

      <ConfirmDialog
        open={decision?.action === 'approve'}
        onOpenChange={(o) => { if (!o) setDecision(null); }}
        title={t('admin.approveTitle')}
        description={
          <>
            {t('admin.approveConfirmHint')} <b>{decision?.user.fullName || decision?.user.username}</b>
            {decision?.user.requestedSalonName ? <> — {decision.user.requestedSalonName}</> : null}.
          </>
        }
        confirmLabel={decide.isPending ? t('common.loading') : t('admin.approve')}
        variant="default"
        loading={decide.isPending}
        onConfirm={() => decision && decide.mutate({ id: decision.user._id, action: decision.action })}
      />

      <ConfirmDialog
        open={decision?.action === 'reject'}
        onOpenChange={(o) => { if (!o) setDecision(null); }}
        title={t('admin.rejectTitle')}
        description={
          <>
            {t('admin.rejectConfirmHint')} <b>{decision?.user.fullName || decision?.user.username}</b>.
          </>
        }
        confirmLabel={decide.isPending ? t('common.loading') : t('admin.reject')}
        variant="destructive"
        loading={decide.isPending}
        onConfirm={() => decision && decide.mutate({ id: decision.user._id, action: decision.action })}
      />
    </div>
  );
}

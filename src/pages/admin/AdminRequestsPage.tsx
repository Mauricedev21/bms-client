import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserCheck, UserX, UserPlus, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { api, errorMessage } from '@/lib/api';
import type { AdminUser, Paginated } from '@/lib/types';
import { formatDateOnly, initials } from '@/lib/utils';
import { PageHeader, SectionCard } from '@/components/shared/cards';
import { StatusBadge } from '@/components/shared/status-badge';
import { ConfirmDialog } from '@/components/shared/dialogs';
import { EmptyState, LoadingRows } from '@/components/shared/state';
import { MobileCards } from '@/components/shared/mobile-cards';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Decision = { user: AdminUser; action: 'approve' | 'reject' };

export default function AdminRequestsPage() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [decision, setDecision] = useState<Decision | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: async () => {
      const res = await api.get('/admin/users', { params: { status: 'pending', limit: 100 } });
      return res.data.data as Paginated<AdminUser>;
    },
    retry: 2,
    retryDelay: 1000,
  });

  const requests = data?.items ?? [];

  const decide = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'reject' }) => {
      const res = await api.post(`/admin/users/${id}/${action}`);
      return res.data.data;
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.action === 'approve' ? t('admin.approved') : t('admin.rejected'));
      setDecision(null);
      void qc.invalidateQueries({ queryKey: ['admin-requests'] });
      void qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
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

  return (
    <div>
      <PageHeader title={t('nav.adminRequests')} description={t('admin.pendingRequestsSubtitle')} icon={UserCheck} />

      <SectionCard
        title={t('admin.pendingRequests')}
        icon={Clock}
        actions={<StatusBadge status="pending" />}
        bodyClassName="p-0"
      >
        {isLoading ? (
          <div className="p-5">
            <LoadingRows rows={4} />
          </div>
        ) : requests.length === 0 ? (
          <EmptyState icon={UserCheck} message={t('admin.noPending')} />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('auth.fullName')}</TableHead>
                    <TableHead>{t('admin.requestedSalon')}</TableHead>
                    <TableHead>{t('barbers.contact')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((u) => (
                    <TableRow key={u._id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 border border-primary/20 bg-primary/10">
                            <AvatarFallback className="text-xs text-primary">{initials(u.fullName || u.username)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{u.fullName || u.username}</p>
                            <p className="text-xs text-muted-foreground">@{u.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{u.requestedSalonName || '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <p>{u.phone}</p>
                        <p>{u.email}</p>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={u.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => setDecision({ user: u, action: 'approve' })}>
                            <UserCheck className="mr-1 h-4 w-4" />
                            {t('admin.approve')}
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDecision({ user: u, action: 'reject' })}>
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
              items={requests}
              render={(u) => (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar className="h-8 w-8 shrink-0 border border-primary/20 bg-primary/10">
                        <AvatarFallback className="text-xs text-primary">{initials(u.fullName || u.username)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium">{u.fullName || u.username}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.phone} · {u.email}</p>
                      </div>
                    </div>
                    <StatusBadge status={u.status} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">{u.requestedSalonName || '—'}</p>
                    <p>{t('admin.registeredOn')}: {formatDateOnly(u.registrationDate)}</p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" onClick={() => setDecision({ user: u, action: 'approve' })}>
                      <UserCheck className="mr-1 h-4 w-4" />
                      {t('admin.approve')}
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDecision({ user: u, action: 'reject' })}>
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
        onConfirm={() => decision && decide.mutate({ id: decision.user._id, action: 'approve' })}
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
        onConfirm={() => decision && decide.mutate({ id: decision.user._id, action: 'reject' })}
      />
    </div>
  );
}

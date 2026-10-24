import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, Bell, CheckCheck, RefreshCcw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { api, errorMessage } from '@/lib/api';
import type { NotificationItem } from '@/lib/types';
import { formatDate, relativeTime } from '@/lib/utils';
import { PageHeader, SectionCard } from '@/components/shared/cards';
import { EmptyState, LoadingRows } from '@/components/shared/state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AuditEntry {
  _id: string;
  actor?: { _id: string; username?: string } | null;
  actorRole?: string;
  action: string;
  entity?: string;
  entityId?: unknown;
  createdAt: string;
}

export default function AdminActivityPage() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [refreshed, setRefreshed] = useState<number | null>(null);

  const logsQuery = useQuery({
    queryKey: ['admin-activity'],
    queryFn: async () => {
      const res = await api.get('/admin/activity');
      return (res.data.data.logs ?? []) as AuditEntry[];
    },
    retry: 2,
    retryDelay: 1000,
  });

  const notifQuery = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const res = await api.get('/user/notifications');
      return res.data.data as { notifications: NotificationItem[]; unread: number };
    },
    retry: 2,
    retryDelay: 1000,
  });

  const markRead = useMutation({
    mutationFn: async () => {
      await api.post('/user/notifications/read');
    },
    onSuccess: () => {
      toast.success(t('admin.markedRead'));
      void qc.invalidateQueries({ queryKey: ['admin-notifications'] });
      void qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const refreshNotifs = useMutation({
    mutationFn: async () => {
      const res = await api.post('/admin/notifications/refresh');
      return res.data.data as { checked: number };
    },
    onSuccess: (d) => {
      setRefreshed(d.checked);
      toast.success(t('admin.notificationsRefreshed').replace('{count}', String(d.checked)));
      void qc.invalidateQueries({ queryKey: ['admin-notifications'] });
      void qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const logs = logsQuery.data ?? [];
  const notifications = notifQuery.data?.notifications ?? [];
  const unread = notifQuery.data?.unread ?? 0;

  const isLoading = logsQuery.isLoading || notifQuery.isLoading;
  const isError = logsQuery.isError || notifQuery.isError;
  const error = logsQuery.error ?? notifQuery.error;

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
      <PageHeader
        title={t('nav.adminActivity')}
        description={t('admin.activitySubtitle')}
        icon={Activity}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => refreshNotifs.mutate()} disabled={refreshNotifs.isPending}>
              <RefreshCcw className={`mr-2 h-4 w-4 ${refreshNotifs.isPending ? 'animate-spin' : ''}`} />
              {t('admin.refreshNotifications')}
            </Button>
            <Button size="sm" onClick={() => markRead.mutate()} disabled={markRead.isPending || unread === 0}>
              <CheckCheck className="mr-2 h-4 w-4" />
              {t('admin.markAllRead')}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title={t('admin.platformNotifications')}
          icon={Bell}
          actions={unread > 0 ? <Badge variant="warning">{unread} {t('admin.unread')}</Badge> : null}
          bodyClassName="p-0"
        >
          <div className="max-h-[32rem] overflow-auto">
            {isLoading ? (
              <div className="p-5"><LoadingRows rows={5} /></div>
            ) : notifications.length === 0 ? (
              <EmptyState icon={Bell} message={t('common.noNotifications')} />
            ) : (
              notifications.map((n) => (
                <div key={n._id} className="flex items-start gap-3 border-b px-4 py-3 last:border-0">
                  <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-muted-foreground/30' : 'bg-primary'}`} />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      <Badge variant="outline" className="text-[10px] uppercase">{n.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/70">{formatDate(n.createdAt)} · {relativeTime(n.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title={t('admin.accountActivity')} icon={ShieldCheck} bodyClassName="p-0">
          <div className="max-h-[32rem] overflow-auto">
            {isLoading ? (
              <div className="p-5"><LoadingRows rows={5} /></div>
            ) : logs.length === 0 ? (
              <EmptyState icon={ShieldCheck} message={t('admin.noActivity')} />
            ) : (
              logs.map((log) => (
                <div key={log._id} className="flex items-start gap-3 border-b px-4 py-3 last:border-0">
                  <div className="mt-1 size-2 shrink-0 rounded-full bg-sky-500" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-xs font-medium text-foreground">{log.action}</p>
                      {log.actorRole ? <Badge variant="outline" className="text-[10px]">{log.actorRole}</Badge> : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {log.actor?.username ? `@${log.actor.username}` : t('admin.systemActor')} · {log.entity ?? '—'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/70">{formatDate(log.createdAt)} · {relativeTime(log.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      {refreshed !== null ? (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {t('admin.notificationsRefreshed').replace('{count}', String(refreshed))}
        </p>
      ) : null}
    </div>
  );
}

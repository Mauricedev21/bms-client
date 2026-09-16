import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, Scissors, ReceiptText, HandCoins, UserPlus, ArrowRight, Bell } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import { formatDate, relativeTime, initials } from '@/lib/utils';
import { PageHeader, StatCard, SectionCard } from '@/components/shared/cards';
import { EmptyState, LoadingRows } from '@/components/shared/state';
import { MobileCards } from '@/components/shared/mobile-cards';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AdminDashboardData {
  counts: { total: number; active: number; expiring: number; expired: number; suspended: number };
  barberCount: number;
  totalTransactions: number;
  totalLoans: number;
  activeLoans: number;
  recentRegistrations: {
    user: { _id: string; username: string; fullName?: string; phone: string; email: string; createdAt: string; status: string; subscriptionEnd?: string | null };
    salonName: string;
  }[];
  notifications: { _id: string; title: string; message: string; read: boolean; createdAt: string }[];
}

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data.data as AdminDashboardData;
    },
  });

  const c = data?.counts;

  return (
    <div>
      <PageHeader title={t('nav.admin')} description={t('admin.subtitle')} icon={Building2} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t('admin.managers')} icon={Building2} value={String(c?.total ?? 0)} loading={isLoading} hint={`${t('admin.active')}: ${c?.active ?? 0}`} accent="primary" />
        <StatCard title={t('admin.expiring')} icon={Bell} value={String(c?.expiring ?? 0)} loading={isLoading} hint={`${t('admin.expired')}: ${c?.expired ?? 0} · ${t('admin.suspended')}: ${c?.suspended ?? 0}`} accent="warning" />
        <StatCard title={t('admin.barbers')} icon={Scissors} value={String(data?.barberCount ?? 0)} loading={isLoading} accent="success" />
        <StatCard title={t('admin.transactions')} icon={ReceiptText} value={String(data?.totalTransactions ?? 0)} loading={isLoading} accent="info" />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard title={t('admin.loans')} icon={HandCoins} value={String(data?.totalLoans ?? 0)} loading={isLoading} hint={`${t('admin.activeLoans')}: ${data?.activeLoans ?? 0}`} accent="primary" />
        <StatCard title={t('admin.notifications')} icon={Bell} value={String(data?.notifications.length ?? 0)} loading={isLoading} accent="info" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
        >
          {isLoading ? (
            <div className="p-5">
              <LoadingRows rows={4} />
            </div>
          ) : (data?.recentRegistrations ?? []).length === 0 ? (
            <EmptyState icon={UserPlus} message={t('common.noData')} />
          ) : (
            <>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('auth.fullName')}</TableHead>
                    <TableHead>{t('settings.salonTitle')}</TableHead>
                    <TableHead>{t('common.date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.recentRegistrations ?? []).map((r) => (
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
              items={data?.recentRegistrations ?? []}
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

        <SectionCard title={t('admin.platformNotifications')} icon={Bell} bodyClassName="p-0">
          <div className="max-h-80 overflow-auto">
            {isLoading ? (
              <div className="p-5">
                <LoadingRows rows={5} />
              </div>
            ) : (data?.notifications ?? []).length === 0 ? (
              <div className="p-5">
                <EmptyState icon={Bell} message={t('common.noNotifications')} />
              </div>
            ) : (
              (data?.notifications ?? []).map((n) => (
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
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        <UserPlus className="mr-1 inline h-3 w-3" />
        {t('admin.footerHint')}
      </p>
    </div>
  );
}
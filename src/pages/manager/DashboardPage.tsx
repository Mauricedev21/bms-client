import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Wallet,
  BriefcaseBusiness,
  ReceiptText,
  Users,
  HandCoins,
  TrendingUp,
  CalendarDays,
  Clock,
  ArrowRight,
  Plus,
  UserPlus,
  FileText,
  Bell,
  Zap,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { DashboardSummary } from '@/lib/types';
import { formatCurrency, formatDate, relativeTime } from '@/lib/utils';
import { PageHeader, StatCard, EmptyState } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function useDashboard() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['dashboard', user?._id],
    queryFn: async () => {
      const res = await api.get('/user/dashboard');
      return res.data.data as DashboardSummary;
    },
  });
}

const QUICK_ACTIONS = [
  { to: '/transactions', icon: Plus, labelKey: 'transactions.new' },
  { to: '/barbers', icon: UserPlus, labelKey: 'barbers.add' },
  { to: '/loans', icon: HandCoins, labelKey: 'loans.new' },
  { to: '/reports', icon: FileText, labelKey: 'reports.generateTitle' },
];

export default function DashboardPage() {
  const { t } = useLanguage();
  const { data, isLoading } = useDashboard();

  const wallet = data?.wallet;
  const total = wallet?.totalTransactionVolume ?? 0;
  const manager = wallet?.totalManagerEarnings ?? 0;
  const barber = wallet?.totalBarberEarnings ?? 0;
  const managerPct = total > 0 ? Math.round((manager / total) * 100) : 0;
  const barberPct = total > 0 ? Math.round((barber / total) * 100) : 0;

  return (
    <div>
      {/* Welcome header */}
      <PageHeader
        title={t('dashboard.greeting')}
        description={t('dashboard.todayOverview')}
        actions={
          <Button asChild>
            <Link to="/transactions">
              <CalendarDays className="mr-2 h-4 w-4" />
              {t('dashboard.newTransaction')}
            </Link>
          </Button>
        }
      />

      {/* Quick actions */}
      <div className="mb-6 flex flex-wrap gap-2">
        {QUICK_ACTIONS.map(({ to, icon: Icon, labelKey }) => (
          <Button key={to} asChild variant="outline" size="sm" className="gap-2">
            <Link to={to}>
              <Icon className="size-4" />
              {t(labelKey)}
            </Link>
          </Button>
        ))}
      </div>

      {/* 6 KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title={t('business.managerIncome')} icon={BriefcaseBusiness} value={formatCurrency(manager)} loading={isLoading} hint="60%" />
        <StatCard title={t('business.barberEarnings')} icon={Users} value={formatCurrency(barber)} loading={isLoading} hint="40%" />
        <StatCard title={t('business.totalTransactions')} icon={ReceiptText} value={String(wallet?.totalTransactions ?? 0)} loading={isLoading} hint={`${t('common.volume')}: ${formatCurrency(total)}`} />
        <StatCard title={t('business.activeBarbers')} icon={Users} value={String(wallet?.activeBarbers ?? 0)} loading={isLoading} />
        <StatCard title={t('business.outstandingLoans')} icon={HandCoins} value={formatCurrency(wallet?.totalOutstandingLoans)} loading={isLoading} />
        <StatCard title={t('business.currentBalance')} icon={Wallet} value={formatCurrency(wallet?.currentBalance)} loading={isLoading} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        {/* Financial overview */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="size-4 text-primary" />
              {t('wallet.volume')}
            </CardTitle>
            <CardDescription>{t('wallet.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-40" />
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold tracking-tight">{formatCurrency(total)}</p>
                <div className="mt-5 space-y-4">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span className="size-2.5 rounded-full bg-primary" />
                        {t('business.managerIncome')}
                      </span>
                      <span className="font-semibold">{formatCurrency(manager)}</span>
                    </div>
                    <Progress value={managerPct} className="bg-primary/20 [&>div]:bg-primary" />
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span className="size-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                        {t('business.barberEarnings')}
                      </span>
                      <span className="font-semibold">{formatCurrency(barber)}</span>
                    </div>
                    <Progress value={barberPct} className="bg-emerald-600/20 [&>div]:bg-emerald-600 dark:[&>div]:bg-emerald-400" />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-xl border p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="size-4" />
                      {t('business.today')}
                    </div>
                    <p className="mt-1 text-xl font-bold">{formatCurrency(data?.today.volume)}</p>
                    <p className="text-xs text-muted-foreground">{data?.today.count ?? 0} {t('dashboard.transactions')}</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="size-4" />
                      {t('business.thisWeek')}
                    </div>
                    <p className="mt-1 text-xl font-bold">{formatCurrency(data?.week.volume)}</p>
                    <p className="text-xs text-muted-foreground">{data?.week.count ?? 0} {t('dashboard.transactions')}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent activity / notifications */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4 text-primary" />
              {t('business.recentActivity')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (data?.notifications ?? []).length === 0 ? (
              <EmptyState icon={Bell} message={t('common.noNotifications')} />
            ) : (
              <div className="space-y-3">
                {(data?.notifications ?? []).slice(0, 5).map((n) => (
                  <div key={n._id} className="flex items-start gap-3 rounded-xl border p-3">
                    <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${n.read ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                      <Bell className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground/70">{relativeTime(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card className="lg:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t('barbers.recentTx')}</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/transactions">
                {t('common.viewAll')} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full" />
                ))}
              </div>
            ) : (data?.recentTransactions ?? []).length === 0 ? (
              <EmptyState icon={ReceiptText} message={t('dashboard.noTransactions')} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.customer')}</TableHead>
                    <TableHead>{t('business.barberShare')}</TableHead>
                    <TableHead>{t('business.managerShare')}</TableHead>
                    <TableHead>{t('common.total')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('common.date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.recentTransactions ?? []).map((tx) => (
                    <TableRow key={tx._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tx.customerName || '—'}</p>
                          <p className="text-xs text-muted-foreground">
                            {typeof tx.barber === 'object' && tx.barber ? tx.barber.name : tx.barberName || ''}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(tx.barberShare)}</TableCell>
                      <TableCell className="text-emerald-600 dark:text-emerald-400">{formatCurrency(tx.managerShare)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(tx.totalAmount)}</TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatDate(tx.createdAt)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top barbers */}
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t('business.topBarbers')}</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/barbers">
                {t('common.viewAll')} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (data?.topBarbers ?? []).length === 0 ? (
              <EmptyState icon={Users} message={t('dashboard.noBarbers')} />
            ) : (
              <div className="space-y-3">
                {(data?.topBarbers ?? []).map((b, i) => (
                  <div key={b._id} className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{b.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.transactionCount} {t('dashboard.transactions')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(b.barberShare)}</p>
                      <Badge variant="outline" className="mt-0.5 text-[10px]">
                        {t('business.barberShare')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
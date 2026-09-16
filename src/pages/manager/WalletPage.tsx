import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Wallet as WalletIcon, Scissors, Banknote as CashIcon, Timer, TrendingUp, Coins, Send, Landmark, Users, HandCoins, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '@/lib/api';
import type { WalletSummary } from '@/lib/types';
import { formatCurrency, formatDate, paymentMethodLabel } from '@/lib/utils';
import { PageHeader, StatCard, SectionCard } from '@/components/shared/cards';
import { EmptyState, LoadingRows } from '@/components/shared/state';
import { MobileCards } from '@/components/shared/mobile-cards';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function WalletPage() {
  const { t } = useLanguage();
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await api.get('/wallet', { params: { force: 'true' } });
      return res.data.data as { wallet: WalletSummary; recentPayouts: any[] };
    },
  });

  const w = data?.wallet;

  return (
    <div>
      <PageHeader
        title={t('nav.wallet')}
        description={t('wallet.subtitle')}
        icon={WalletIcon}
        actions={
          <Button variant="outline" onClick={() => void refetch()} disabled={isRefetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            {t('wallet.refresh')}
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t('wallet.managerIncome')} icon={WalletIcon} value={formatCurrency(w?.totalManagerEarnings)} loading={isLoading} hint={`${t('wallet.percent')} 60%`} accent="success" />
        <StatCard title={t('wallet.barberEarnings')} icon={Scissors} value={formatCurrency(w?.totalBarberEarnings)} loading={isLoading} hint={`${t('wallet.percent')} 40%`} accent="primary" />
        <StatCard title={t('wallet.currentBalance')} icon={CashIcon} value={formatCurrency(w?.currentBalance)} loading={isLoading} hint={t('wallet.balanceHint')} accent="info" />
        <StatCard title={t('wallet.unpaidBarber')} icon={Timer} value={formatCurrency(w?.unpaidBarberEarnings)} loading={isLoading} accent="warning" />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t('wallet.volume')} icon={TrendingUp} value={formatCurrency(w?.totalTransactionVolume)} loading={isLoading} hint={`${w?.totalTransactions ?? 0} ${t('dashboard.transactions')}`} />
        <StatCard title={t('wallet.moneyReceived')} icon={Coins} value={formatCurrency(w?.totalMoneyReceived)} loading={isLoading} accent="info" />
        <StatCard title={t('wallet.paidToBarbers')} icon={Send} value={formatCurrency(w?.totalPaidToBarbers)} loading={isLoading} accent="success" />
        <StatCard title={t('wallet.loanRepayments')} icon={Landmark} value={formatCurrency(w?.totalLoanRepayments)} loading={isLoading} accent="warning" />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard title={t('business.activeBarbers')} icon={Users} value={String(w?.activeBarbers ?? 0)} loading={isLoading} accent="success" />
        <StatCard title={t('business.outstandingLoans')} icon={HandCoins} value={formatCurrency(w?.totalOutstandingLoans)} loading={isLoading} hint={`${w?.loanCount ?? 0} ${t('loans.active')}`} accent="danger" />
      </div>

      <SectionCard
        title={t('wallet.recentPayouts')}
        icon={Send}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link to="/barbers">
              {t('wallet.manageBarbers')} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        }
        bodyClassName="p-0"
      >
        {isLoading ? (
          <div className="p-5">
            <LoadingRows rows={4} />
          </div>
        ) : (data?.recentPayouts ?? []).length === 0 ? (
          <EmptyState icon={Send} message={t('wallet.noPayouts')} />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('barbers.name')}</TableHead>
                    <TableHead>{t('common.method')}</TableHead>
                    <TableHead>{t('wallet.amount')}</TableHead>
                    <TableHead>{t('common.date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.recentPayouts ?? []).map((p) => (
                    <TableRow key={p._id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{typeof p.barber === 'object' && p.barber ? p.barber.name : '—'}</TableCell>
                      <TableCell>{paymentMethodLabel(p.method)}</TableCell>
                      <TableCell className="font-semibold tabular-nums">{formatCurrency(p.amount)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <MobileCards
              className="bg-card"
              items={data?.recentPayouts ?? []}
              render={(p) => (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{typeof p.barber === 'object' && p.barber ? p.barber.name : '—'}</p>
                    <p className="text-xs text-muted-foreground">{paymentMethodLabel(p.method)} · {formatDate(p.createdAt)}</p>
                  </div>
                  <p className="font-semibold tabular-nums">{formatCurrency(p.amount)}</p>
                </div>
              )}
            />
          </>
        )}
      </SectionCard>
    </div>
  );
}
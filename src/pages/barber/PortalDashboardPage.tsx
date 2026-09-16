import { useQuery } from '@tanstack/react-query';
import { Wallet, TrendingUp, Timer, Landmark, ReceiptText, HandCoins, Scissors } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { Transaction } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PageHeader, StatCard, SectionCard } from '@/components/shared/cards';
import { EmptyState, LoadingRows } from '@/components/shared/state';
import { MobileCards } from '@/components/shared/mobile-cards';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PortalDashboardPage() {
  const { t } = useLanguage();
  const { barber } = useAuth();

  const { data: me } = useQuery({
    queryKey: ['portal-me'],
    queryFn: async () => {
      const res = await api.get('/portal/me');
      return res.data.data as {
        barber: { _id: string; name: string; phone: string; role: string };
        summary: { transactionCount: number; transactionVolume: number; grossEarnings: number; paidOut: number; netEarnings: number; outstandingLoans: number };
      };
    },
  });

  const { data: txns } = useQuery({
    queryKey: ['portal-transactions'],
    queryFn: async () => {
      const res = await api.get('/portal/transactions');
      return res.data.data as { transactions: Transaction[] };
    },
  });

  const { data: loans } = useQuery({
    queryKey: ['portal-loans'],
    queryFn: async () => {
      const res = await api.get('/portal/loans');
      return res.data.data as { loans: any[]; repayments: any[] };
    },
  });

  const summary = me?.summary;
  const loading = !me;

  return (
    <div>
      <PageHeader
        title={t('portal.dashboard')}
        description={`${barber?.name} · ${barber?.phone}`}
        icon={Scissors}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t('portal.netEarnings')} icon={Wallet} value={formatCurrency(summary?.netEarnings)} loading={loading} hint={t('portal.netEarningsHint')} accent="success" />
        <StatCard title={t('portal.grossEarnings')} icon={TrendingUp} value={formatCurrency(summary?.grossEarnings)} loading={loading} hint={`${summary?.transactionCount ?? 0} ${t('dashboard.transactions')}`} accent="primary" />
        <StatCard title={t('portal.paidOut')} icon={Timer} value={formatCurrency(summary?.paidOut)} loading={loading} accent="info" />
        <StatCard title={t('portal.outstandingLoans')} icon={Landmark} value={formatCurrency(summary?.outstandingLoans)} loading={loading} accent="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title={t('portal.myTransactions')} icon={ReceiptText} bodyClassName="p-0">
          {!txns ? (
            <div className="p-5">
              <LoadingRows rows={5} />
            </div>
          ) : txns.transactions.length === 0 ? (
            <EmptyState icon={ReceiptText} message={t('common.noData')} />
          ) : (
            <>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.customer')}</TableHead>
                    <TableHead>{t('transactions.service')}</TableHead>
                    <TableHead>{t('portal.yourShare')}</TableHead>
                    <TableHead>{t('common.total')}</TableHead>
                    <TableHead>{t('common.date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txns.transactions.map((tx) => (
                    <TableRow key={tx._id} className="hover:bg-muted/50">
                      <TableCell>{tx.customerName || '—'}</TableCell>
                      <TableCell>{tx.service || '—'}</TableCell>
                      <TableCell className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(tx.barberShare)}</TableCell>
                      <TableCell className="tabular-nums">{formatCurrency(tx.totalAmount)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <MobileCards
              className="bg-card"
              items={txns.transactions}
              render={(tx) => (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{tx.customerName || '—'}</p>
                    <p className="truncate text-xs text-muted-foreground">{tx.service || '—'} · {formatDate(tx.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(tx.barberShare)}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">{formatCurrency(tx.totalAmount)}</p>
                  </div>
                </div>
              )}
            />
          </>
        )}
        </SectionCard>

        <SectionCard title={t('portal.myLoans')} icon={HandCoins} bodyClassName="p-0">
          {!loans ? (
            <div className="p-5">
              <LoadingRows rows={5} />
            </div>
          ) : loans.loans.length === 0 ? (
            <EmptyState icon={HandCoins} message={t('common.noData')} />
          ) : (
            <>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('loans.amount')}</TableHead>
                    <TableHead>{t('loans.reason')}</TableHead>
                    <TableHead>{t('loans.outstanding')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('common.date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.loans.map((l) => (
                    <TableRow key={l._id} className="hover:bg-muted/50">
                      <TableCell className="font-medium tabular-nums">{formatCurrency(l.amount)}</TableCell>
                      <TableCell>{l.reason || '—'}</TableCell>
                      <TableCell className="font-semibold tabular-nums">{formatCurrency(l.outstandingAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={l.status === 'active' ? 'warning' : 'success'}>{t(`loans.${l.status}`)}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(l.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <MobileCards
              className="bg-card"
              items={loans.loans}
              render={(l) => (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium tabular-nums">{formatCurrency(l.amount)}</p>
                    <p className="truncate text-xs text-muted-foreground">{l.reason || '—'} · {formatDate(l.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={l.status === 'active' ? 'warning' : 'success'}>{t(`loans.${l.status}`)}</Badge>
                    <p className="mt-1 font-semibold tabular-nums">{formatCurrency(l.outstandingAmount)}</p>
                  </div>
                </div>
              )}
            />
          </>
        )}
        </SectionCard>
      </div>
    </div>
  );
}


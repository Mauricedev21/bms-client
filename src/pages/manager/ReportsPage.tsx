import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileDown, FileBarChart, RefreshCw, TrendingUp, Wallet, Scissors, ReceiptText, Landmark, HandCoins } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { api, errorMessage } from '@/lib/api';
import type { Paginated, ReportRecord } from '@/lib/types';
import { formatCurrency, formatDate, formatDateOnly } from '@/lib/utils';
import { PageHeader, StatCard, SectionCard } from '@/components/shared/cards';
import { EmptyState, LoadingRows } from '@/components/shared/state';
import { MobileCards } from '@/components/shared/mobile-cards';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const REPORT_TYPES = ['daily', 'weekly', 'monthly', 'six_month', 'annual', 'custom'] as const;

function ReportDownloadButton({ report }: { report: ReportRecord }) {
  const { t } = useLanguage();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() =>
        api.get('/reports/generate', { params: { type: report.reportType, download: 'true' } }).then((res) => {
          const contentType = String(res.headers['content-type'] ?? '');
          if (contentType.includes('csv')) {
            const blob = new Blob([res.data], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report-${report.reportType}-${report._id}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }
        })
      }
      title={t('reports.download')}
    >
      <FileDown className="h-4 w-4" />
    </Button>
  );
}

export default function ReportsPage() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [type, setType] = useState<string>('monthly');
  const [date, setDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generated, setGenerated] = useState<{ report: ReportRecord; csv: string } | null>(null);
  const [page, setPage] = useState(1);

  const { data: listData, isLoading } = useQuery({
    queryKey: ['reports', page],
    queryFn: async () => {
      const res = await api.get('/reports', { params: { page, limit: 10 } });
      return res.data.data as Paginated<ReportRecord>;
    },
  });

  const generate = useMutation({
    mutationFn: async () => {
      const params: Record<string, string> = { type };
      if (type === 'custom') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      } else if (date) {
        params.date = date;
      }
      const res = await api.get('/reports/generate', { params });
      return res.data.data as { report: ReportRecord; csv: string };
    },
    onSuccess: (d) => {
      setGenerated(d);
      toast.success(t('reports.generated'));
      void qc.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const download = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCurrent = () => {
    if (!generated) return;
    download(generated.csv, `report-${generated.report.reportType}-${Date.now()}.csv`);
  };

  const r = generated?.report;

  return (
    <div>
      <PageHeader title={t('nav.reports')} description={t('reports.subtitle')} icon={FileBarChart} />

      <SectionCard title={t('reports.generateTitle')} description={t('reports.generateHint')} icon={RefreshCw} className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label className="text-xs text-muted-foreground">{t('reports.period')}</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((rt) => (
                  <SelectItem key={rt} value={rt}>{t(`reports.${rt}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {type !== 'custom' ? (
            <div>
              <Label className="text-xs text-muted-foreground">{t('reports.referenceDate')}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          ) : (
            <>
              <div>
                <Label className="text-xs text-muted-foreground">{t('reports.from')}</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t('reports.to')}</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </>
          )}
          <div className="flex items-end">
            <Button onClick={() => generate.mutate()} disabled={generate.isPending} className="w-full">
              <RefreshCw className={`mr-2 h-4 w-4 ${generate.isPending ? 'animate-spin' : ''}`} />
              {generate.isPending ? t('common.loading') : t('reports.generate')}
            </Button>
          </div>
          {generated ? (
            <div className="flex items-end">
              <Button variant="outline" onClick={downloadCurrent} className="w-full">
                <FileDown className="mr-2 h-4 w-4" />
                {t('reports.download')}
              </Button>
            </div>
          ) : null}
        </div>
      </SectionCard>

      {r ? (
        <SectionCard
          title={`${t('reports.resultFor')} ${r.title}`}
          description={`${formatDateOnly(r.periodStart)} → ${formatDateOnly(r.periodEnd)}`}
          icon={FileBarChart}
          className="mb-6"
        >
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard title={t('wallet.volume')} icon={TrendingUp} value={formatCurrency(r.totals.transactionVolume)} />
            <StatCard title={t('business.managerShare')} icon={Wallet} value={formatCurrency(r.totals.managerEarnings)} accent="success" />
            <StatCard title={t('business.barberShare')} icon={Scissors} value={formatCurrency(r.totals.barberEarnings)} />
            <StatCard title={t('dashboard.transactions')} icon={ReceiptText} value={String(r.totals.transactionCount)} />
            <StatCard title={t('wallet.loanRepayments')} icon={Landmark} value={formatCurrency(r.totals.loanRepaymentsReceived)} accent="info" />
            <StatCard title={t('business.outstandingLoans')} icon={HandCoins} value={formatCurrency(r.totals.outstandingLoans)} accent="warning" />
          </div>
          {r.perBarber.length > 0 ? (
            <div>
              <h4 className="mb-2 text-sm font-medium">{t('reports.perBarber')}</h4>
              <div className="hidden overflow-x-auto rounded-xl border md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('barbers.name')}</TableHead>
                      <TableHead>{t('dashboard.transactions')}</TableHead>
                      <TableHead>{t('wallet.volume')}</TableHead>
                      <TableHead>{t('business.managerShare')}</TableHead>
                      <TableHead>{t('business.barberShare')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {r.perBarber.map((b) => (
                      <TableRow key={b.barber} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell className="tabular-nums">{b.transactionCount}</TableCell>
                        <TableCell className="tabular-nums">{formatCurrency(b.transactionVolume)}</TableCell>
                        <TableCell className="tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(b.managerShare)}</TableCell>
                        <TableCell className="tabular-nums">{formatCurrency(b.barberShare)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <MobileCards
                className="divide-y divide-border rounded-xl border md:hidden"
                items={r.perBarber}
                render={(b) => (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{b.name}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">{b.transactionCount} {t('dashboard.transactions')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">{formatCurrency(b.barberShare)}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(b.managerShare)}</p>
                    </div>
                  </div>
                )}
              />
            </div>
          ) : null}
        </SectionCard>
      ) : null}

      <SectionCard title={t('reports.recent')} icon={ReceiptText} bodyClassName="p-0">
        {isLoading ? (
          <div className="p-5">
            <LoadingRows rows={5} />
          </div>
        ) : (listData?.items ?? []).length === 0 ? (
          <EmptyState icon={FileBarChart} message={t('reports.empty')} />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports.title')}</TableHead>
                    <TableHead>{t('common.date')}</TableHead>
                    <TableHead>{t('wallet.volume')}</TableHead>
                    <TableHead>{t('business.managerShare')}</TableHead>
                    <TableHead className="text-right">{t('reports.download')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(listData?.items ?? []).map((rep) => (
                    <TableRow key={rep._id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{rep.title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(rep.generatedAt)}</TableCell>
                      <TableCell className="tabular-nums">{formatCurrency(rep.totals.transactionVolume)}</TableCell>
                      <TableCell className="tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(rep.totals.managerEarnings)}</TableCell>
                      <TableCell className="text-right">
                        <ReportDownloadButton report={rep} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <MobileCards
              className="bg-card"
              items={listData?.items ?? []}
              render={(rep) => (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{rep.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(rep.generatedAt)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                      {formatCurrency(rep.totals.transactionVolume)}
                      <span className="text-emerald-600 dark:text-emerald-400"> · {formatCurrency(rep.totals.managerEarnings)}</span>
                    </p>
                  </div>
                  <ReportDownloadButton report={rep} />
                </div>
              )}
            />
            {listData && listData.pages > 1 ? (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t('common.prev')}</Button>
                <span className="text-sm text-muted-foreground">{t('common.page')} {page} / {listData.pages}</span>
                <Button variant="outline" size="sm" disabled={page >= listData.pages} onClick={() => setPage((p) => p + 1)}>{t('common.next')}</Button>
              </div>
            ) : null}
          </>
        )}
      </SectionCard>
    </div>
  );
}
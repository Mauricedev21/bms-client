import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, HandCoins, Banknote, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { api, errorMessage } from '@/lib/api';
import type { Barber, LoanRecord, Paginated } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PageHeader, StatCard } from '@/components/shared/cards';
import { EmptyState, LoadingRows } from '@/components/shared/state';
import { DialogShell } from '@/components/shared/dialogs';
import { MobileCards } from '@/components/shared/mobile-cards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

export default function LoansPage() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [repayTarget, setRepayTarget] = useState<LoanRecord | null>(null);
  const [filters, setFilters] = useState({ barber: '', status: '' });
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading } = useQuery({
    queryKey: ['loans', filters, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit };
      if (filters.barber) params.barber = filters.barber;
      if (filters.status) params.status = filters.status;
      const res = await api.get('/loans', { params });
      return res.data.data as Paginated<LoanRecord>;
    },
  });

  const loans = data?.items ?? [];

  const { data: barbersData } = useQuery({
    queryKey: ['barbers'],
    queryFn: async () => {
      const res = await api.get('/barbers');
      return res.data.data as { barbers: Barber[] };
    },
  });

  const invalidateAll = () => {
    void qc.invalidateQueries({ queryKey: ['loans'] });
    void qc.invalidateQueries({ queryKey: ['wallet'] });
    void qc.invalidateQueries({ queryKey: ['dashboard'] });
    void qc.invalidateQueries({ queryKey: ['barbers'] });
  };

  const activeBarbers = useMemo(() => (barbersData?.barbers ?? []).filter((b) => b.status === 'active'), [barbersData]);

  const totals = useMemo(() => {
    const items = data?.items ?? [];
    return {
      outstanding: items.reduce((s, l) => s + l.outstandingAmount, 0),
      counts: items.filter((l) => l.status === 'active').length,
    };
  }, [data]);

  return (
    <div>
      <PageHeader
        title={t('nav.loans')}
        description={t('loans.subtitle')}
        icon={HandCoins}
        actions={
          <Button onClick={() => setCreateOpen(true)} disabled={activeBarbers.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            {t('loans.new')}
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard title={t('loans.currentOutstanding')} icon={HandCoins} value={formatCurrency(totals.outstanding)} loading={isLoading} accent="warning" />
        <StatCard title={t('loans.activeOnPage')} icon={Banknote} value={String(totals.counts)} loading={isLoading} accent="primary" />
      </div>

      <Card className="card-shadow mb-6">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs text-muted-foreground">{t('barbers.name')}</Label>
            <Select value={filters.barber} onValueChange={(v) => { setFilters((f) => ({ ...f, barber: v })); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('common.all')}</SelectItem>
                {(barbersData?.barbers ?? []).map((b) => (
                  <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">{t('common.status')}</Label>
            <Select value={filters.status} onValueChange={(v) => { setFilters((f) => ({ ...f, status: v })); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('common.all')}</SelectItem>
                <SelectItem value="active">{t('loans.active')}</SelectItem>
                <SelectItem value="settled">{t('loans.settled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="card-shadow overflow-hidden">
        <CardContent className="p-0">
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('barbers.name')}</TableHead>
                  <TableHead>{t('common.date')}</TableHead>
                  <TableHead>{t('loans.amount')}</TableHead>
                  <TableHead>{t('loans.repaid')}</TableHead>
                  <TableHead>{t('loans.outstanding')}</TableHead>
                  <TableHead>{t('loans.progress')}</TableHead>
                  <TableHead>{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10">
                      <LoadingRows rows={5} />
                    </TableCell>
                  </TableRow>
                ) : loans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <EmptyState icon={HandCoins} message={t('loans.empty')} />
                    </TableCell>
                  </TableRow>
                ) : (
                  loans.map((l) => {
                    const pct = l.amount > 0 ? Math.min(100, Math.round((l.totalRepaid / l.amount) * 100)) : 0;
                    return (
                      <TableRow key={l._id} className="hover:bg-muted/50">
                        <TableCell>
                          <p className="font-medium">{typeof l.barber === 'object' && l.barber ? l.barber.name : '—'}</p>
                          {l.reason ? <p className="text-xs text-muted-foreground">{l.reason}</p> : null}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3" />{formatDate(l.createdAt)}</span>
                        </TableCell>
                        <TableCell className="font-medium tabular-nums">{formatCurrency(l.amount)}</TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">{formatCurrency(l.totalRepaid)}</TableCell>
                        <TableCell>
                          <span className={l.outstandingAmount > 0 ? 'font-semibold tabular-nums text-destructive' : 'font-semibold tabular-nums text-emerald-600 dark:text-emerald-400'}>
                            {formatCurrency(l.outstandingAmount)}
                          </span>
                        </TableCell>
                        <TableCell className="min-w-32">
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className="h-1.5" />
                            <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={l.status === 'active' ? 'warning' : 'success'}>{t(`loans.${l.status}`)}</Badge>
                            {l.status === 'active' ? (
                              <Button size="sm" variant="outline" onClick={() => setRepayTarget(l)}>
                                <Banknote className="mr-1 h-3.5 w-3.5" />
                                {t('loans.repay')}
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <MobileCards
            className="bg-card"
            items={loans}
            render={(l) => {
              const pct = l.amount > 0 ? Math.min(100, Math.round((l.totalRepaid / l.amount) * 100)) : 0;
              return (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{typeof l.barber === 'object' && l.barber ? l.barber.name : '—'}</p>
                      {l.reason ? <p className="truncate text-xs text-muted-foreground">{l.reason}</p> : null}
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3" />{formatDate(l.createdAt)}</p>
                    </div>
                    <Badge variant={l.status === 'active' ? 'warning' : 'success'}>{t(`loans.${l.status}`)}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-muted/50 px-2 py-2">
                      <p className="text-muted-foreground">{t('loans.amount')}</p>
                      <p className="font-semibold tabular-nums">{formatCurrency(l.amount)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 px-2 py-2">
                      <p className="text-muted-foreground">{t('loans.repaid')}</p>
                      <p className="tabular-nums">{formatCurrency(l.totalRepaid)}</p>
                    </div>
                    <div className="rounded-lg px-2 py-2">
                      <p className="text-muted-foreground">{t('loans.outstanding')}</p>
                      <p className={`font-semibold tabular-nums ${l.outstandingAmount > 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>{formatCurrency(l.outstandingAmount)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={pct} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
                  </div>
                  {l.status === 'active' ? (
                    <Button size="sm" variant="outline" className="w-full" onClick={() => setRepayTarget(l)}>
                      <Banknote className="mr-1 h-3.5 w-3.5" />
                      {t('loans.repay')}
                    </Button>
                  ) : null}
                </div>
              );
            }}
          />

          {isLoading && loans.length === 0 ? (
            <div className="md:hidden"><LoadingRows rows={4} /></div>
          ) : loans.length === 0 ? (
            <div className="md:hidden"><EmptyState icon={HandCoins} message={t('loans.empty')} /></div>
          ) : null}
          {data && data.pages > 1 ? (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t('common.prev')}</Button>
              <span className="text-sm text-muted-foreground">{t('common.page')} {page} / {data.pages}</span>
              <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>{t('common.next')}</Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <CreateLoanDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        barbers={activeBarbers}
        onDone={invalidateAll}
      />

      {repayTarget && (
        <RepayDialog loan={repayTarget} onClose={() => setRepayTarget(null)} onDone={invalidateAll} />
      )}
    </div>
  );
}

function CreateLoanDialog({
  open,
  onOpenChange,
  barbers,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  barbers: Barber[];
  onDone: () => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState({ barber: '', amount: '', reason: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.barber) return;
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(t('loans.invalidAmount'));
      return;
    }
    setBusy(true);
    try {
      await api.post('/loans', { barber: form.barber, amount, reason: form.reason });
      toast.success(t('loans.created'));
      setForm({ barber: '', amount: '', reason: '' });
      onOpenChange(false);
      onDone();
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <DialogShell open={open} onOpenChange={onOpenChange} title={t('loans.new')} description={t('loans.formHint')}>
      <form onSubmit={submit} className="grid gap-4">
        <div className="space-y-2">
          <Label>{t('barbers.name')} *</Label>
          <Select value={form.barber} onValueChange={(v) => setForm((f) => ({ ...f, barber: v }))}>
            <SelectTrigger>
              <SelectValue placeholder={t('transactions.selectBarber')} />
            </SelectTrigger>
            <SelectContent>
              {barbers.map((b) => (
                <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t('loans.amount')} (RWF) *</Label>
          <Input inputMode="decimal" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value.replace(/[^\d.]/g, '') }))} required />
        </div>
        <div className="space-y-2">
          <Label>{t('loans.reason')}</Label>
          <Input value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder={t('loans.reasonPlaceholder')} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={busy}>{busy ? t('common.loading') : t('loans.issue')}</Button>
        </DialogFooter>
      </form>
    </DialogShell>
  );
}

function RepayDialog({ loan, onClose, onDone }: { loan: LoanRecord; onClose: () => void; onDone: () => void }) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [remark, setRemark] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    if (value > loan.outstandingAmount) {
      toast.error(t('loans.repayExceeds'));
      return;
    }
    setBusy(true);
    try {
      const res = await api.post(`/loans/${loan._id}/repay`, { amount: value, method, remark });
      const loanAfter = res.data.data.loan as { status: string };
      toast.success(loanAfter.status === 'settled' ? t('loans.settledNow') : t('loans.repaidNow'));
      onClose();
      onDone();
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <DialogShell
      open
      onOpenChange={(o) => { if (!o) onClose(); }}
      title={t('loans.repayTitle')}
      description={<>{typeof loan.barber === 'object' && loan.barber ? loan.barber.name : '—'} · {t('loans.outstanding')}: <b>{formatCurrency(loan.outstandingAmount)}</b></>}
    >
      <form onSubmit={submit} className="grid gap-4">
        <div className="space-y-2">
          <Label>{t('loans.amount')} (RWF) *</Label>
          <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} required />
        </div>
        <div className="space-y-2">
          <Label>{t('common.method')}</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['cash', 'mobile_money', 'card', 'bank_transfer', 'from_earnings', 'other'].map((m) => (
                <SelectItem key={m} value={m}>{m.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t('loans.remark')}</Label>
          <Input value={remark} onChange={(e) => setRemark(e.target.value)} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={busy}>{busy ? t('common.loading') : t('loans.repay')}</Button>
        </DialogFooter>
      </form>
    </DialogShell>
  );
}
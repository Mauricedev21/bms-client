import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, Ban, ReceiptText, SearchX, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { api, errorMessage } from '@/lib/api';
import type { Barber, Paginated, Transaction } from '@/lib/types';
import { formatCurrency, formatDate, PAYMENT_METHODS, paymentMethodLabel, uid } from '@/lib/utils';
import { PageHeader } from '@/components/shared/cards';
import { EmptyState, LoadingRows } from '@/components/shared/state';
import { StatusBadge } from '@/components/shared/status-badge';
import { DialogShell } from '@/components/shared/dialogs';
import { MobileCards } from '@/components/shared/mobile-cards';
import { SectionCard } from '@/components/shared/cards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function TransactionsPage() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<Transaction | null>(null);
  const [voidTarget, setVoidTarget] = useState<Transaction | null>(null);
  const [filters, setFilters] = useState({ barber: '', method: '', status: '', search: '' });
  const [page, setPage] = useState(1);
  const limit = 12;

  const queryKey = ['transactions', filters, page];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit };
      if (filters.barber) params.barber = filters.barber;
      if (filters.method) params.paymentMethod = filters.method;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      const res = await api.get('/transactions', { params });
      return res.data.data as Paginated<Transaction>;
    },
  });

  const txns = data?.items ?? [];

  const { data: barbersData } = useQuery({
    queryKey: ['barbers'],
    queryFn: async () => {
      const res = await api.get('/barbers');
      return res.data.data as { barbers: Barber[] };
    },
  });

  const invalidateAll = () => {
    void qc.invalidateQueries({ queryKey: ['transactions'] });
    void qc.invalidateQueries({ queryKey: ['wallet'] });
    void qc.invalidateQueries({ queryKey: ['dashboard'] });
    void qc.invalidateQueries({ queryKey: ['barbers'] });
  };

  const voidMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await api.delete(`/transactions/${id}`, { data: { reason } });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success(t('transactions.voided'));
      setVoidTarget(null);
      invalidateAll();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const activeBarbers = useMemo(() => (barbersData?.barbers ?? []).filter((b) => b.status === 'active'), [barbersData]);

  return (
    <div>
      <PageHeader
        title={t('nav.transactions')}
        description={t('transactions.subtitle')}
        icon={ReceiptText}
        actions={
          <Button onClick={() => setCreateOpen(true)} disabled={activeBarbers.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            {t('transactions.new')}
          </Button>
        }
      />

      <SectionCard title={t('common.select')} description={t('transactions.searchHint')} bodyClassName="p-4" className="mb-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
            <Label className="text-xs text-muted-foreground">{t('common.method')}</Label>
            <Select value={filters.method} onValueChange={(v) => { setFilters((f) => ({ ...f, method: v })); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('common.all')}</SelectItem>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{paymentMethodLabel(m.value)}</SelectItem>
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
                <SelectItem value="completed">{t('transactions.completed')}</SelectItem>
                <SelectItem value="voided">{t('transactions.voided')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs text-muted-foreground">{t('common.search')}</Label>
            <Input
              value={filters.search}
              onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1); }}
              placeholder={t('transactions.searchHint')}
            />
          </div>
        </div>
      </SectionCard>

      <Card className="card-shadow overflow-hidden">
        <CardContent className="p-0">
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.customer')}</TableHead>
                  <TableHead>{t('barbers.name')}</TableHead>
                  <TableHead>{t('common.total')}</TableHead>
                  <TableHead>{t('business.managerShare')}</TableHead>
                  <TableHead>{t('business.barberShare')}</TableHead>
                  <TableHead>{t('common.method')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead>{t('common.date')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={9} className="py-10"><LoadingRows rows={5} /></TableCell></TableRow>
                ) : txns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <EmptyState icon={SearchX} message={t('transactions.empty')} />
                    </TableCell>
                  </TableRow>
                ) : (
                  txns.map((tx) => (
                    <TableRow key={tx._id} className={`hover:bg-muted/50 ${tx.status === 'voided' ? 'opacity-50' : ''}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tx.customerName || '—'}</p>
                          {tx.service ? <p className="text-xs text-muted-foreground">{tx.service}</p> : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        {typeof tx.barber === 'object' && tx.barber ? tx.barber.name : tx.barberName || '—'}
                      </TableCell>
                      <TableCell className="font-semibold tabular-nums">{formatCurrency(tx.totalAmount)}</TableCell>
                      <TableCell className="tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(tx.managerShare)}</TableCell>
                      <TableCell className="tabular-nums">{formatCurrency(tx.barberShare)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{paymentMethodLabel(tx.paymentMethod)}</Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={tx.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="size-3" />{formatDate(tx.createdAt)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => setDetail(tx)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {tx.status === 'completed' && (
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => setVoidTarget(tx)}>
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <MobileCards
            className="bg-card"
            items={txns}
            render={(tx) => (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{tx.customerName || '—'}</p>
                    <p className="text-xs text-muted-foreground">
                      {typeof tx.barber === 'object' && tx.barber ? tx.barber.name : tx.barberName || '—'}
                      {tx.service ? ` · ${tx.service}` : ''}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="px-1.5 py-0 text-[10px]">{paymentMethodLabel(tx.paymentMethod)}</Badge>
                      <StatusBadge status={tx.status} />
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold tabular-nums">{formatCurrency(tx.totalAmount)}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(tx.managerShare)}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">{formatCurrency(tx.barberShare)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3" />{formatDate(tx.createdAt)}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setDetail(tx)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {tx.status === 'completed' && (
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => setVoidTarget(tx)}>
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          />

          {isLoading && txns.length === 0 ? (
            <div className="md:hidden"><LoadingRows rows={4} /></div>
          ) : txns.length === 0 ? (
            <div className="md:hidden"><EmptyState icon={SearchX} message={t('transactions.empty')} /></div>
          ) : null}

          {data && data.pages > 1 ? (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                {t('common.prev')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('common.page')} {page} / {data.pages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
                {t('common.next')}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <CreateTransactionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        barbers={activeBarbers}
        onDone={invalidateAll}
      />

      {detail && (
        <DialogShell open onOpenChange={(o) => { if (!o) setDetail(null); }} title={t('transactions.detail')} description={formatDate(detail.createdAt)}>
          <TransactionDetail tx={detail} />
        </DialogShell>
      )}

      <AlertDialog open={Boolean(voidTarget)} onOpenChange={(o) => { if (!o) setVoidTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('transactions.voidTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('transactions.voidHint')}</AlertDialogDescription>
          </AlertDialogHeader>
          <VoidForm onCancel={() => setVoidTarget(null)} onSubmit={(reason) => voidTarget && voidMutation.mutate({ id: voidTarget._id, reason })} busy={voidMutation.isPending} />
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TransactionDetail({ tx }: { tx: Transaction }) {
  const { t } = useLanguage();
  const rows = [
    { label: t('common.customer'), value: tx.customerName || '—' },
    { label: t('nav.barbers'), value: typeof tx.barber === 'object' && tx.barber ? tx.barber.name : tx.barberName || '—' },
    { label: t('common.method'), value: paymentMethodLabel(tx.paymentMethod) },
    { label: t('common.total'), value: formatCurrency(tx.totalAmount), bold: true },
    { label: `${t('business.managerShare')} (${tx.managerPercent}%)`, value: formatCurrency(tx.managerShare), accent: 'text-emerald-600 dark:text-emerald-400 font-bold' },
    { label: `${t('business.barberShare')} (${tx.barberPercent}%)`, value: formatCurrency(tx.barberShare), accent: 'font-bold' },
    { label: t('common.status'), value: tx.status },
  ];
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between rounded-xl border bg-muted/30 px-3 py-2.5 text-sm">
          <span className="text-muted-foreground">{r.label}</span>
          <span className={r.accent ?? (r.bold ? 'font-semibold tabular-nums' : 'font-medium')}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

function VoidForm({ onCancel, onSubmit, busy }: { onCancel: () => void; onSubmit: (reason: string) => void; busy: boolean }) {
  const { t } = useLanguage();
  const [reason, setReason] = useState('');
  return (
    <AlertDialogFooter className="flex-col gap-2">
      <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('transactions.reason')} />
      <div className="flex gap-2 sm:justify-end">
        <AlertDialogCancel onClick={onCancel}>{t('common.cancel')}</AlertDialogCancel>
        <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => onSubmit(reason)} disabled={busy}>
          {busy ? t('common.loading') : t('transactions.void')}
        </AlertDialogAction>
      </div>
    </AlertDialogFooter>
  );
}

function CreateTransactionDialog({
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
  const [form, setForm] = useState({ barber: '', totalAmount: '', method: 'cash', service: '', description: '' });
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<number | null>(null);

  const selectedBarber = barbers.find((b) => b._id === form.barber);
  const autoService = selectedBarber?.specializations?.[0] ?? '';

  const total = Number(form.totalAmount);
  const managerShare = Number.isFinite(total) ? Math.round(total * 60) / 100 : null;
  const barberShare = Number.isFinite(total) ? Math.round(total * 100) / 100 - (managerShare ?? 0) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.barber) return;
    if (!Number.isFinite(total) || total <= 0) {
      toast.error(t('transactions.invalidAmount'));
      return;
    }
    setBusy(true);
    try {
      await api.post('/transactions', {
        barber: form.barber,
        totalAmount: total,
        paymentMethod: form.method,
        service: autoService,
        description: form.description,
        clientRefId: uid(),
      });
      toast.success(t('transactions.created'));
      setForm({ barber: '', totalAmount: '', method: 'cash', service: '', description: '' });
      setPreview(null);
      onOpenChange(false);
      onDone();
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <DialogShell open={open} onOpenChange={onOpenChange} title={t('transactions.new')} description={t('transactions.splitNote')} className="max-w-2xl">
      <form onSubmit={submit} className="grid gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t('barbers.name')} *</Label>
            <Select value={form.barber} onValueChange={(v) => setForm((f) => ({ ...f, barber: v, service: '' }))}>
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
            <Label>{t('transactions.amount')} (RWF) *</Label>
            <Input
              inputMode="decimal"
              value={form.totalAmount}
              onChange={(e) => { setForm((f) => ({ ...f, totalAmount: e.target.value.replace(/[^\d.]/g, '') })); setPreview(Number(e.target.value)); }}
              placeholder="10000"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t('transactions.service')}</Label>
            <Label className="text-xs font-normal text-muted-foreground">{t('transactions.autoService')}</Label>
            <div className="flex min-h-9 items-center rounded-md border bg-muted/40 px-3 py-2 text-sm text-foreground/90">
              {autoService || <span className="text-xs text-muted-foreground">{t('transactions.selectBarber')}</span>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('common.method')}</Label>
            <Select value={form.method} onValueChange={(v) => setForm((f) => ({ ...f, method: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{paymentMethodLabel(m.value)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t('transactions.description')}</Label>
          <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>

        {preview !== null && Number.isFinite(preview) && preview > 0 ? (
          <div className="grid grid-cols-2 gap-3 rounded-xl border bg-primary/5 p-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t('business.managerShare')} (60%)</p>
              <p className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(managerShare)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('business.barberShare')} (40%)</p>
              <p className="font-bold tabular-nums">{formatCurrency(barberShare)}</p>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={busy || barbers.length === 0}>
            {busy ? t('common.loading') : t('transactions.save')}
          </Button>
        </DialogFooter>
      </form>
    </DialogShell>
  );
}
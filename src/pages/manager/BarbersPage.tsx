import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, Pencil, Trash2, KeyRound, Banknote, UserCheck, UserX, Phone, Mail, Scissors } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { api, errorMessage } from '@/lib/api';
import type { Barber, WalletSummary } from '@/lib/types';
import { formatCurrency, formatDate, initials, uid } from '@/lib/utils';
import { PageHeader, StatCard } from '@/components/shared/cards';
import { EmptyState, LoadingRows } from '@/components/shared/state';
import { StatusBadge } from '@/components/shared/status-badge';
import { ConfirmDialog, DialogShell } from '@/components/shared/dialogs';
import { MobileCards } from '@/components/shared/mobile-cards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type BarberForm = {
  name: string;
  phone: string;
  email: string;
  gender: string;
  role: string;
  specializations: string;
};

const emptyForm: BarberForm = { name: '', phone: '', email: '', gender: '', role: 'Barber', specializations: '' };

function BarberDialog({
  open,
  onOpenChange,
  existing,
  onSubmit,
  busy,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  existing?: Barber | null;
  onSubmit: (form: BarberForm) => Promise<void>;
  busy: boolean;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<BarberForm>(() =>
    existing
      ? {
          name: existing.name,
          phone: existing.phone,
          email: existing.email || '',
          gender: existing.gender || '',
          role: existing.role || 'Barber',
          specializations: (existing.specializations ?? []).join(', '),
        }
      : { ...emptyForm },
  );

  const set = (k: keyof BarberForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <DialogShell open={open} onOpenChange={onOpenChange} title={existing ? t('barbers.edit') : t('barbers.add')} description={t('barbers.formHint')}>
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit(form);
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="b-name">{t('barbers.name')} *</Label>
          <Input id="b-name" value={form.name} onChange={set('name')} required minLength={2} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="b-phone">{t('auth.phone')} *</Label>
            <Input id="b-phone" value={form.phone} onChange={set('phone')} placeholder="+2507xxxxxxxx" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="b-email">{t('auth.email')}</Label>
            <Input id="b-email" type="email" value={form.email} onChange={set('email')} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="b-role">{t('barbers.role')}</Label>
            <Input id="b-role" value={form.role} onChange={set('role')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="b-gender">{t('barbers.gender')}</Label>
            <Select value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}>
              <SelectTrigger id="b-gender">
                <SelectValue placeholder={t('common.select')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">—</SelectItem>
                <SelectItem value="male">{t('barbers.male')}</SelectItem>
                <SelectItem value="female">{t('barbers.female')}</SelectItem>
                <SelectItem value="other">{t('barbers.other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="b-spec">{t('barbers.specializations')}</Label>
          <Input id="b-spec" value={form.specializations} onChange={set('specializations')} placeholder={t('barbers.specPlaceholder')} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? t('common.loading') : t('common.save')}
          </Button>
        </DialogFooter>
      </form>
    </DialogShell>
  );
}

export default function BarbersPage() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Barber | null>(null);
  const [payoutTarget, setPayoutTarget] = useState<Barber | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Barber | null>(null);
  const [pinTarget, setPinTarget] = useState<Barber | null>(null);
  const [detailTarget, setDetailTarget] = useState<Barber | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['barbers'],
    queryFn: async () => {
      const res = await api.get('/barbers');
      return res.data.data as { barbers: Barber[]; walletSummary: WalletSummary };
    },
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['barbers'] });
    void qc.invalidateQueries({ queryKey: ['wallet'] });
    void qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const saveMutation = useMutation({
    mutationFn: async ({ id, form }: { id?: string; form: BarberForm }) => {
      const payload = {
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        gender: form.gender,
        role: form.role,
        specializations: form.specializations.split(',').map((s) => s.trim()).filter(Boolean),
      };
      if (id) {
        const res = await api.patch(`/barbers/${id}`, payload);
        return res.data.data;
      }
      const res = await api.post('/barbers', payload);
      return res.data.data;
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.id ? t('barbers.saved') : t('barbers.added'));
      setDialogOpen(false);
      setEditing(null);
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const pinMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/barbers/${id}/pin`, {});
      return res.data.data as { pin: string };
    },
    onSuccess: (d) => {
      toast.success(`${t('barbers.pinGenerated')}: ${d.pin}`, { duration: 15000 });
      setPinTarget(null);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'inactive' }) => {
      const res = await api.patch(`/barbers/${id}`, { status });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success(t('barbers.statusUpdated'));
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/barbers/${id}`);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success(t('barbers.deleted'));
      setDeleteTarget(null);
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.barbers ?? []).filter((b) => {
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      const matchesSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.phone.includes(q) ||
        (b.specializations ?? []).join(' ').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [data, search, statusFilter]);

  const activeCount = (data?.barbers ?? []).filter((b) => b.status === 'active').length;

  return (
    <div>
      <PageHeader
        title={t('nav.barbers')}
        description={t('barbers.subtitle')}
        icon={Scissors}
        actions={
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            {t('barbers.add')}
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard title={t('business.activeBarbers')} icon={UserCheck} value={String(activeCount)} loading={isLoading} accent="success" />
        <StatCard title={t('business.barberEarnings')} icon={Banknote} value={formatCurrency(data?.walletSummary.totalBarberEarnings)} loading={isLoading} accent="info" />
        <StatCard title={t('barbers.outstanding')} icon={Banknote} value={formatCurrency(data?.walletSummary.totalOutstandingLoans)} loading={isLoading} accent="warning" />
      </div>

      <Card className="card-shadow overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <Input placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'inactive')}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="active">{t('barbers.activate')}</SelectItem>
                  <SelectItem value="inactive">{t('barbers.deactivate')}</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">{filtered.length} {t('common.total')}</span>
            </div>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('barbers.name')}</TableHead>
                  <TableHead>{t('barbers.contact')}</TableHead>
                  <TableHead>{t('business.barberShare')}</TableHead>
                  <TableHead>{t('barbers.available')}</TableHead>
                  <TableHead>{t('barbers.outstanding')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead>{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10">
                      <LoadingRows rows={4} />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <EmptyState icon={UserCheck} message={t('barbers.empty')} />
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((b) => (
                    <TableRow key={b._id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-primary/20 bg-primary/10">
                            <AvatarFallback className="text-xs text-primary">{initials(b.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{b.name}</p>
                            <p className="text-xs text-muted-foreground">{(b.specializations ?? []).join(', ') || b.role}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="flex items-center gap-1 text-sm"><Phone className="size-3 text-muted-foreground" />{b.phone}</p>
                        {b.email ? <p className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="size-3" />{b.email}</p> : null}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium tabular-nums">{formatCurrency(b.stats.barberShare)}</p>
                        <p className="text-xs text-muted-foreground">{b.stats.transactionCount} {t('dashboard.transactions')}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(b.stats.availableEarnings)}</p>
                      </TableCell>
                      <TableCell>
                        <p className={b.stats.outstandingLoans > 0 ? 'font-semibold tabular-nums text-destructive' : 'text-muted-foreground'}>
                          {formatCurrency(b.stats.outstandingLoans)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={b.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => setDetailTarget(b)} title={t('common.edit')}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => { setEditing(b); setDialogOpen(true); }} title={t('common.edit')}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => setPinTarget(b)} title={t('barbers.genPin')}>
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => setPayoutTarget(b)} title={t('barbers.payout')}>
                            <Banknote className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-primary"
                            onClick={() => statusMutation.mutate({ id: b._id, status: b.status === 'active' ? 'inactive' : 'active' })}
                            title={b.status === 'active' ? t('barbers.deactivate') : t('barbers.activate')}
                          >
                            {b.status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                          {b.stats.transactionCount === 0 && b.stats.activeLoans === 0 ? (
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(b)} title={t('common.delete')}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : null}
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
            items={filtered}
            render={(b) => (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-9 w-9 border border-primary/20 bg-primary/10">
                      <AvatarFallback className="text-xs text-primary">{initials(b.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium">{b.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{(b.specializations ?? []).join(', ') || b.role}</p>
                    </div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-muted/50 px-2 py-2">
                    <p className="text-muted-foreground">{t('business.barberShare')}</p>
                    <p className="font-semibold tabular-nums">{formatCurrency(b.stats.barberShare)}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-500/10 px-2 py-2">
                    <p className="text-muted-foreground">{t('barbers.available')}</p>
                    <p className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(b.stats.availableEarnings)}</p>
                  </div>
                  <div className="rounded-lg px-2 py-2">
                    <p className="text-muted-foreground">{t('barbers.outstanding')}</p>
                    <p className={`font-semibold tabular-nums ${b.stats.outstandingLoans > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{formatCurrency(b.stats.outstandingLoans)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="truncate text-xs text-muted-foreground">{b.phone}</span>
                  <div className="flex gap-0.5">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" onClick={() => setDetailTarget(b)} title={t('common.edit')}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" onClick={() => { setEditing(b); setDialogOpen(true); }} title={t('common.edit')}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" onClick={() => setPinTarget(b)} title={t('barbers.genPin')}>
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" onClick={() => setPayoutTarget(b)} title={t('barbers.payout')}>
                      <Banknote className="h-4 w-4" />
                    </Button>
                    {b.stats.transactionCount === 0 && b.stats.activeLoans === 0 ? (
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(b)} title={t('common.delete')}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          />

          {isLoading && filtered.length === 0 ? (
            <div className="md:hidden"><LoadingRows rows={4} /></div>
          ) : filtered.length === 0 ? (
            <div className="md:hidden"><EmptyState icon={UserCheck} message={t('barbers.empty')} /></div>
          ) : null}
        </CardContent>
      </Card>

      <BarberDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}
        existing={editing}
        onSubmit={async (form) => saveMutation.mutate({ id: editing?._id, form })}
        busy={saveMutation.isPending}
      />

      {detailTarget && <BarberDetailBarber barber={detailTarget} onClose={() => setDetailTarget(null)} />}
      {payoutTarget && <PayoutDialog barber={payoutTarget} onClose={() => setPayoutTarget(null)} onDone={invalidate} />}

      <ConfirmDialog
        open={Boolean(pinTarget)}
        onOpenChange={(o) => { if (!o) setPinTarget(null); }}
        title={t('barbers.confirmPin')}
        description={<>{t('barbers.pinHintModal')} <b>{pinTarget?.name}</b></>}
        confirmLabel={t('common.confirm')}
        variant="default"
        loading={pinMutation.isPending}
        onConfirm={() => pinTarget && pinMutation.mutate(pinTarget._id)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title={t('barbers.confirmDelete')}
        description={t('barbers.deleteHint')}
        confirmLabel={t('common.delete')}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}

function BarberDetailBarber({ barber, onClose }: { barber: Barber; onClose: () => void }) {
  const { t } = useLanguage();
  return (
    <DialogShell open onOpenChange={(o) => { if (!o) onClose(); }} title={barber.name} description={`${barber.phone} · ${barber.email || '—'} · ${t('common.joined')} ${formatDate(barber.joinedAt || barber.createdAt)}`}>
      <Tabs defaultValue="stats">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stats">{t('barbers.tabStats')}</TabsTrigger>
          <TabsTrigger value="activity">{t('barbers.tabActivity')}</TabsTrigger>
        </TabsList>
        <TabsContent value="stats">
          <div className="grid gap-3 sm:grid-cols-2">
            <BarberStat label={t('barbers.earned')} value={formatCurrency(barber.stats.barberShare)} />
            <BarberStat label={t('barbers.paid')} value={formatCurrency(barber.stats.paidOut)} accent="text-emerald-600 dark:text-emerald-400" />
            <BarberStat label={t('barbers.available')} value={formatCurrency(barber.stats.availableEarnings)} accent="text-primary" />
            <BarberStat label={t('barbers.outstanding')} value={formatCurrency(barber.stats.outstandingLoans)} />
            <BarberStat label={t('barbers.txCount')} value={String(barber.stats.transactionCount)} accent="text-primary" />
            <BarberStat label={t('barbers.volume')} value={formatCurrency(barber.stats.transactionVolume)} />
          </div>
        </TabsContent>
        <TabsContent value="activity">
          <BarberActivity barberId={barber._id} />
        </TabsContent>
      </Tabs>
    </DialogShell>
  );
}

function BarberStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border bg-muted/40 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${accent ?? ''}`}>{value}</p>
    </div>
  );
}

function BarberActivity({ barberId }: { barberId: string }) {
  const { t } = useLanguage();
  const { data, isLoading } = useQuery({
    queryKey: ['barber-detail', barberId],
    queryFn: async () => {
      const res = await api.get(`/barbers/${barberId}`);
      return res.data.data as { barber: Barber; recentTransactions: any[]; repayments: any[]; loans: any[] };
    },
  });
  if (isLoading) return <LoadingRows rows={3} />;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <h4 className="mb-2 text-sm font-medium">{t('barbers.recentTx')}</h4>
        {data?.recentTransactions.length ? (
          <div className="space-y-2">
            {data.recentTransactions.map((tx) => (
              <div key={tx._id} className="flex justify-between rounded-xl border bg-card p-3 text-sm shadow-sm">
                <div>
                  <p>{tx.customerName || tx.service || t('common.customer')}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                </div>
                <p className="font-semibold tabular-nums">{formatCurrency(tx.totalAmount)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
        )}
      </div>
      <div>
        <h4 className="mb-2 text-sm font-medium">{t('barbers.loans')}</h4>
        {data?.loans.length ? (
          <div className="space-y-2">
            {data.loans.map((l) => (
              <div key={l._id} className="flex justify-between rounded-xl border bg-card p-3 text-sm shadow-sm">
                <div>
                  <p>{l.reason || t('barbers.loan')}</p>
                  <p className="text-xs text-muted-foreground">{t('common.remaining')}: {formatCurrency(l.outstandingAmount)}</p>
                </div>
                <p className="font-semibold tabular-nums">{formatCurrency(l.amount)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
        )}
      </div>
    </div>
  );
}

function PayoutDialog({ barber, onClose, onDone }: { barber: Barber; onClose: () => void; onDone: () => void }) {
  const { t } = useLanguage();
  const [method, setMethod] = useState('cash');
  const [busy, setBusy] = useState(false);

  const available = Math.max(0, barber.stats.availableEarnings);
  const outstanding = Math.max(0, barber.stats.outstandingLoans);
  const loanDeduction = Math.min(outstanding, available);
  const netPayout = Math.max(0, available - loanDeduction);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (available <= 0) return;
    setBusy(true);
    try {
      const res = await api.post<{ data: { breakdown?: { loanDeduction?: number; netPayout?: number } } }>(`/barbers/${barber._id}/payout`, { method });
      const breakdown = res.data.data.breakdown;
      const deduct = breakdown?.loanDeduction ?? loanDeduction;
      const net = breakdown?.netPayout ?? netPayout;
      toast.success(deduct > 0 ? t('barbers.payoutDoneWithLoan').replace('{loan}', formatCurrency(deduct)).replace('{net}', formatCurrency(net)) : t('barbers.payoutDone'));
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
      title={t('barbers.payoutTitle')}
      description={<>{barber.name} · {t('barbers.payoutCalcHint')}</>}
      className="max-w-lg"
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="overflow-hidden rounded-xl border">
          <div className="divide-y">
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-muted-foreground">{t('barbers.available')}</span>
              <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(available)}</span>
            </div>
            {outstanding > 0 ? (
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="text-muted-foreground">
                  {t('barbers.loanDeduction')}
                  <p className="text-xs">{t('barbers.autoNote')}</p>
                </div>
                <span className="font-semibold tabular-nums text-destructive">− {formatCurrency(loanDeduction)}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between bg-primary/5 px-4 py-3 text-sm">
              <span className="font-medium">{t('barbers.netPayout')}</span>
              <span className="text-lg font-bold tabular-nums text-primary">{formatCurrency(netPayout)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payout-method">{t('common.method')}</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger id="payout-method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['cash', 'mobile_money', 'card', 'bank_transfer', 'other'].map((m) => (
                <SelectItem key={m} value={m}>{m.replace('_', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground">{t('barbers.payoutResetHint')}</p>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={busy || available <= 0}>
            {busy ? t('common.loading') : t('barbers.markPaid')}
          </Button>
        </DialogFooter>
      </form>
    </DialogShell>
  );
}
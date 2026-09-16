import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCcw, UserCheck, UserX, Ban, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { api, errorMessage } from '@/lib/api';
import type { AdminUser, Paginated } from '@/lib/types';
import { formatDateOnly, initials } from '@/lib/utils';
import { PageHeader, SectionCard } from '@/components/shared/cards';
import { StatusBadge } from '@/components/shared/status-badge';
import { DialogShell } from '@/components/shared/dialogs';
import { LoadingRows } from '@/components/shared/state';
import { MobileCards } from '@/components/shared/mobile-cards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';

export default function AdminUsersPage() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [filters, setFilters] = useState<{ status: string; search: string }>({ status: '', search: '' });
  const [page, setPage] = useState(1);
  const [renewTarget, setRenewTarget] = useState<AdminUser | null>(null);
  const [renewDays, setRenewDays] = useState('30');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    phone: '',
    email: '',
    salonName: '',
    password: '',
    passwordConfirmation: '',
  });
  const setF = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', filters, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      const res = await api.get('/admin/users', { params });
      return res.data.data as Paginated<AdminUser>;
    },
  });

  const users = data?.items ?? [];

  const invalidate = () => void qc.invalidateQueries({ queryKey: ['admin-users'] });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.patch(`/admin/users/${id}/status`, { status });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success(t('admin.statusUpdated'));
      void qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const renewMutation = useMutation({
    mutationFn: async ({ id, days }: { id: string; days: number }) => {
      const res = await api.post(`/admin/users/${id}/renew`, { days });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success(t('admin.renewed'));
      setRenewTarget(null);
      void qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await api.post('/admin/users', payload);
      return res.data.data as { user: { email: string; username: string }; salon: { name: string } };
    },
    onSuccess: (created) => {
      const creds = t('admin.issuingCreds') + ' ' + (created.user.email || created.user.username);
      toast.success(t('admin.managerCreated') + ' — ' + created.salon.name);
      toast.info(creds);
      setCreateOpen(false);
      setForm({ fullName: '', username: '', phone: '', email: '', salonName: '', password: '', passwordConfirmation: '' });
      void qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader title={t('nav.adminUsers')} description={t('admin.usersSubtitle')} icon={UserPlus} className="mb-0" />
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          {t('admin.addManager')}
        </Button>
      </div>

      <SectionCard title={t('common.select')} bodyClassName="p-4" className="mb-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label className="text-xs text-muted-foreground">{t('common.status')}</Label>
            <Select value={filters.status} onValueChange={(v) => { setFilters((f) => ({ ...f, status: v })); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('common.all')}</SelectItem>
                <SelectItem value="active">{t('admin.active')}</SelectItem>
                <SelectItem value="suspended">{t('admin.suspended')}</SelectItem>
                <SelectItem value="expired">{t('admin.expired')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs text-muted-foreground">{t('common.search')}</Label>
            <Input
              value={filters.search}
              onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1); }}
              placeholder={t('admin.searchPlaceholder')}
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
                  <TableHead>{t('auth.fullName')}</TableHead>
                  <TableHead>{t('settings.salonTitle')}</TableHead>
                  <TableHead>{t('admin.subscription')}</TableHead>
                  <TableHead>{t('admin.expires')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10">
                      <LoadingRows rows={5} />
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                      {t('admin.noUsers')}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u._id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 border border-primary/20 bg-primary/10">
                            <AvatarFallback className="text-xs text-primary">{initials(u.fullName || u.username)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{u.fullName || u.username}</p>
                            <p className="text-xs text-muted-foreground">{u.phone} · {u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{u.salon?.name ?? '—'}</TableCell>
                      <TableCell>
                        <StatusBadge status={u.bucket} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.subscriptionEnd ? formatDateOnly(u.subscriptionEnd) : '∞'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={u.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" onClick={() => setRenewTarget(u)} title={t('admin.renew')}>
                            <RefreshCcw className="h-4 w-4" />
                          </Button>
                          {u.status !== 'active' ? (
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" onClick={() => statusMutation.mutate({ id: u._id, status: 'active' })} title={t('admin.activate')}>
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => statusMutation.mutate({ id: u._id, status: 'suspended' })} title={t('admin.suspend')}>
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          {u.status === 'active' && (
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => statusMutation.mutate({ id: u._id, status: 'expired' })} title={t('admin.expire')}>
                              <UserX className="h-4 w-4" />
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
            items={users}
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
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge status={u.bucket} />
                    <StatusBadge status={u.status} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">{u.salon?.name ?? '—'}</span>
                  <span className="tabular-nums">{u.subscriptionEnd ? formatDateOnly(u.subscriptionEnd) : '∞'}</span>
                </div>
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" onClick={() => setRenewTarget(u)} title={t('admin.renew')}>
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                  {u.status !== 'active' ? (
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" onClick={() => statusMutation.mutate({ id: u._id, status: 'active' })} title={t('admin.activate')}>
                      <UserCheck className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => statusMutation.mutate({ id: u._id, status: 'suspended' })} title={t('admin.suspend')}>
                      <Ban className="h-4 w-4" />
                    </Button>
                  )}
                  {u.status === 'active' && (
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => statusMutation.mutate({ id: u._id, status: 'expired' })} title={t('admin.expire')}>
                      <UserX className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          />
          {isLoading && users.length === 0 ? (
            <div className="md:hidden"><LoadingRows rows={4} /></div>
          ) : users.length === 0 ? (
            <div className="md:hidden p-6 text-center text-sm text-muted-foreground">{t('admin.noUsers')}</div>
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

      <DialogShell
        open={Boolean(renewTarget)}
        onOpenChange={(o) => { if (!o) setRenewTarget(null); }}
        title={t('admin.renewTitle')}
        description={<>{renewTarget?.fullName || renewTarget?.username} · {renewTarget?.salon?.name ?? '—'}</>}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (renewTarget) renewMutation.mutate({ id: renewTarget._id, days: Number(renewDays) });
          }}
          className="grid gap-4"
        >
          <div className="space-y-2">
            <Label>{t('admin.renewDays')}</Label>
            <Input inputMode="numeric" value={renewDays} onChange={(e) => setRenewDays(e.target.value.replace(/\D/g, ''))} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRenewTarget(null)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={renewMutation.isPending}>
              {renewMutation.isPending ? t('common.loading') : t('admin.renew')}
            </Button>
          </DialogFooter>
        </form>
      </DialogShell>

      <DialogShell
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={t('admin.newManagerTitle')}
        description={t('admin.newManagerDesc')}
        className="sm:max-w-lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (form.password !== form.passwordConfirmation) {
              toast.error(t('auth.passwordsMatch'));
              return;
            }
            if (form.password.length < 8) {
              toast.error(t('auth.passwordMin'));
              return;
            }
            createMutation.mutate({ ...form });
          }}
          className="grid gap-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mgr-fullName">{t('auth.fullName')}</Label>
              <Input id="mgr-fullName" value={form.fullName} onChange={setF('fullName')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mgr-username">{t('auth.username')}</Label>
              <Input id="mgr-username" value={form.username} onChange={setF('username')} required autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mgr-phone">{t('auth.phone')}</Label>
              <Input id="mgr-phone" value={form.phone} onChange={setF('phone')} placeholder="+2507…" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mgr-email">{t('auth.email')}</Label>
              <Input id="mgr-email" type="email" value={form.email} onChange={setF('email')} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="mgr-salon">{t('admin.salonName')}</Label>
              <Input id="mgr-salon" value={form.salonName} onChange={setF('salonName')} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mgr-password">{t('auth.password')}</Label>
              <Input id="mgr-password" type="password" value={form.password} onChange={setF('password')} required autoComplete="new-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mgr-confirm">{t('auth.confirmPassword')}</Label>
              <Input id="mgr-confirm" type="password" value={form.passwordConfirmation} onChange={setF('passwordConfirmation')} required autoComplete="new-password" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? t('common.loading') : t('admin.createManager')}
            </Button>
          </DialogFooter>
        </form>
      </DialogShell>
    </div>
  );
}
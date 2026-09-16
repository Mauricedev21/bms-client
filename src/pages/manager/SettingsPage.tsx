import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Save, UserCog, Lock, UserCircle, Cog } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { api, errorMessage } from '@/lib/api';
import type { SalonInfo } from '@/lib/types';
import { PageHeader, SectionCard } from '@/components/shared/cards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  const { t } = useLanguage();
  const { user, salon } = useAuth();
  const { data } = useQuery({
    queryKey: ['salon-settings'],
    queryFn: async () => {
      const res = await api.get('/user/salon');
      return res.data.data as { salon: SalonInfo; owner: any; businessModel: { manager: number; barber: number } };
    },
    enabled: false,
    initialData: () => ({ salon: (salon ?? { _id: '', name: '', currency: 'RWF', managerSharePercent: 60, barberSharePercent: 40 }) as SalonInfo, owner: {}, businessModel: { manager: 60, barber: 40 } }),
  });

  const [salonForm, setSalonForm] = useState(() => ({
    name: data?.salon?.name ?? salon?.name ?? '',
    phone: (data?.salon as any)?.phone ?? '',
    email: (data?.salon as any)?.email ?? '',
    address: (data?.salon as any)?.address ?? '',
    city: (data?.salon as any)?.city ?? '',
    website: (data?.salon as any)?.website ?? '',
  }));

  const [profileForm, setProfileForm] = useState(() => ({
    fullName: user?.fullName ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
  }));

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  const salonMutation = useMutation({
    mutationFn: async () => {
      const res = await api.put('/user/salon', salonForm);
      return res.data.data;
    },
    onSuccess: () => toast.success(t('settings.saved')),
    onError: (e) => toast.error(errorMessage(e)),
  });

  const profileMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch('/user/profile', profileForm);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success(t('settings.profileSaved'));
      void refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const { refresh } = useAuth();

  const pwMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/auth/change-password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success(t('settings.passwordChanged'));
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const submitSalon = (e: React.FormEvent) => {
    e.preventDefault();
    salonMutation.mutate();
  };
  const submitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    profileMutation.mutate();
  };
  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) {
      toast.error(t('auth.passwordsMismatch'));
      return;
    }
    pwMutation.mutate();
  };

  return (
    <div>
      <PageHeader title={t('nav.settings')} description={t('settings.subtitle')} icon={Cog} />

      <div className="grid gap-6 md:grid-cols-2">
        <SectionCard
          title={t('settings.salonTitle')}
          description={`${t('settings.salonHint')} · ${t('business.managerShare')} ${data?.businessModel?.manager}% / ${t('business.barberShare')} ${data?.businessModel?.barber}%`}
          icon={UserCog}
        >
          <form onSubmit={submitSalon} className="grid gap-4">
            <div className="space-y-2">
              <Label>{t('auth.salonName')} *</Label>
              <Input value={salonForm.name} onChange={(e) => setSalonForm((f) => ({ ...f, name: e.target.value }))} required minLength={2} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('auth.phone')}</Label>
                <Input value={salonForm.phone} onChange={(e) => setSalonForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('auth.email')}</Label>
                <Input type="email" value={salonForm.email} onChange={(e) => setSalonForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('settings.address')}</Label>
                <Input value={salonForm.address} onChange={(e) => setSalonForm((f) => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('settings.city')}</Label>
                <Input value={salonForm.city} onChange={(e) => setSalonForm((f) => ({ ...f, city: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('settings.website')}</Label>
              <Input value={salonForm.website} onChange={(e) => setSalonForm((f) => ({ ...f, website: e.target.value }))} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={salonMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {salonMutation.isPending ? t('common.loading') : t('common.save')}
              </Button>
            </div>
          </form>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title={t('settings.profileTitle')} icon={UserCircle}>
            <form onSubmit={submitProfile} className="grid gap-4">
              <div className="space-y-2">
                <Label>{t('auth.fullName')}</Label>
                <Input value={profileForm.fullName} onChange={(e) => setProfileForm((f) => ({ ...f, fullName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('auth.phone')}</Label>
                  <Input value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t('auth.email')}</Label>
                  <Input type="email" value={profileForm.email} onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="outline" disabled={profileMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {profileMutation.isPending ? t('common.loading') : t('common.save')}
                </Button>
              </div>
            </form>
          </SectionCard>

          <SectionCard title={t('settings.passwordTitle')} icon={Lock}>
            <form onSubmit={submitPassword} className="grid gap-4">
              <div className="space-y-2">
                <Label>{t('settings.currentPassword')}</Label>
                <Input type="password" value={pw.currentPassword} onChange={(e) => setPw((f) => ({ ...f, currentPassword: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('settings.newPassword')}</Label>
                  <Input type="password" value={pw.newPassword} onChange={(e) => setPw((f) => ({ ...f, newPassword: e.target.value }))} required minLength={8} />
                </div>
                <div className="space-y-2">
                  <Label>{t('auth.confirmPassword')}</Label>
                  <Input type="password" value={pw.confirm} onChange={(e) => setPw((f) => ({ ...f, confirm: e.target.value }))} required minLength={8} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="outline" disabled={pwMutation.isPending}>
                  <Lock className="mr-2 h-4 w-4" />
                  {pwMutation.isPending ? t('common.loading') : t('settings.changePassword')}
                </Button>
              </div>
            </form>
          </SectionCard>
        </div>
      </div>

      <Separator className="my-8" />
      <p className="text-center text-xs text-muted-foreground">
        {t('settings.shareLocked')} — {data?.businessModel?.manager}% / {data?.businessModel?.barber}%
      </p>
    </div>
  );
}


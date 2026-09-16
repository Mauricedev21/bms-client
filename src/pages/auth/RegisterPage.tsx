import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { errorMessage } from '@/lib/api';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    fullName: '',
    phone: '',
    email: '',
    password: '',
    passwordConfirmation: '',
    salonName: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.passwordConfirmation) {
      setError(t('auth.passwordsMismatch'));
      return;
    }
    setBusy(true);
    try {
      await register(form);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t('auth.createAccount')} subtitle={t('auth.registerSubtitle')}>
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
        )}
        <div className="space-y-2">
          <Label htmlFor="username">{t('auth.username')}</Label>
          <Input id="username" value={form.username} onChange={set('username')} placeholder="manager1" required minLength={3} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fullName">{t('auth.fullName')}</Label>
          <Input id="fullName" value={form.fullName} onChange={set('fullName')} placeholder="Jean Mugisha" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">{t('auth.phone')}</Label>
            <Input id="phone" value={form.phone} onChange={set('phone')} placeholder="+2507xxxxxxxx" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input id="email" type="email" value={form.email} onChange={set('email')} placeholder="manager@salon.rw" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="salonName">{t('auth.salonName')}</Label>
          <Input id="salonName" value={form.salonName} onChange={set('salonName')} placeholder="Top Cut Saloon Kigali" required minLength={2} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input id="password" type="password" value={form.password} onChange={set('password')} autoComplete="new-password" required minLength={8} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="passwordConfirmation">{t('auth.confirmPassword')}</Label>
            <Input id="passwordConfirmation" type="password" value={form.passwordConfirmation} onChange={set('passwordConfirmation')} autoComplete="new-password" required minLength={8} />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          <UserPlus className="mr-2 h-4 w-4" />
          {busy ? t('common.loading') : t('auth.register')}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t('auth.login')}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
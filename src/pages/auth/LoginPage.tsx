import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { errorMessage } from '@/lib/api';
import { useRateLimitCooldown } from '@/lib/useRateLimitCooldown';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { locked, seconds, apply } = useRateLimitCooldown();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (locked) return;
    setBusy(true);
    try {
      const session = await login(identifier, password);
      const sessionRole =
        session.barber ? 'barber'
        : (session.user?.role ?? '');
      const home =
        sessionRole === 'admin' ? '/admin'
        : sessionRole === 'manager' ? '/dashboard'
        : sessionRole === 'barber' ? '/portal'
        : location.state?.from ?? '/';
      navigate(home, { replace: true });
    } catch (err) {
      if (apply(err)) setError(t('auth.tooManyAttempts').replace('{s}', String(seconds + 1)));
      else setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t('auth.welcomeBack')} subtitle={t('auth.loginSubtitle')}>
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
        )}
        <div className="space-y-2">
          <Label htmlFor="identifier">{t('auth.identifier')}</Label>
          <Input
            id="identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="username / +2507... / email"
            autoComplete="username"
            required
            disabled={locked}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t('auth.password')}</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            disabled={locked}
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy || locked}>
          <LogIn className="mr-2 h-4 w-4" />
          {busy ? t('common.loading') : t('auth.login')}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            {t('auth.register')}
          </Link>
        </p>
        <p className="text-center text-xs text-muted-foreground">
          {t('auth.barberPortal')}{' '}
          <Link to="/portal/login" className="font-medium text-primary hover:underline">
            {t('auth.portalLogin')}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Undo2 } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRateLimitCooldown } from '@/lib/useRateLimitCooldown';
import { TOKEN_KEY } from '@/lib/types';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PortalLoginPage() {
  const { applySession, refresh } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { locked, seconds, apply } = useRateLimitCooldown();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (locked) return;
    setBusy(true);
    try {
      const res = await api.post('/portal/login', { phone, pin });
      localStorage.setItem(TOKEN_KEY, res.data.data.token);
      applySession({ token: res.data.data.token, barber: res.data.data.barber });
      await refresh();
      navigate('/portal', { replace: true });
    } catch (err) {
      if (apply(err)) setError(t('auth.tooManyAttempts').replace('{s}', String(seconds + 1)));
      else setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthShell title={t('auth.portalLogin')} subtitle={t('auth.portalSubtitle')}>
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
        )}
        <div className="space-y-2">
          <Label htmlFor="phone">{t('auth.phone')}</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+2507xxxxxxxx" required disabled={locked} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pin">{t('auth.pin')}</Label>
          <Input id="pin" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="000000" required disabled={locked} />
          <p className="text-xs text-muted-foreground">{t('auth.pinHint')}</p>
        </div>
        <Button type="submit" className="w-full" disabled={busy || locked}>
          <KeyRound className="mr-2 h-4 w-4" />
          {busy ? t('common.loading') : t('auth.portalLogin')}
        </Button>
        {locked && (
          <p className="text-center text-xs text-destructive">
            {t('auth.tooManyAttempts').replace('{s}', String(seconds))}
          </p>
        )}
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
            <Undo2 className="h-3 w-3" />
            {t('common.back')}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
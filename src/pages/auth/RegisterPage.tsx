import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { errorMessage } from '@/lib/api';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [showPassword, setShowPassword] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.passwordConfirmation) {
      setError(t('auth.passwordsMismatch'));
      return;
    }
    if (form.password.length < 8) {
      setError(t('auth.passwordMin'));
      return;
    }
    if (form.salonName.trim().length < 2) {
      setError(t('admin.salonNameRequired'));
      return;
    }
    setBusy(true);
    try {
      await register(form);
      // The request is saved as PENDING — show the approval modal instead of
      // signing the user in (no session is issued until an admin approves).
      setApprovalOpen(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
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
        <div className="space-y-2">
          <Label htmlFor="password">{t('auth.password')}</Label>
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={set('password')}
            autoComplete="new-password"
            required
            minLength={8}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-1 flex items-center gap-1 text-muted-foreground hover:text-primary"
            onClick={() => setShowPassword((s) => !s)}
          >
            {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="passwordConfirmation">{t('auth.confirmPassword')}</Label>
          <Input
            id="passwordConfirmation"
            type={showPassword ? 'text' : 'password'}
            value={form.passwordConfirmation}
            onChange={set('passwordConfirmation')}
            autoComplete="new-password"
            required
            minLength={8}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-1 flex items-center gap-1 text-muted-foreground hover:text-primary"
            onClick={() => setShowPassword((s) => !s)}
          >
            {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
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

      {/* Approval modal — shown after the access request is saved as pending */}
      <Dialog open={approvalOpen} onOpenChange={(o) => { if (!o) { setApprovalOpen(false); navigate('/login', { replace: true }); } }}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center gap-4 pt-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" strokeWidth={1.75} />
            </div>
            <DialogHeader className="items-center">
              <DialogTitle className="text-xl font-bold text-foreground">
                {t('auth.accountCreatedTitle')}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {t('auth.accountCreatedMsg')}
              </DialogDescription>
            </DialogHeader>
            <Button className="w-full" onClick={() => { setApprovalOpen(false); navigate('/login', { replace: true }); }}>
              {t('auth.understand')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AuthShell>
  );
}
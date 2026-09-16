import { Link, Navigate } from 'react-router-dom';
import {
  Scissors,
  Languages,
  Moon,
  Sun,
  ArrowRight,
  ReceiptText,
  HandCoins,
  QrCode,
  Wallet,
  FileText,
  ShieldCheck,
  UserPlus,
  Users,
  Store,
  Split,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { FullScreenLoading } from '@/components/guards';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { LucideIcon } from 'lucide-react';

const STEPS: { icon: LucideIcon; titleKey: string; descKey: string }[] = [
  { icon: Store, titleKey: 'landing.step1', descKey: 'landing.step1desc' },
  { icon: Users, titleKey: 'landing.step2', descKey: 'landing.step2desc' },
  { icon: UserPlus, titleKey: 'landing.step3', descKey: 'landing.step3desc' },
];

const FEATURES: { icon: LucideIcon; titleKey: string; descKey: string }[] = [
  { icon: ReceiptText, titleKey: 'landing.f1', descKey: 'landing.f1desc' },
  { icon: HandCoins, titleKey: 'landing.f2', descKey: 'landing.f2desc' },
  { icon: QrCode, titleKey: 'landing.f3', descKey: 'landing.f3desc' },
  { icon: Wallet, titleKey: 'landing.f4', descKey: 'landing.f4desc' },
  { icon: FileText, titleKey: 'landing.f5', descKey: 'landing.f5desc' },
  { icon: ShieldCheck, titleKey: 'landing.f6', descKey: 'landing.f6desc' },
];

export default function LandingPage() {
  const { t, lang, setLang } = useLanguage();
  const { resolvedTheme, toggle } = useTheme();
  const { role, loading } = useAuth();

  if (loading) return <FullScreenLoading />;
  if (role === 'manager') return <Navigate to="/dashboard" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'barber') return <Navigate to="/portal" replace />;

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Scissors className="size-5" />
            </div>
            <span className="text-lg font-bold">{t('app.name')}</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#how" className="hover:text-foreground">{t('landing.how')}</a>
            <a href="#features" className="hover:text-foreground">{t('landing.features')}</a>
            <a href="#split" className="hover:text-foreground">{t('landing.split')}</a>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={() => setLang(lang === 'en' ? 'kin' : 'en')}>
              <Languages className="h-4 w-4" />
              {lang === 'en' ? 'Kinyarwanda' : 'English'}
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={toggle}>
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/login">{t('auth.login')}</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/register">
                {t('auth.register')}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(ellipse at top, hsl(var(--primary) / 0.12), transparent 60%)',
        }}
      >
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <Badge variant="secondary" className="mb-5">
              <Split className="mr-1 h-3.5 w-3.5" />
              {t('marketing.managerIncome')}
            </Badge>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{t('app.tagline')}</h1>
            <p className="mt-4 max-w-lg text-muted-foreground">{t('marketing.track')}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to="/register">
                  {t('auth.createAccount')} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">{t('auth.login')}</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Scissors className="size-4 text-primary" />
                {t('marketing.loans')}
              </span>
              <span className="flex items-center gap-2">
                <HandCoins className="size-4 text-primary" />
                {t('marketing.managerIncome')}
              </span>
            </div>
          </div>

          {/* 60/40 split preview cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground">{t('landing.manager')}</p>
                <p className="mt-2 text-3xl font-bold text-primary">RWF 6,000</p>
                <p className="mt-1 text-xs text-muted-foreground">{t('business.managerShare')} · 60%</p>
              </CardContent>
            </Card>
            <Card className="border-emerald-600/30 bg-emerald-600/5">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground">{t('landing.barber')}</p>
                <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">RWF 4,000</p>
                <p className="mt-1 text-xs text-muted-foreground">{t('business.barberShare')} · 40%</p>
              </CardContent>
            </Card>
            <div className="col-span-full rounded-2xl border bg-card p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{t('landing.recordedTotal')}</span>
                <span className="inline-flex h-2 flex-1 mx-3 overflow-hidden rounded-full bg-muted">
                  <span className="h-full w-3/5 rounded-full bg-primary" />
                  <span className="h-full w-2/5 rounded-full bg-emerald-600" />
                </span>
                <span className="font-bold">RWF 10,000</span>
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">{t('landing.example')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('landing.how')}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{t('landing.f4desc')}</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, titleKey, descKey }, i) => (
              <Card key={titleKey}>
                <CardContent className="p-6">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-6" />
                  </div>
                  <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">{i + 1}</span>
                    {t(titleKey)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{t(descKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('landing.features')}</h2>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, titleKey, descKey }) => (
            <Card key={titleKey}>
              <CardContent className="flex gap-4 p-6">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">{t(titleKey)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t(descKey)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Split explainer */}
      <section id="split" className="border-t bg-primary/5">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('landing.split')}</h2>
              <p className="mt-3 text-muted-foreground">{t('landing.splitHint')}</p>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  {t('business.managerIncome')}
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  {t('business.barberEarnings')}
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  {t('support.a1')}
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-end justify-between gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">{t('landing.recordedTotal')}</p>
                  <p className="mt-1 text-2xl font-bold">RWF 10,000</p>
                </div>
                <div className="flex flex-1 items-center gap-2">
                  <div className="h-3 flex-1 rounded-full bg-primary/70" />
                  <div className="h-3 w-2/3 rounded-full bg-emerald-600/70" />
                </div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-primary/10 p-4">
                  <p className="text-xs font-medium text-muted-foreground">{t('business.managerShare')} · 60%</p>
                  <p className="mt-1 text-xl font-bold text-primary">RWF 6,000</p>
                </div>
                <div className="rounded-xl bg-emerald-600/10 p-4">
                  <p className="text-xs font-medium text-muted-foreground">{t('business.barberShare')} · 40%</p>
                  <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">RWF 4,000</p>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <Button asChild>
                  <Link to="/register">
                    {t('auth.createAccount')} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/portal/login">{t('auth.barberPortal')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Scissors className="size-4" />
            </div>
            <span className="font-semibold">{t('app.name')}</span>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} {t('app.name')} · {t('footer.madeIn')}
          </p>
        </div>
      </footer>
    </div>
  );
}
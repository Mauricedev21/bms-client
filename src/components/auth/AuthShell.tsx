import { Link } from 'react-router-dom';
import { Scissors, Languages, Moon, Sun } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';

export function AuthShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  const { t, lang, setLang } = useLanguage();
  const { resolvedTheme, toggle } = useTheme();

  return (
    <div className="flex min-h-svh bg-gradient-to-br from-background via-background to-primary/5">
      <div className="m-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="hidden max-w-md lg:block">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
              <Scissors className="size-6" />
            </div>
            <span className="text-2xl font-bold">{t('app.name')}</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight">{t('app.tagline')}</h1>
          <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {t('marketing.managerIncome')}
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {t('marketing.track')}
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {t('marketing.loans')}
            </li>
          </ul>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-5 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 lg:hidden">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Scissors className="size-5" />
              </div>
              <span className="text-lg font-bold">{t('app.name')}</span>
            </Link>
            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={() => setLang(lang === 'en' ? 'kin' : 'en')}>
                <Languages className="h-4 w-4" />
                {lang === 'en' ? 'Kinyarwanda' : 'English'}
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={toggle}>
                {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="card-shadow rounded-2xl border bg-card p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} {t('app.name')} · RWF
          </p>
        </div>
      </div>
    </div>
  );
}
import { Scissors } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export function AppFooter() {
  const { t } = useLanguage();
  return (
    <footer className="border-t py-6">
      <div className="flex flex-col items-center justify-between gap-2 px-4 text-xs text-muted-foreground sm:flex-row md:px-6">
        <div className="flex items-center gap-2">
          <Scissors className="size-3.5 text-muted-foreground/70" />
          <span className="font-medium">{t('app.name')}</span>
        </div>
        <p>
          © {new Date().getFullYear()} {t('app.name')} · {t('footer.madeIn')}
        </p>
      </div>
    </footer>
  );
}
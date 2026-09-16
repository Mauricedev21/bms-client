import { NavLink, Outlet } from 'react-router-dom';
import { Scissors, LogOut, ArrowLeft, Home } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AppFooter } from '@/components/layout/AppFooter';

export default function BarberLayout() {
  const { t } = useLanguage();
  const { barber, logout } = useAuth();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Scissors className="size-4" />
          </div>
          <span className="text-sm font-semibold">{t('portal.title')}</span>
        </div>
        <Separator orientation="vertical" className="h-5" />
        <span className="hidden text-sm text-muted-foreground sm:inline">{barber?.name}</span>
        <div className="flex-1" />
        <NavLink to="/">
          <Button variant="ghost" size="sm">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">{t('portal.home')}</span>
          </Button>
        </NavLink>
        <Button variant="outline" size="sm" onClick={logout}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">{t('auth.logout')}</span>
        </Button>
      </header>
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
}
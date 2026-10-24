import { Bell, CheckCheck, Moon, Sun, Languages } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { InstallButton } from '@/components/shared/install-button';
import { formatDate, initials, relativeTime } from '@/lib/utils';

export function Topbar() {
  const { t, lang, setLang } = useLanguage();
  const { resolvedTheme, toggle } = useTheme();
  const { user } = useAuth();
  const { notifications, unread, markAllRead } = useNotifications();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <div className="flex-1" />

      <InstallButton />

      <Button variant="ghost" size="sm" onClick={toggle} className="gap-2 px-2 text-muted-foreground">
        {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        <span className="hidden sm:inline">{resolvedTheme === 'dark' ? 'Light' : 'Dark'}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="gap-2 px-2 text-muted-foreground"
        onClick={() => setLang(lang === 'en' ? 'kin' : 'en')}
      >
        <Languages className="h-4 w-4" />
        <span className="hidden sm:inline">{lang === 'en' ? 'Kinyarwanda' : 'English'}</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
                {unread}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>{t('common.notifications')}</span>
            <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs text-muted-foreground" onClick={() => void markAllRead()}>
              <CheckCheck className="h-3 w-3" />
              {t('common.markAllRead')}
            </Button>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <ScrollArea className="h-72">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">{t('common.noNotifications')}</div>
            ) : (
              notifications.map((n) => (
                <DropdownMenuItem key={n._id} className="items-start gap-3 whitespace-normal py-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{n.title}</span>
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground/70" title={formatDate(n.createdAt)}>
                      {relativeTime(n.createdAt)}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-5" />
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8 border bg-primary/10">
          <AvatarFallback className="bg-transparent text-primary">{initials(user?.fullName || user?.username)}</AvatarFallback>
        </Avatar>
        <div className="hidden leading-tight md:block">
          <p className="text-sm font-medium">{user?.fullName || user?.username}</p>
          <p className="text-xs text-muted-foreground">{user?.role === 'admin' ? 'Administrator' : 'Manager'}</p>
        </div>
      </div>
    </header>
  );
}
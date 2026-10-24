import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Archive, Scissors, LogOut, ShieldCheck, UserCheck, Activity } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { SidebarInset, SidebarProvider, Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, SidebarSeparator, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AppFooter } from '@/components/layout/AppFooter';
import { InstallButton } from '@/components/shared/install-button';
import { initials } from '@/lib/utils';

const adminNav = [
  { title: 'nav.dashboard', url: '/admin', icon: LayoutDashboard, end: true },
  { title: 'nav.adminRequests', url: '/admin/requests', icon: UserCheck },
  { title: 'nav.adminUsers', url: '/admin/users', icon: Users },
  { title: 'nav.adminActivity', url: '/admin/activity', icon: Activity },
  { title: 'nav.adminRetention', url: '/admin/retention', icon: Archive },
];

/**
 * NOTE: useSidebar() may only be called from a component rendered INSIDE
 * SidebarProvider. Calling it in AdminLayout itself (above the provider)
 * threw "useSidebar must be used within a SidebarProvider" and rendered a
 * completely blank admin panel — that was the root cause of the blank page.
 */
function AdminSidebar() {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const { setOpenMobile } = useSidebar();
  const location = useLocation();

  const isActive = (url: string, end?: boolean) =>
    end ? location.pathname === url : location.pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <NavLink to="/admin" onClick={() => setOpenMobile(false)}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Scissors className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{t('app.name')}</span>
                  <span className="truncate text-xs text-sidebar-foreground/60">Administration</span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator className="mx-2" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.admin')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={t(item.title)} isActive={isActive(item.url, item.end)}>
                    <NavLink to={item.url} end={item.end} onClick={() => setOpenMobile(false)}>
                      <item.icon />
                      <span>{t(item.title)}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <Avatar className="h-8 w-8 rounded-lg bg-sidebar-accent">
                <AvatarFallback className="rounded-lg bg-transparent text-sidebar-foreground">{initials(user?.fullName || user?.username)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-sidebar-foreground">{user?.fullName || user?.username}</span>
                <span className="truncate text-xs text-sidebar-foreground/60">Admin</span>
              </div>
              <LogOut className="ml-auto size-4 cursor-pointer text-sidebar-foreground/70 hover:text-sidebar-foreground" onClick={logout} />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export default function AdminLayout() {
  const { t } = useLanguage();
  const { logout } = useAuth();

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">{t('app.name')} Admin</span>
          <div className="flex-1" />
          <InstallButton />
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            {t('auth.logout')}
          </Button>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
        <AppFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}

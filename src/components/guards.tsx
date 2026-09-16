import { Outlet } from 'react-router-dom';
import { RotateCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function FullScreenLoader() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <RotateCw className="h-8 w-8 animate-spin" />
        <p className="text-sm">Loading…</p>
      </div>
    </div>
  );
}

export function FullScreenLoading() {
  return <FullScreenLoader />;
}

export function PublicOnly() {
  const { loading, role } = useAuth();
  if (loading) return <FullScreenLoader />;
  return <></>;
}

export function ProtectedOutlet() {
  const { loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  return <Outlet />;
}
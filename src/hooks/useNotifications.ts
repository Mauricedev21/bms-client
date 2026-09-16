import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { NotificationItem } from '@/lib/types';

export function useNotifications() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/user/notifications');
      return res.data.data as { notifications: NotificationItem[]; unread: number };
    },
  });

  const markAllRead = async () => {
    try {
      await api.post('/user/notifications/read');
    } finally {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  };

  return {
    notifications: data?.notifications ?? [],
    unread: data?.unread ?? 0,
    isLoading,
    markAllRead,
  };
}
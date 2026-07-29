import { create } from 'zustand';

interface NotificationState {
  refreshRevision: number;
  requestRefresh: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  refreshRevision: 0,
  requestRefresh: () => set((state) => ({ refreshRevision: state.refreshRevision + 1 })),
}));

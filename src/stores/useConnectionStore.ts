import { create } from 'zustand';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface ConnectionState {
  status: ConnectionStatus;
  isBackendOnline: boolean;
  isAIAvailable: boolean;
  isChecking: boolean;
  lastCheckTime: number | null;
  errorMessage: string | null;
  retryCount: number;

  setStatus: (status: ConnectionStatus) => void;
  setConnected: (backendOnline: boolean, aiAvailable: boolean) => void;
  setDisconnected: (error?: string) => void;
  setChecking: (checking: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
  incrementRetry: () => void;
  resetRetry: () => void;
  reset: () => void;
}

const initialState = {
  status: 'connecting' as ConnectionStatus,
  isBackendOnline: false,
  isAIAvailable: false,
  isChecking: false,
  lastCheckTime: null as number | null,
  errorMessage: null as string | null,
  retryCount: 0,
};

export const useConnectionStore = create<ConnectionState>((set) => ({
  ...initialState,

  setStatus: (status) => set({ status }),

  setConnected: (backendOnline, aiAvailable) =>
    set({
      status: 'connected',
      isBackendOnline: backendOnline,
      isAIAvailable: aiAvailable,
      isChecking: false,
      lastCheckTime: Date.now(),
      errorMessage: null,
    }),

  setDisconnected: (error) =>
    set({
      status: 'disconnected',
      isBackendOnline: false,
      isAIAvailable: false,
      isChecking: false,
      errorMessage: error || '无法连接到后端服务',
    }),

  setChecking: (checking) => set({ isChecking: checking }),

  setReconnecting: (reconnecting) =>
    set({
      status: reconnecting ? 'reconnecting' : 'disconnected',
    }),

  incrementRetry: () => set((state) => ({ retryCount: state.retryCount + 1 })),

  resetRetry: () => set({ retryCount: 0 }),

  reset: () => set({ ...initialState }),
}));

export default useConnectionStore;

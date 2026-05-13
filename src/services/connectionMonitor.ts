import { useConnectionStore } from '../stores/useConnectionStore';

const HEALTH_CHECK_URL = 'http://localhost:9461/api/health';
const AI_HEALTH_URL = 'http://localhost:9461/api/ai/health';

const RETRY_INTERVALS = [2000, 4000, 8000, 16000, 30000];

const REGULAR_CHECK_INTERVAL = 15000;

let checkTimer: ReturnType<typeof setTimeout> | null = null;
let retryIndex = 0;
let isRunning = false;

async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(HEALTH_CHECK_URL, {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkAIHealth(): Promise<boolean> {
  try {
    const response = await fetch(AI_HEALTH_URL, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data?.status === 'online';
  } catch {
    return false;
  }
}

async function checkConnection(): Promise<void> {
  const store = useConnectionStore.getState();
  store.setChecking(true);

  try {
    const backendOnline = await checkBackendHealth();

    if (!backendOnline) {
      store.setDisconnected('后端服务未响应');
      scheduleRetry();
      return;
    }

    const aiAvailable = await checkAIHealth();

    store.setConnected(true, aiAvailable);
    retryIndex = 0;
    store.resetRetry();

    scheduleRegularCheck();
  } catch (error: any) {
    store.setDisconnected(error?.message || '连接检查异常');
    scheduleRetry();
  } finally {
    store.setChecking(false);
  }
}

function scheduleRetry(): void {
  if (!isRunning) return;

  const delay = RETRY_INTERVALS[Math.min(retryIndex, RETRY_INTERVALS.length - 1)];
  retryIndex++;

  const store = useConnectionStore.getState();
  store.setReconnecting(true);
  store.incrementRetry();

  clearTimer();
  checkTimer = setTimeout(() => {
    checkConnection();
  }, delay);
}

function scheduleRegularCheck(): void {
  clearTimer();
  checkTimer = setTimeout(() => {
    checkConnection();
  }, REGULAR_CHECK_INTERVAL);
}

function clearTimer(): void {
  if (checkTimer) {
    clearTimeout(checkTimer);
    checkTimer = null;
  }
}

export function startConnectionMonitor(): void {
  if (isRunning) return;
  isRunning = true;

  const store = useConnectionStore.getState();
  store.setStatus('connecting');

  checkConnection();
}

export function stopConnectionMonitor(): void {
  isRunning = false;
  clearTimer();

  const store = useConnectionStore.getState();
  store.reset();
}

export function manualReconnect(): void {
  retryIndex = 0;
  const store = useConnectionStore.getState();
  store.setReconnecting(true);
  clearTimer();
  checkConnection();
}

export function getConnectionSummary(): {
  icon: string;
  label: string;
  color: string;
} {
  const { status, isAIAvailable, isBackendOnline } = useConnectionStore.getState();

  switch (status) {
    case 'connected':
      if (isAIAvailable) {
        return { icon: 'wifi', label: '已连接', color: '#059669' };
      }
      if (isBackendOnline) {
        return { icon: 'alert-circle', label: 'AI服务异常', color: '#D97706' };
      }
      return { icon: 'alert-circle', label: '连接异常', color: '#D97706' };
    case 'connecting':
      return { icon: 'wifi-outline', label: '连接中...', color: '#64748B' };
    case 'reconnecting':
      return { icon: 'refresh', label: '重连中...', color: '#D97706' };
    case 'disconnected':
      return { icon: 'cloud-offline', label: '未连接', color: '#DC2626' };
    default:
      return { icon: 'help-circle', label: '未知状态', color: '#64748B' };
  }
}

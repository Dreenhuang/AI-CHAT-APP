/**
 * 自定义Hooks集合
 * 
 * 包含WebSocket、防抖、节流等常用Hook
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { wsService } from '../services/websocket';

// ============ WebSocket Hook ============

interface UseWebSocketOptions {
  /** 自动连接 */
  autoConnect?: boolean;
  /** 连接成功回调 */
  onConnected?: () => void;
  /** 断开连接回调 */
  onDisconnected?: () => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
}

/**
 * WebSocket连接Hook
 * 
 * @example
 * ```tsx
 * const { status, send, onMessage } = useWebSocket({ autoConnect: true });
 * 
 * useEffect(() => {
 *   onMessage('chat:message', (data) => {
 *     console.log('收到消息:', data);
 *   });
 * }, []);
 * ```
 */
export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { autoConnect = true, onConnected, onDisconnected, onError } = options;
  
  const [status, setStatus] = useState(wsService.getStatus());
  
  // 使用ref存储最新的callback，避免重复订阅
  const callbacksRef = useRef({ onConnected, onDisconnected, onError });
  callbacksRef.current = { onConnected, onDisconnected, onError };

  useEffect(() => {
    // 监听状态变化
    const unsubscribeStatus = wsService.onStatusChange((newStatus) => {
      setStatus(newStatus);
      
      switch (newStatus) {
        case 'connected':
          callbacksRef.current.onConnected?.();
          break;
        case 'disconnected':
          callbacksRef.current.onDisconnected?.();
          break;
      }
    });

    // 监听错误
    const unsubscribeError = wsService.onError((error) => {
      callbacksRef.current.onError?.(error);
    });

    // 自动连接
    if (autoConnect) {
      wsService.connect().catch(console.error);
    }

    return () => {
      unsubscribeStatus();
      unsubscribeError();
    };
  }, [autoConnect]);

  /**
   * 发送消息
   */
  const send = useCallback((type: string, data: any): boolean => {
    return wsService.send(type, data);
  }, []);

  /**
   * 订阅消息
   */
  const subscribe = useCallback((type: string, handler: (data: any) => void) => {
    return wsService.onMessage(type, handler);
  }, []);

  /**
   * 手动连接
   */
  const connect = useCallback(() => {
    return wsService.connect();
  }, []);

  /**
   * 手动断开
   */
  const disconnect = useCallback(() => {
    wsService.disconnect();
  }, []);

  return {
    status,
    send,
    subscribe,
    connect,
    disconnect,
    isConnected: status === 'connected',
  };
};

// ============ 防抖Hook ============

/**
 * 值防抖Hook
 * 
 * 当值快速变化时，只返回稳定后的值
 * 
 * @example
 * ```tsx
 * const [searchValue, setSearchValue] = useState('');
 * const debouncedValue = useDebounce(searchValue, 300);
 * 
 * // 只有在用户停止输入300ms后，debouncedValue才会更新
 * useEffect(() => {
 *   searchApi(debouncedValue);
 * }, [debouncedValue]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============ 节流Hook ============

/**
 * 函数节流Hook
 * 
 * 在指定时间间隔内只执行一次函数
 * 
 * @example
 * ```tsx
 * const handleScroll = useThrottle(() => {
 *   console.log('滚动位置:', scrollY);
 * }, 100);
 * 
 * <ScrollView onScroll={handleScroll}>
 * ```
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const lastRun = useRef<number>(0);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastRun.current >= delay) {
        lastRun.current = now;
        callback(...args);
      }
    },
    [callback, delay]
  ) as T;

  return throttledCallback;
}

// ============ 本地存储Hook ============

/**
 * 本地状态持久化Hook
 * 
 * 将React State同步到AsyncStorage
 * 
 * @example
 * ```tsx
 * const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // 从本地存储读取初始值
  useEffect(() => {
    // 在实际项目中使用 AsyncStorage
    // AsyncStorage.getItem(key).then(value => {
    //   if (value !== null) {
    //     setStoredValue(JSON.parse(value));
    //   }
    // });
    
    // Demo模式：直接使用初始值
    setStoredValue(initialValue);
  }, [key]);

  // 设置值并保存到本地存储
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      // AsyncStorage.setItem(key, JSON.stringify(valueToStore));
      return valueToStore;
    });
  }, [key]);

  return [storedValue, setValue];
}

// ============ 定时器Hook ============

/**
 * 定时器Hook
 * 
 * 提供安全的定时器管理，组件卸载时自动清理
 * 
 * @example
 * ```tsx
 * const { start, stop, isRunning } = useInterval(() => {
 *   setTime(prev => prev + 1);
 * }, 1000);
 * ```
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 记住最新的callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // 设置定时器
  useEffect(() => {
    if (delay === null) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      savedCallback.current?.();
    }, delay);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [delay]);

  const start = useCallback(() => {
    if (timerRef.current && delay !== null) {
      // 已经在运行
      return true;
    }
    if (delay !== null) {
      timerRef.current = setInterval(() => {
        savedCallback.current?.();
      }, delay);
      return true;
    }
    return false;
  }, [delay]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const isRunning = timerRef.current !== null;

  return { start, stop, isRunning };
}

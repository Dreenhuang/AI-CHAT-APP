/**
 * WebSocket封装 - WebSocket Service
 * 
 * 管理实时通信连接
 * 用于接收AI回复、Soul消息、辩论状态更新等
 */

import { Message } from '../types';

// ============ 配置 ============

/** WebSocket地址 */
const WS_URL = 'ws://localhost:9461/ws';

/** 重连间隔（毫秒） */
const RECONNECT_INTERVAL = 3000;

/** 最大重连次数 */
const MAX_RECONNECT_ATTEMPTS = 5;

// ============ 类型定义 ============

type WebSocketStatus = 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'reconnecting';

type MessageHandler = (data: any) => void;
type StatusChangeHandler = (status: WebSocketStatus) => void;
type ErrorHandler = (error: Error) => void;

// ============ WebSocket服务类 ============

class WebSocketService {
  private ws: WebSocket | null = null;
  private status: WebSocketStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  // 事件处理器
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private statusHandlers: Set<StatusChangeHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();

  /**
   * 连接WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && (this.status === 'connected' || this.status === 'connecting')) {
        resolve();
        return;
      }

      this.setStatus('connecting');

      try {
        this.ws = new WebSocket(WS_URL);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.setStatus('connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (e) {
            console.error('[WebSocket] Parse error:', e);
          }
        };

        this.ws.onclose = (event) => {
          console.log('[WebSocket] Disconnected:', event.code, event.reason);
          this.setStatus('disconnected');
          this.stopHeartbeat();
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          const err = new Error('WebSocket connection failed');
          this.notifyError(err);
          reject(err);
        };
      } catch (error) {
        this.setStatus('disconnected');
        reject(error);
      }
    });
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.setStatus('disconnecting');
    this.stopHeartbeat();
    this.clearReconnectTimer();

    if (this.ws) {
      this.ws.close(1000, 'User disconnect');
      this.ws = null;
    }

    this.setStatus('disconnected');
    this.reconnectAttempts = MAX_RECONNECT_ATTEMPTS; // 防止自动重连
  }

  /**
   * 发送消息
   */
  send(type: string, data: any): boolean {
    if (!this.ws || this.status !== 'connected') {
      console.warn('[WebSocket] Cannot send: not connected');
      return false;
    }

    const message = JSON.stringify({ type, data, timestamp: Date.now() });
    
    try {
      this.ws.send(message);
      return true;
    } catch (error) {
      console.error('[WebSocket] Send error:', error);
      return false;
    }
  }

  /**
   * 订阅特定类型的消息
   */
  onMessage(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);

    // 返回取消订阅函数
    return () => {
      this.messageHandlers.get(type)?.delete(handler);
    };
  }

  /**
   * 订阅状态变化
   */
  onStatusChange(handler: StatusChangeHandler): () => void {
    this.statusHandlers.add(handler);
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  /**
   * 订阅错误事件
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => {
      this.errorHandlers.delete(handler);
    };
  }

  /**
   * 获取当前状态
   */
  getStatus(): WebSocketStatus {
    return this.status;
  }

  // ============ 私有方法 ============

  private setStatus(status: WebSocketStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.statusHandlers.forEach(handler => handler(status));
  }

  private handleMessage(data: { type: string; [key: string]: any }): void {
    const { type, ...payload } = data;
    
    // 调用特定类型处理器
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.forEach(handler => handler(payload));
    }

    // 调用通用消息处理器（'*'）
    const allHandlers = this.messageHandlers.get('*');
    if (allHandlers) {
      allHandlers.forEach(handler => handler(data));
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send('ping', { timestamp: Date.now() });
    }, 30000); // 每30秒发送心跳
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log('[WebSocket] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[WebSocket] Reconnecting... Attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
    
    this.setStatus('reconnecting');

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        console.error('[WebSocket] Reconnect failed:', error);
      });
    }, RECONNECT_INTERVAL);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private notifyError(error: Error): void {
    this.errorHandlers.forEach(handler => handler(error));
  }
}

// ============ 导出单例 ============

export const wsService = new WebSocketService();

// ============ 便捷方法 ============

/**
 * 发送聊天消息
 */
export const sendChatMessage = (conversationId: string, content: string): boolean => 
  wsService.send('chat:message', { conversationId, content });

/**
 * 开始辩论
 */
export const startDebate = (conversationId: string, position: 'pro' | 'con'): boolean =>
  wsService.send('debate:start', { conversationId, position });

/**
 * 监听新消息
 */
export const onNewMessage = (handler: (message: Message) => void): () => void =>
  wsService.onMessage('chat:message', handler);

/**
 * 监听AI思考过程
 */
export const onAIThinking = (handler: (data: { content: string }) => void): () => void =>
  wsService.onMessage('ai:thinking', handler);

/**
 * 监听辩论结果
 */
export const onDebateResult = (handler: (data: any) => void): () => void =>
  wsService.onMessage('debate:result', handler);

export default wsService;

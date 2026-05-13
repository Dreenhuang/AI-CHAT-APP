import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useConnectionStore } from '../stores/useConnectionStore';
import { manualReconnect, getConnectionSummary } from '../services/connectionMonitor';

const SIGNAL_BAR_HEIGHTS = [6, 10, 14];

const ConnectionIndicator: React.FC = () => {
  const status = useConnectionStore((s) => s.status);
  const isAIAvailable = useConnectionStore((s) => s.isAIAvailable);
  const isBackendOnline = useConnectionStore((s) => s.isBackendOnline);
  const errorMessage = useConnectionStore((s) => s.errorMessage);
  const retryCount = useConnectionStore((s) => s.retryCount);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isReconnecting = status === 'reconnecting';
  const isDisconnected = status === 'disconnected';
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  useEffect(() => {
    if (isReconnecting || isConnecting) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();

      return () => pulse.stop();
    }

    if (isConnected || isDisconnected) {
      Animated.spring(fadeAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  }, [isReconnecting, isConnecting, isConnected, isDisconnected]);

  const getBarColor = (index: number): string => {
    if (isConnected) {
      if (isAIAvailable) return '#059669';
      return index === 0 ? '#D97706' : index === 1 ? '#059669' : '#059669';
    }
    if (isReconnecting) return '#D97706';
    if (isDisconnected || isConnecting) return '#CBD5E1';
    return '#CBD5E1';
  };

  const getBarOpacity = (index: number): number => {
    if (isConnected) return isAIAvailable ? 1 : index === 0 ? 1 : 0.4;
    if (isReconnecting) return 1;
    return 0.3;
  };

  const getStatusColor = (): string => {
    if (isConnected && isAIAvailable) return '#059669';
    if (isConnected && isBackendOnline) return '#D97706';
    if (isReconnecting) return '#D97706';
    if (isDisconnected) return '#DC2626';
    return '#64748B';
  };

  const getStatusText = (): string => {
    if (isConnected && isAIAvailable) return '已连接';
    if (isConnected && isBackendOnline) return 'AI服务异常';
    if (isReconnecting) return `重连中(${retryCount})`;
    if (isDisconnected) return '未连接';
    if (isConnecting) return '连接中';
    return '未知';
  };

  const handlePress = () => {
    if (isDisconnected || isReconnecting) {
      manualReconnect();
    }
  };

  const barOpacity = isReconnecting || isConnecting ? pulseAnim : new Animated.Value(1);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.indicator,
          {
            borderColor: getStatusColor(),
            opacity: isReconnecting || isConnecting ? pulseAnim : 1,
          },
        ]}
      >
        <View style={styles.barsContainer}>
          {SIGNAL_BAR_HEIGHTS.map((height, index) => (
            <View
              key={index}
              style={[
                styles.bar,
                {
                  height,
                  backgroundColor: getBarColor(index),
                  opacity: getBarOpacity(index),
                },
              ]}
            />
          ))}
        </View>

        {isDisconnected && (
          <View style={styles.xOverlay}>
            <Ionicons name="close" size={12} color="#DC2626" />
          </View>
        )}

        {isReconnecting && (
          <View style={styles.xOverlay}>
            <Ionicons name="sync" size={11} color="#D97706" />
          </View>
        )}
      </Animated.View>

      {isDisconnected && (
        <Text style={[styles.statusLabel, { color: '#DC2626' }]}>
          {getStatusText()}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  indicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
  xOverlay: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusLabel: {
    fontSize: 10,
    marginLeft: 3,
    fontWeight: '500',
  },
});

export default ConnectionIndicator;

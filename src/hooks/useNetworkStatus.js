import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Custom hook to monitor internet connectivity and trigger reconnection callbacks.
 * @param {Function} onReconnect - optional callback triggered when connection returns
 */
export function useNetworkStatus(onReconnect) {
  const [isConnected, setIsConnected] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const currentStatus = !!state.isConnected && !!state.isInternetReachable;
      
      setIsConnected(currentStatus);

      if (currentStatus && wasOffline) {
        // Back online!
        setWasOffline(false);
        if (onReconnect) {
          onReconnect();
        }
      } else if (!currentStatus) {
        // Lost internet
        setWasOffline(true);
      }
    });

    // Check initial state
    NetInfo.fetch().then(state => {
      setIsConnected(!!state.isConnected && !!state.isInternetReachable);
    });

    return () => unsubscribe();
  }, [wasOffline, onReconnect]);

  return isConnected;
}

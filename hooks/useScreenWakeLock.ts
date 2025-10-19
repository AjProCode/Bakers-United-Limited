
import { useState, useEffect, useCallback } from 'react';

export const useScreenWakeLock = () => {
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const isSupported = 'wakeLock' in navigator;

  const requestWakeLock = useCallback(async () => {
    if (!isSupported) return;
    try {
      const newWakeLock = await navigator.wakeLock.request('screen');
      newWakeLock.addEventListener('release', () => {
        setIsWakeLockActive(false);
        setWakeLock(null);
        console.log('Screen Wake Lock was released');
      });
      setWakeLock(newWakeLock);
      setIsWakeLockActive(true);
      console.log('Screen Wake Lock is active');
    } catch (err: any) {
      console.error(`${err.name}, ${err.message}`);
    }
  }, [isSupported]);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock) {
      await wakeLock.release();
      setWakeLock(null);
      setIsWakeLockActive(false);
    }
  }, [wakeLock]);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        wakeLock.release();
      }
    };
  }, [wakeLock, requestWakeLock]);

  return { isSupported, isWakeLockActive, requestWakeLock, releaseWakeLock };
};

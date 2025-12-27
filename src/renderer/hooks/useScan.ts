import { useEffect } from 'react';
import { useScanStore } from '../store/scanStore';

export function useScan() {
  const store = useScanStore();

  useEffect(() => {
    // Load cached results on mount
    store.loadCachedResults();
  }, []);

  return {
    isScanning: store.isScanning,
    progress: store.progress,
    result: store.result,
    error: store.error,
    lastScanTime: store.lastScanTime,
    startScan: store.startScan,
    cancelScan: store.cancelScan,
  };
}

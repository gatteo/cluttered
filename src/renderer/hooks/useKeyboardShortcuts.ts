import { useEffect } from 'react';
import { useUIStore } from '../store/uiStore';
import { useProjectStore } from '../store/projectStore';

export function useKeyboardShortcuts() {
  const { currentView, setView } = useUIStore();
  const { selectAll, deselectAll, selectedIds } = useProjectStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      // Cmd+, - Open Settings
      if (isMeta && e.key === ',') {
        e.preventDefault();
        setView('settings');
        return;
      }

      // Cmd+R - Refresh/Scan
      if (isMeta && e.key === 'r') {
        e.preventDefault();
        if (currentView === 'dashboard') {
          window.electronAPI.startScan({
            paths: ['~/'],
            excludePaths: [],
            ecosystems: [],
            followSymlinks: false,
          });
        }
        return;
      }

      // Cmd+A - Select All
      if (isMeta && !e.shiftKey && e.key === 'a') {
        e.preventDefault();
        selectAll();
        return;
      }

      // Cmd+Shift+A - Deselect All
      if (isMeta && e.shiftKey && e.key === 'a') {
        e.preventDefault();
        deselectAll();
        return;
      }

      // Escape - Go back or close
      if (e.key === 'Escape') {
        if (currentView !== 'dashboard') {
          setView('dashboard');
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, setView, selectAll, deselectAll, selectedIds]);
}

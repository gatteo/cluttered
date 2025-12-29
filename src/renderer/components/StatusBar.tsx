import { Settings } from 'lucide-react';
import { useScanStore } from '../store/scanStore';
import { formatRelativeTime } from '../utils/format';

interface StatusBarProps {
  onSettingsClick: () => void;
}

export function StatusBar({ onSettingsClick }: StatusBarProps) {
  const lastScanTime = useScanStore((s) => s.lastScanTime);

  return (
    <div className="h-12 px-4 flex items-center text-xs text-text-muted app-drag-region">
      {/* Left spacer for balance */}
      <div className="flex-1" />

      {/* Center - status info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          <span>Ready</span>
        </div>
        {lastScanTime && (
          <>
            <span className="text-white/10">•</span>
            <span>Last scan: {formatRelativeTime(lastScanTime)}</span>
          </>
        )}
      </div>

      {/* Right side - settings */}
      <div className="flex-1 flex justify-end">
        <button
          className="btn-subtle text-sm app-no-drag"
          onClick={onSettingsClick}
        >
          Settings
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
}

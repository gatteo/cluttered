import { useScanStore } from '../store/scanStore';
import { formatRelativeTime } from '../utils/format';

export function StatusBar() {
  const { result, lastScanTime } = useScanStore();

  const protectedCount = result?.projects.filter((p) => p.isProtected).length ?? 0;

  return (
    <div className="h-8 px-6 flex items-center justify-between text-xs text-text-muted border-t border-white/5 bg-surface-primary/50">
      <div className="flex items-center gap-4">
        {lastScanTime && (
          <>
            <span>Last scan: {formatRelativeTime(lastScanTime)}</span>
            <span>•</span>
            <span>Protected: {protectedCount} active projects</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="w-2 h-2 bg-green-500 rounded-full" />
        <span>Ready</span>
      </div>
    </div>
  );
}

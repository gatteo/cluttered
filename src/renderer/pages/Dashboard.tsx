import { useScan } from '../hooks/useScan'
import { useScanStore } from '../store/scanStore'
import { useUIStore } from '../store/uiStore'
import { DiskSpaceBar } from '../components/DiskSpaceBar'
import { HeroStats } from '../components/HeroStats'
import { EcosystemGrid } from '../components/EcosystemGrid'
import { ActionBar } from '../components/ActionBar'
import { ScanProgress } from '../components/ScanProgress'
import { StatusBar } from '../components/StatusBar'

export function Dashboard() {
  const { isScanning, progress, startScan, cancelScan } = useScan()
  const result = useScanStore((s) => s.result)
  const setView = useUIStore((s) => s.setView)

  return (
    <div className="h-screen flex flex-col">
      {/* Status bar with settings */}
      <StatusBar onSettingsClick={() => setView('settings')} />

      {/* Main content - centered with max width */}
      <div className="flex-1 overflow-auto px-8 py-6" style={{ willChange: 'scroll-position' }}>
        <div className="max-w-[950px] mx-auto">
          {/* Hero section */}
          <div className="glass-card-blur p-8 mb-8">
            {isScanning ? (
              <ScanProgress progress={progress} onCancel={cancelScan} />
            ) : (
              <>
                <HeroStats totalRecoverable={result?.totalSize ?? 0} projectCount={result?.totalProjects ?? 0} />
                <DiskSpaceBar />
              </>
            )}
          </div>

          {/* Ecosystem cards */}
          <EcosystemGrid ecosystems={result?.ecosystemSummary ?? []} />
        </div>

        {/* Action bar - hidden during scan */}
        {!isScanning && <ActionBar onScan={startScan} isScanning={isScanning} hasResults={!!result} />}
      </div>
    </div>
  )
}

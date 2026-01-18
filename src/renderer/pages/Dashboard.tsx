import { useState, useEffect } from 'react'
import { useScan } from '../hooks/useScan'
import { useScanStore } from '../store/scanStore'
import { useUIStore } from '../store/uiStore'
import { DiskSpaceBar } from '../components/DiskSpaceBar'
import { HeroStats } from '../components/HeroStats'
import { EcosystemGrid } from '../components/EcosystemGrid'
import { ActionBar } from '../components/ActionBar'
import { ScanProgress } from '../components/ScanProgress'
import { StatusBar } from '../components/StatusBar'
import { MASFolderSetup } from '../components/MASFolderSetup'

export function Dashboard() {
  const { isScanning, progress, startScan, cancelScan } = useScan()
  const result = useScanStore((s) => s.result)
  const setView = useUIStore((s) => s.setView)

  // MAS build detection and folder setup state
  const [isMASBuild, setIsMASBuild] = useState(false)
  const [needsFolderSetup, setNeedsFolderSetup] = useState(false)
  const [isCheckingMAS, setIsCheckingMAS] = useState(true)

  useEffect(() => {
    checkMASStatus()
  }, [])

  const checkMASStatus = async () => {
    try {
      const isMAS = await window.electronAPI.sandbox.isMASBuild()
      setIsMASBuild(isMAS)

      if (isMAS) {
        const hasAccess = await window.electronAPI.sandbox.hasAccessiblePaths()
        setNeedsFolderSetup(!hasAccess)
      }
    } catch (error) {
      console.error('Failed to check MAS status:', error)
    } finally {
      setIsCheckingMAS(false)
    }
  }

  const handleFolderSetupComplete = () => {
    setNeedsFolderSetup(false)
  }

  // Show loading while checking MAS status
  if (isCheckingMAS) {
    return (
      <div className="h-screen flex flex-col">
        <StatusBar onSettingsClick={() => setView('settings')} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple" />
        </div>
      </div>
    )
  }

  // Show folder setup for MAS builds that need it
  if (isMASBuild && needsFolderSetup) {
    return (
      <div className="h-screen flex flex-col">
        <StatusBar onSettingsClick={() => setView('settings')} />
        <div className="flex-1 overflow-auto px-8 py-12">
          <MASFolderSetup onComplete={handleFolderSetupComplete} />
        </div>
      </div>
    )
  }

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

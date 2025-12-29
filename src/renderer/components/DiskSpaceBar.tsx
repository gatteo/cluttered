import { memo, useEffect, useState } from 'react'
import { formatBytes } from '../utils/format'

interface DiskSpace {
  total: number
  used: number
  free: number
}

export const DiskSpaceBar = memo(function DiskSpaceBar() {
  const [diskSpace, setDiskSpace] = useState<DiskSpace | null>(null)

  useEffect(() => {
    window.electronAPI.getDiskSpace().then(setDiskSpace)
  }, [])

  if (!diskSpace) return <DiskSpaceBarSkeleton />

  const usedPercent = (diskSpace.used / diskSpace.total) * 100

  // Color based on usage
  const getBarColor = (percent: number) => {
    if (percent > 90) return 'from-red-500 to-red-600'
    if (percent > 75) return 'from-amber-500 to-orange-500'
    return 'from-green-500 to-emerald-500'
  }

  return (
    <div className="max-w-[500px] mx-auto">
      {/* Progress bar container */}
      <div className="h-3 bg-surface-interactive rounded-full overflow-hidden relative">
        {/* Used space */}
        <div
          className={`h-full bg-gradient-to-r ${getBarColor(usedPercent)} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${usedPercent}%` }}
        />
      </div>

      {/* Stats below bar */}
      <div className="flex justify-between mt-3 text-sm">
        <span className="text-text-muted">{formatBytes(diskSpace.used)} used</span>
        <span className="text-text-muted">{formatBytes(diskSpace.free)} free</span>
      </div>
    </div>
  )
})

function DiskSpaceBarSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-surface-interactive rounded-full" />
    </div>
  )
}

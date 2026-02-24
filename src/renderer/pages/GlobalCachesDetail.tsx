import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Check, HardDrive, Package, Wrench, Smartphone, FolderOpen, Info } from 'lucide-react'
import { useUIStore } from '../store/uiStore'
import { useScanStore } from '../store/scanStore'
import { formatBytes } from '../utils/format'

interface GlobalCache {
  id: string
  category: 'package-manager' | 'dev-tool' | 'mobile-dev'
  name: string
  description: string
  icon: string
  path: string
  size: number
  alwaysSafe: boolean
  cleanCommand?: string
  cautionNote?: string
}

function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative inline-block">
      <div onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
        {children}
      </div>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white tooltip w-64 text-center"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 tooltip-arrow" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const EMPTY_CACHES: GlobalCache[] = []

const categoryConfig = {
  'package-manager': {
    label: 'Package Manager Caches',
    icon: Package,
    color: '#A855F7',
  },
  'dev-tool': {
    label: 'Dev Tool Caches',
    icon: Wrench,
    color: '#3B82F6',
  },
  'mobile-dev': {
    label: 'Mobile Development',
    icon: Smartphone,
    color: '#F59E0B',
  },
} as const

export function GlobalCachesDetail() {
  const goBack = useUIStore((s) => s.goBack)
  const globalCaches = useScanStore((s) => s.result?.globalCaches ?? EMPTY_CACHES)
  const globalCachesSize = useScanStore((s) => s.result?.globalCachesSize ?? 0)
  const selectedIds = useScanStore((s) => s.selectedGlobalCacheIds)
  const toggleSelection = useScanStore((s) => s.toggleGlobalCacheSelection)
  const deselectAll = useScanStore((s) => s.deselectAllGlobalCaches)

  const grouped = useMemo(() => {
    const groups: Record<string, GlobalCache[]> = {
      'package-manager': [],
      'dev-tool': [],
      'mobile-dev': [],
    }
    for (const cache of globalCaches) {
      groups[cache.category]?.push(cache)
    }
    return groups
  }, [globalCaches])

  const selectedCaches = useMemo(() => globalCaches.filter((c) => selectedIds.has(c.id)), [globalCaches, selectedIds])
  const selectedSize = useMemo(() => selectedCaches.reduce((sum, c) => sum + c.size, 0), [selectedCaches])
  const allSelected = globalCaches.length > 0 && globalCaches.every((c) => selectedIds.has(c.id))
  const someSelected = selectedIds.size > 0

  const handleSelectAll = useCallback(() => {
    for (const cache of globalCaches) {
      if (!selectedIds.has(cache.id)) {
        toggleSelection(cache.id)
      }
    }
  }, [globalCaches, selectedIds, toggleSelection])

  const handleDeselectAll = useCallback(() => {
    deselectAll()
  }, [deselectAll])

  const handleOpenInFinder = useCallback((path: string) => {
    window.electronAPI.openInFinder(path)
  }, [])

  return (
    <div className="h-screen flex flex-col">
      {/* Title bar drag region */}
      <div className="h-8 app-drag-region" />

      {/* Header */}
      <div className="px-8 py-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={goBack} className="btn-subtle text-sm">
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent-purple/20 to-accent-pink/20 flex items-center justify-center">
              <HardDrive size={28} className="text-accent-purple" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Global Caches</h1>
              <p className="text-text-secondary">
                {globalCaches.length} {globalCaches.length === 1 ? 'cache' : 'caches'} •{' '}
                <span className="text-white">{formatBytes(globalCachesSize)}</span> total
                {selectedCaches.length > 0 && (
                  <span className="text-accent-purple ml-2">
                    • {formatBytes(selectedSize)} selected ({selectedCaches.length})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Selection buttons */}
          <div className="ml-auto flex items-center gap-2">
            {someSelected && (
              <button onClick={handleDeselectAll} className="btn-subtle text-sm">
                Deselect All
              </button>
            )}
            {!allSelected && globalCaches.length > 0 && (
              <button onClick={handleSelectAll} className="btn-subtle text-sm">
                Select All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cache list grouped by category */}
      <div className="flex-1 overflow-auto px-8 py-6">
        {globalCaches.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <p>No global caches found. Run a scan to discover caches.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {(Object.keys(categoryConfig) as Array<keyof typeof categoryConfig>).map((category) => {
              const caches = grouped[category]
              if (!caches || caches.length === 0) return null

              const config = categoryConfig[category]
              const Icon = config.icon
              const categorySize = caches.reduce((sum, c) => sum + c.size, 0)

              return (
                <div key={category}>
                  {/* Category header */}
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={14} style={{ color: config.color }} />
                    <span className="text-sm font-medium text-text-secondary">{config.label}</span>
                    <span className="text-xs text-text-muted ml-auto">{formatBytes(categorySize)}</span>
                  </div>

                  {/* Cache items */}
                  <div className="space-y-2">
                    {caches.map((cache, index) => {
                      const isSelected = selectedIds.has(cache.id)
                      return (
                        <motion.div
                          key={cache.id}
                          className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          onClick={() => toggleSelection(cache.id)}
                        >
                          {/* Checkbox */}
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-accent-purple border-accent-purple' : 'border-white/20'
                            }`}
                          >
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>

                          {/* Icon */}
                          <span className="text-lg shrink-0">{cache.icon}</span>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-white">{cache.name}</h3>
                              {!cache.alwaysSafe && (
                                <Tooltip content={cache.cautionNote || 'This item may affect your workflow if deleted'}>
                                  <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-accent-amber/10 text-accent-amber border border-accent-amber/20 inline-flex items-center gap-1 cursor-help">
                                    caution
                                    <Info size={10} />
                                  </span>
                                </Tooltip>
                              )}
                            </div>
                            <p className="text-text-muted text-sm truncate">{cache.description}</p>
                          </div>

                          {/* Size */}
                          <div className="text-right shrink-0">
                            <div className="font-medium text-white tabular-nums">{formatBytes(cache.size)}</div>
                          </div>

                          {/* Finder button */}
                          {!cache.cleanCommand && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenInFinder(cache.path)
                              }}
                              className="btn-ghost p-2 rounded-lg text-sm shrink-0"
                              title="Show in Finder"
                            >
                              <FolderOpen size={16} />
                            </button>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

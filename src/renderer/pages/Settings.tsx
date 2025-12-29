import { useState, useEffect, ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  Settings as SettingsIcon,
  Search,
  Target,
  Trash2,
  Package,
  History,
  Info,
  ArrowLeft,
  RotateCcw,
  Inbox,
} from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'
import { useUIStore } from '../store/uiStore'
import { GeneralSettings } from '../components/settings/GeneralSettings'
import { ScanningSettings } from '../components/settings/ScanningSettings'
import { DetectionSettings } from '../components/settings/DetectionSettings'
import { CleanupSettings } from '../components/settings/CleanupSettings'
import { EcosystemSettings } from '../components/settings/EcosystemSettings'
import { StatisticsDashboard } from '../components/StatisticsDashboard'
import { formatBytes, formatRelativeTime } from '../utils/format'

type SettingsTab = 'general' | 'scanning' | 'detection' | 'cleanup' | 'ecosystems' | 'history' | 'about'

interface DeletionLogEntry {
  id: string
  timestamp: Date
  projectPath: string
  projectName: string
  ecosystem: string
  artifacts: string[]
  totalSize: number
  trashedPath?: string
}

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const goBack = useUIStore((s) => s.goBack)
  const { loadSettings } = useSettingsStore()

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const tabs: { id: SettingsTab; label: string; icon: ReactNode }[] = [
    { id: 'general', label: 'General', icon: <SettingsIcon size={16} /> },
    { id: 'scanning', label: 'Scanning', icon: <Search size={16} /> },
    { id: 'detection', label: 'Detection', icon: <Target size={16} /> },
    { id: 'cleanup', label: 'Cleanup', icon: <Trash2 size={16} /> },
    { id: 'ecosystems', label: 'Ecosystems', icon: <Package size={16} /> },
    { id: 'history', label: 'History', icon: <History size={16} /> },
    { id: 'about', label: 'About', icon: <Info size={16} /> },
  ]

  return (
    <div className='h-screen flex flex-col'>
      <div className='h-8 app-drag-region' />

      <div className='flex-1 flex overflow-hidden'>
        {/* Sidebar */}
        <div className='w-56 bg-surface-primary border-r border-white/5 p-4 flex flex-col'>
          <button
            className='btn-subtle text-sm mb-4'
            onClick={goBack}
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <nav className='space-y-1 flex-1'>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`w-full px-3 py-2 rounded-lg text-left flex items-center gap-3 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-accent-purple/20 text-white'
                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className='w-6 h-6 rounded-md bg-surface-elevated flex items-center justify-center'>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-auto p-8'>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'general' && <GeneralSettings />}
            {activeTab === 'scanning' && <ScanningSettings />}
            {activeTab === 'detection' && <DetectionSettings />}
            {activeTab === 'cleanup' && <CleanupSettings />}
            {activeTab === 'ecosystems' && <EcosystemSettings />}
            {activeTab === 'history' && <HistorySection />}
            {activeTab === 'about' && <AboutSection />}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function HistorySection() {
  const [entries, setEntries] = useState<DeletionLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    window.electronAPI.getDeletionLog().then((data) => {
      setEntries(
        data.map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp),
        }))
      )
      setIsLoading(false)
    })
  }, [])

  const handleRestore = async (entryId: string) => {
    const success = await window.electronAPI.restoreFromLog(entryId)
    if (success) {
      setEntries((prev) => prev.filter((e) => e.id !== entryId))
    }
  }

  return (
    <div className='max-w-xl'>
      <h2 className='text-xl font-bold mb-4'>Deletion History</h2>

      <p className='text-text-muted mb-6'>Items are kept in Trash for 30 days and can be restored.</p>

      {isLoading ? (
        <div className='text-center py-8 text-text-muted'>Loading...</div>
      ) : entries.length === 0 ? (
        <div className='text-center py-8'>
          <Inbox size={48} className='mx-auto mb-4 text-text-muted' />
          <p className='text-text-muted'>No recent deletions</p>
        </div>
      ) : (
        <div className='space-y-2'>
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              className='bg-surface-elevated rounded-lg p-4 flex items-center justify-between'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className='flex-1 min-w-0'>
                <h3 className='font-medium'>{entry.projectName}</h3>
                <p className='text-text-muted text-sm truncate'>{entry.projectPath}</p>
                <p className='text-text-muted text-sm'>
                  {formatRelativeTime(entry.timestamp)} - {formatBytes(entry.totalSize)}
                </p>
              </div>

              <button
                className='btn-secondary px-3 py-1 rounded-lg text-sm ml-4 flex items-center gap-1.5'
                onClick={() => handleRestore(entry.id)}
              >
                <RotateCcw size={14} />
                Restore
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function AboutSection() {
  return (
    <div className='max-w-md'>
      <div className='text-center mb-8'>
        <div className='w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center'>
          <Trash2 size={40} className='text-white' />
        </div>
        <h1 className='text-2xl font-bold mt-4'>Cluttered</h1>
        <p className='text-text-muted'>Version 1.0.0-beta.1</p>
      </div>

      <StatisticsDashboard />

      <div className='mt-8 text-center text-text-muted text-sm'>
        <p>Made with care for developers</p>
        <p className='mt-4'>
          <a href='#' className='text-accent-purple hover:underline'>
            Report an issue
          </a>
          {' - '}
          <a href='#' className='text-accent-purple hover:underline'>
            View on GitHub
          </a>
        </p>
      </div>
    </div>
  )
}

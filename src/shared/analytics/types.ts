import { EcosystemId } from '../types'

// Provider configuration
export interface ProviderConfig {
  apiKey: string
  apiHost?: string
  debug?: boolean
}

// User properties set on identify
export interface UserProperties {
  app_version?: string
  platform?: 'darwin' | 'win32' | 'linux'
  arch?: string
  os_version?: string
  locale?: string
  theme?: 'light' | 'dark' | 'system'
}

// Event names
export type AnalyticsEventName =
  // App lifecycle
  | 'app_opened'
  | 'app_closed'
  // Scanning
  | 'scan_started'
  | 'scan_completed'
  | 'scan_cancelled'
  // Cleanup
  | 'cleanup_started'
  | 'cleanup_completed'
  | 'cleanup_failed'
  // UI interactions
  | 'ecosystem_viewed'
  | 'project_selected'
  | 'project_deselected'
  | 'settings_changed'
  // Features
  | 'protected_path_added'
  | 'protected_path_removed'

// Event property types
export interface AppOpenedProperties {
  version: string
  platform: string
  arch: string
}

export interface AppClosedProperties {
  session_duration_ms: number
}

export interface ScanStartedProperties {
  scan_paths_count: number
}

export interface ScanCompletedProperties {
  duration_ms: number
  projects_found: number
  total_size_bytes: number
  ecosystems: EcosystemId[]
}

export interface ScanCancelledProperties {
  duration_ms: number
  projects_found: number
}

export interface CleanupStartedProperties {
  project_count: number
  estimated_bytes: number
}

export interface CleanupCompletedProperties {
  project_count: number
  bytes_freed: number
  duration_ms: number
}

export interface CleanupFailedProperties {
  error_type: string
  project_count: number
}

export interface EcosystemViewedProperties {
  ecosystem: EcosystemId
}

export interface ProjectSelectedProperties {
  ecosystem: EcosystemId
  size_bytes: number
}

export interface ProjectDeselectedProperties {
  ecosystem: EcosystemId
}

export interface SettingsChangedProperties {
  setting_key: string
  new_value: unknown
}

// Union type for all event properties
export type EventProperties =
  | AppOpenedProperties
  | AppClosedProperties
  | ScanStartedProperties
  | ScanCompletedProperties
  | ScanCancelledProperties
  | CleanupStartedProperties
  | CleanupCompletedProperties
  | CleanupFailedProperties
  | EcosystemViewedProperties
  | ProjectSelectedProperties
  | ProjectDeselectedProperties
  | SettingsChangedProperties
  | Record<string, unknown>

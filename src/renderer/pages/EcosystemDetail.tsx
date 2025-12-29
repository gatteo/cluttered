import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, FolderOpen, Code, X, AlertTriangle } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { useScanStore } from '../store/scanStore';
import { useProjectStore } from '../store/projectStore';
import { ecosystemConfigs } from '../config/ecosystems';
import { formatBytes, formatRelativeTime } from '../utils/format';
import { EcosystemId, ProjectStatus, Project } from '../types';

// Confirmation modal for protected projects
function ProtectedProjectModal({
  project,
  onConfirm,
  onCancel,
}: {
  project: Project;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="glass-card p-6 max-w-md mx-4 text-center"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-amber-500/20">
            <AlertTriangle className="text-amber-400" size={24} />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Select Protected Project?
        </h3>
        <p className="text-text-secondary text-sm mb-4">
          <span className="text-white font-medium">{project.name}</span> has uncommitted git changes.
          Cleaning this project will permanently delete your unsaved work.
        </p>
        <p className="text-text-muted text-xs mb-4">
          {project.path}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="btn-ghost px-4 py-2 rounded-lg text-sm flex-1"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-4 py-2 rounded-lg text-sm flex-1 transition-colors"
          >
            Select Anyway
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Tooltip component
function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white tooltip whitespace-nowrap"
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
  );
}

// Status explanations
const statusInfo: Record<ProjectStatus, { label: string; tooltip: string; color: string }> = {
  active: {
    label: 'Active',
    tooltip: 'Modified in the last 7 days - handle with care',
    color: 'bg-green-500/20 text-green-400',
  },
  recent: {
    label: 'Recent',
    tooltip: 'Modified 7-30 days ago - review before cleaning',
    color: 'bg-yellow-500/20 text-yellow-400',
  },
  stale: {
    label: 'Stale',
    tooltip: 'Modified 30-90 days ago - likely safe to clean',
    color: 'bg-orange-500/20 text-orange-400',
  },
  dormant: {
    label: 'Dormant',
    tooltip: 'Not modified in 90+ days - safe to clean',
    color: 'bg-red-500/20 text-red-400',
  },
};

const allStatuses: ProjectStatus[] = ['active', 'recent', 'stale', 'dormant'];

interface EcosystemDetailProps {
  ecosystem: EcosystemId;
}

export function EcosystemDetail({ ecosystem }: EcosystemDetailProps) {
  const goBack = useUIStore((s) => s.goBack);
  const result = useScanStore((s) => s.result);
  const { selectedIds, toggleSelection } = useProjectStore();

  // Filter state
  const [showProtected, setShowProtected] = useState(true);
  const [showEmpty, setShowEmpty] = useState(false);
  const [statusFilters, setStatusFilters] = useState<Set<ProjectStatus>>(new Set(allStatuses));

  // Protected project confirmation
  const [pendingProtectedProject, setPendingProtectedProject] = useState<Project | null>(null);

  const config = ecosystemConfigs[ecosystem];
  const allProjects = result?.projects.filter((p) => p.ecosystem === ecosystem) ?? [];

  // Apply filters
  const filteredProjects = useMemo(() => {
    return allProjects.filter((p) => {
      if (!showProtected && p.isProtected) return false;
      if (!showEmpty && p.totalSize === 0) return false;
      if (!statusFilters.has(p.status)) return false;
      return true;
    });
  }, [allProjects, showProtected, showEmpty, statusFilters]);

  // Calculate totals
  const totalSize = allProjects.reduce((sum, p) => sum + p.totalSize, 0);
  const selectedInEcosystem = filteredProjects.filter((p) => selectedIds.has(p.id));
  const selectedSize = selectedInEcosystem.reduce((sum, p) => sum + p.totalSize, 0);

  const allSelected = filteredProjects.length > 0 &&
    filteredProjects.filter(p => !p.isProtected).every((p) => selectedIds.has(p.id));
  const someSelected = filteredProjects.some((p) => selectedIds.has(p.id));

  const handleSelectAll = () => {
    filteredProjects.forEach((p) => {
      if (!selectedIds.has(p.id) && !p.isProtected) {
        toggleSelection(p.id);
      }
    });
  };

  const handleDeselectAll = () => {
    filteredProjects.forEach((p) => {
      if (selectedIds.has(p.id)) {
        toggleSelection(p.id);
      }
    });
  };

  const toggleStatusFilter = (status: ProjectStatus) => {
    const newFilters = new Set(statusFilters);
    if (newFilters.has(status)) {
      newFilters.delete(status);
    } else {
      newFilters.add(status);
    }
    setStatusFilters(newFilters);
  };

  const activeFiltersCount =
    (!showProtected ? 1 : 0) +
    (!showEmpty ? 0 : 1) + // showEmpty defaults to false, so only count if true
    (statusFilters.size < 4 ? 1 : 0);

  const handleProjectClick = (project: Project) => {
    if (project.isProtected && !selectedIds.has(project.id)) {
      // Show confirmation modal for protected projects when selecting
      setPendingProtectedProject(project);
    } else {
      // Direct toggle for non-protected projects or when deselecting
      toggleSelection(project.id);
    }
  };

  const handleConfirmProtected = () => {
    if (pendingProtectedProject) {
      toggleSelection(pendingProtectedProject.id);
      setPendingProtectedProject(null);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Title bar drag region */}
      <div className="h-8 app-drag-region" />

      {/* Header */}
      <div className="px-8 py-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button
            onClick={goBack}
            className="btn-subtle text-sm"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="flex items-center gap-4">
            {config.iconImage ? (
              <img src={config.iconImage} alt={config.name} className="w-14 h-14 object-contain" />
            ) : (
              <span className="text-5xl">{config.icon}</span>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">{config.name}</h1>
              <p className="text-text-secondary">
                {filteredProjects.length} projects •{' '}
                <span className="text-white">{formatBytes(totalSize)}</span> total
                {selectedInEcosystem.length > 0 && (
                  <span className="text-accent-purple ml-2">
                    • {formatBytes(selectedSize)} selected ({selectedInEcosystem.length})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Selection buttons */}
          <div className="ml-auto flex items-center gap-2">
            {someSelected && (
              <button
                onClick={handleDeselectAll}
                className="btn-subtle text-sm"
              >
                Deselect All
              </button>
            )}
            {!allSelected && filteredProjects.some(p => !p.isProtected) && (
              <button
                onClick={handleSelectAll}
                className="btn-subtle text-sm"
              >
                Select All Cleanable
              </button>
            )}
          </div>
        </div>

        {/* Filters - always visible */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {/* Status filters */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Status:</span>
            {allStatuses.map((status) => {
              const isActive = statusFilters.has(status);
              return (
                <Tooltip key={status} content={statusInfo[status].tooltip}>
                  <button
                    onClick={() => toggleStatusFilter(status)}
                    className={`px-2.5 py-1 rounded-full text-xs transition-all flex items-center gap-1.5 ${
                      isActive
                        ? statusInfo[status].color
                        : 'bg-white/5 text-text-muted'
                    }`}
                  >
                    {isActive && <Check size={10} />}
                    {statusInfo[status].label}
                  </button>
                </Tooltip>
              );
            })}
          </div>

          <div className="w-px h-4 bg-white/10" />

          {/* Show/hide toggles */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Show:</span>
            <Tooltip content="Show projects with uncommitted changes">
              <button
                onClick={() => setShowProtected(!showProtected)}
                className={`px-2.5 py-1 rounded-full text-xs transition-all flex items-center gap-1.5 ${
                  showProtected
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-white/5 text-text-muted'
                }`}
              >
                {showProtected && <Check size={10} />}
                Protected
              </button>
            </Tooltip>
            <Tooltip content="Show projects with no cleanable files">
              <button
                onClick={() => setShowEmpty(!showEmpty)}
                className={`px-2.5 py-1 rounded-full text-xs transition-all flex items-center gap-1.5 ${
                  showEmpty
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-text-muted'
                }`}
              >
                {showEmpty && <Check size={10} />}
                Empty (0 B)
              </button>
            </Tooltip>
          </div>

          {/* Reset filters */}
          {activeFiltersCount > 0 && (
            <>
              <div className="w-px h-4 bg-white/10" />
              <button
                onClick={() => {
                  setShowProtected(true);
                  setShowEmpty(false);
                  setStatusFilters(new Set(allStatuses));
                }}
                className="btn-subtle text-xs"
              >
                <X size={12} />
                Reset
              </button>
            </>
          )}
        </div>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-auto px-8 py-6">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <p>No projects match the current filters.</p>
            <button
              onClick={() => {
                setShowProtected(true);
                setShowEmpty(false);
                setStatusFilters(new Set(allStatuses));
              }}
              className="text-accent-purple hover:underline mt-2"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => handleProjectClick(project)}
              >
                {/* Checkbox */}
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedIds.has(project.id)
                      ? project.isProtected
                        ? 'bg-amber-500 border-amber-500'
                        : 'bg-accent-purple border-accent-purple'
                      : 'border-white/20'
                  }`}
                >
                  {selectedIds.has(project.id) && <Check size={12} className="text-white" />}
                </div>

                {/* Project info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white truncate">{project.name}</h3>
                    {project.isProtected && (
                      <Tooltip content={project.protectionReason || 'This project is protected from cleaning'}>
                        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full cursor-help">
                          Protected
                        </span>
                      </Tooltip>
                    )}
                    <Tooltip content={statusInfo[project.status].tooltip}>
                      <span className={`text-xs px-2 py-0.5 rounded-full cursor-help ${statusInfo[project.status].color}`}>
                        {statusInfo[project.status].label}
                      </span>
                    </Tooltip>
                  </div>
                  <p className="text-text-muted text-sm truncate">{project.path}</p>
                </div>

                {/* Size */}
                <div className="text-right">
                  <div className="font-medium text-white">{formatBytes(project.totalSize)}</div>
                  <div className="text-xs text-text-muted">
                    {formatRelativeTime(project.lastModified)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.electronAPI.openInFinder(project.path);
                    }}
                    className="btn-ghost p-2 rounded-lg text-sm"
                    title="Open in Finder"
                  >
                    <FolderOpen size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.electronAPI.openInVSCode(project.path);
                    }}
                    className="btn-ghost p-2 rounded-lg text-sm"
                    title="Open in VS Code"
                  >
                    <Code size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Protected project confirmation modal */}
      <AnimatePresence>
        {pendingProtectedProject && (
          <ProtectedProjectModal
            project={pendingProtectedProject}
            onConfirm={handleConfirmProtected}
            onCancel={() => setPendingProtectedProject(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

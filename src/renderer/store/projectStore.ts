import { create } from 'zustand';

type ProjectStatus = 'active' | 'recent' | 'stale' | 'dormant';
type EcosystemId = string;

interface Project {
  id: string;
  path: string;
  name: string;
  ecosystem: EcosystemId;
  status: ProjectStatus;
  lastModified: Date;
  lastGitCommit?: Date;
  hasUncommittedChanges: boolean;
  isProtected: boolean;
  protectionReason?: string;
  totalSize: number;
  artifacts: Array<{
    pattern: string;
    description: string;
    size: number;
    path: string;
  }>;
}

interface ProjectFilters {
  ecosystem: EcosystemId | 'all';
  status: ProjectStatus | 'all';
  minSize: number;
}

interface ScanResult {
  projects: Project[];
  totalSize: number;
  totalProjects: number;
  scanDuration: number;
  ecosystemSummary: Array<{
    ecosystem: string;
    projectCount: number;
    totalSize: number;
    cleanableSize: number;
  }>;
}

interface ProjectState {
  projects: Project[];
  result: ScanResult | null;
  selectedIds: Set<string>;
  filters: ProjectFilters;
  sortBy: 'size' | 'lastModified' | 'name' | 'status';
  sortOrder: 'asc' | 'desc';

  // Actions
  setProjects: (projects: Project[]) => void;
  setResult: (result: ScanResult) => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  selectAllCleanable: () => void;
  setFilter: <K extends keyof ProjectFilters>(key: K, value: ProjectFilters[K]) => void;
  setSort: (sortBy: ProjectState['sortBy'], order: ProjectState['sortOrder']) => void;

  // Computed (these are functions that compute values)
  getFilteredProjects: () => Project[];
  getSelectedProjects: () => Project[];
  getTotalSelectedSize: () => number;
  getEcosystemSummary: () => Array<{
    ecosystem: string;
    projectCount: number;
    totalSize: number;
    cleanableSize: number;
  }>;
}

const statusOrder: Record<ProjectStatus, number> = {
  dormant: 0,
  stale: 1,
  recent: 2,
  active: 3,
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  result: null,
  selectedIds: new Set<string>(),
  filters: {
    ecosystem: 'all',
    status: 'all',
    minSize: 0,
  },
  sortBy: 'size',
  sortOrder: 'desc',

  setResult: (result) => {
    const parsed = result.projects.map((p) => ({
      ...p,
      lastModified: new Date(p.lastModified),
      lastGitCommit: p.lastGitCommit ? new Date(p.lastGitCommit) : undefined,
    }));
    set({ result: { ...result, projects: parsed }, projects: parsed, selectedIds: new Set() });
  },

  setProjects: (projects) => {
    // Parse dates if they're strings
    const parsed = projects.map((p) => ({
      ...p,
      lastModified: new Date(p.lastModified),
      lastGitCommit: p.lastGitCommit ? new Date(p.lastGitCommit) : undefined,
    }));
    set({ projects: parsed, selectedIds: new Set() });
  },

  toggleSelection: (id) => {
    const selected = new Set(get().selectedIds);
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    set({ selectedIds: selected });
  },

  selectAll: () => {
    const ids = get().getFilteredProjects().map((p) => p.id);
    set({ selectedIds: new Set(ids) });
  },

  deselectAll: () => set({ selectedIds: new Set() }),

  selectAllCleanable: () => {
    const ids = get()
      .getFilteredProjects()
      .filter((p) => !p.isProtected && p.status !== 'active')
      .map((p) => p.id);
    set({ selectedIds: new Set(ids) });
  },

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  setSort: (sortBy, sortOrder) => set({ sortBy, sortOrder }),

  getFilteredProjects: () => {
    const { projects, filters, sortBy, sortOrder } = get();

    let filtered = projects.filter((p) => {
      if (filters.ecosystem !== 'all' && p.ecosystem !== filters.ecosystem) return false;
      if (filters.status !== 'all' && p.status !== filters.status) return false;
      if (p.totalSize < filters.minSize) return false;
      return true;
    });

    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'size':
          cmp = a.totalSize - b.totalSize;
          break;
        case 'lastModified':
          cmp = a.lastModified.getTime() - b.lastModified.getTime();
          break;
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'status':
          cmp = statusOrder[a.status] - statusOrder[b.status];
          break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return filtered;
  },

  getSelectedProjects: () => {
    const { projects, selectedIds } = get();
    return projects.filter((p) => selectedIds.has(p.id));
  },

  getTotalSelectedSize: () => {
    return get()
      .getSelectedProjects()
      .reduce((sum, p) => sum + p.totalSize, 0);
  },

  getEcosystemSummary: () => {
    const { projects } = get();
    const byEcosystem = new Map<string, Project[]>();

    for (const project of projects) {
      const list = byEcosystem.get(project.ecosystem) || [];
      list.push(project);
      byEcosystem.set(project.ecosystem, list);
    }

    return Array.from(byEcosystem.entries())
      .map(([ecosystem, projects]) => ({
        ecosystem,
        projectCount: projects.length,
        totalSize: projects.reduce((sum, p) => sum + p.totalSize, 0),
        cleanableSize: projects
          .filter((p) => !p.isProtected)
          .reduce((sum, p) => sum + p.totalSize, 0),
      }))
      .sort((a, b) => b.totalSize - a.totalSize);
  },
}));

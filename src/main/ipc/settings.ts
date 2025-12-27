import { Settings, Statistics } from '../../shared/types';
import { settingsRepo } from '../database/repositories/settings';
import { statisticsRepo } from '../database/repositories/statistics';
import { appStateRepo } from '../database/repositories/appState';

export const settingsHandlers = {
  get(): Settings {
    return settingsRepo.get();
  },

  set(settings: Settings): void {
    settingsRepo.set(settings);
  },

  reset(): Settings {
    return settingsRepo.reset();
  },

  getStats(): Statistics {
    return statisticsRepo.get();
  },

  isFirstRun(): boolean {
    return appStateRepo.isFirstRun();
  },
};

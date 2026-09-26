import { getSettings } from '../config/core';
import { UICoverageTrackerStorage } from '../tracker/storage';

export const clearResults = async (): Promise<void> => {
  const storage = new UICoverageTrackerStorage({ settings: getSettings() });
  await storage.clear();
};

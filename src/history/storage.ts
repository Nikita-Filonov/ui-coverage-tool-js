import fs from 'fs/promises';
import path from 'path';
import { AppHistoryState, CoverageHistoryState } from './models';
import { getLogger } from '../tools/logger';
import { loadJson } from '../tools/json';
import { CoverageReportState } from '../reports/models';
import { buildSelectorKey } from './selector';
import { Settings } from '../config/models';
import { isPathExists } from '../tools/files';

const logger = getLogger('UI_COVERAGE_HISTORY_STORAGE');

export class UICoverageHistoryStorage {
  private settings: Settings;

  constructor({ settings }: { settings: Settings }) {
    this.settings = settings;
  }

  async load(): Promise<CoverageHistoryState> {
    const historyFile = this.settings.historyFile;

    if (!historyFile) {
      logger.debug('No history file path provided, returning empty history state');
      return { apps: {} };
    }

    if (!(await isPathExists(historyFile))) {
      logger.error(`History file not found: ${historyFile}, returning empty history state`);
      return { apps: {} };
    }

    try {
      logger.info(`Loading history from file: ${historyFile}`);
      const content = await fs.readFile(historyFile, 'utf-8');
      return loadJson<CoverageHistoryState>({ content, fallback: { apps: {} } });
    } catch (error) {
      logger.error(`Error loading history from file ${historyFile}: ${error}`);
      return { apps: {} };
    }
  }

  async save(state: CoverageHistoryState): Promise<void> {
    const historyFile = this.settings.historyFile;

    if (!historyFile) {
      logger.debug('History file path is not defined, skipping history save');
      return;
    }

    try {
      await fs.mkdir(path.dirname(historyFile), { recursive: true });
      await fs.writeFile(historyFile, JSON.stringify(state), 'utf-8');
      logger.info(`History state saved to file: ${historyFile}`);
    } catch (error) {
      logger.error(`Error saving history to file ${historyFile}: ${error}`);
    }
  }

  async saveFromReport(report: CoverageReportState): Promise<void> {
    const state: CoverageHistoryState = { apps: {} };

    for (const app of this.settings.apps) {
      const coverage = report.appsCoverage[app.key];
      if (!coverage) continue;

      const appState: AppHistoryState = { total: coverage.history, elements: {} };

      for (const element of coverage.elements) {
        const key = buildSelectorKey(element);
        appState.elements[key] = element.history;
      }

      state.apps[app.key] = appState;
    }

    await this.save(state);
  }
}

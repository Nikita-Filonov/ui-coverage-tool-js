import fs from 'fs';
import path from 'path';
import { AppHistoryState, CoverageHistoryState } from './models';
import { getLogger } from '../tools/logger';
import { loadJson } from '../tools/json';
import { CoverageReportState } from '../reports/models';
import { buildSelectorKey } from './selector';
import { Settings } from '../config/models';

const logger = getLogger('UI_COVERAGE_HISTORY_STORAGE');

export class UICoverageHistoryStorage {
  private settings: Settings;

  constructor(settings: Settings) {
    this.settings = settings;
  }

  load(): CoverageHistoryState {
    const historyFile = this.settings.historyFile;

    if (!historyFile) {
      logger.debug('No history file path provided, returning empty history state');
      return { apps: {} };
    }

    if (!fs.existsSync(historyFile)) {
      logger.error(`History file not found: ${historyFile}, returning empty history state`);
      return { apps: {} };
    }

    try {
      logger.info(`Loading history from file: ${historyFile}`);
      const content = fs.readFileSync(historyFile, 'utf-8');
      return loadJson<CoverageHistoryState>({ content, fallback: { apps: {} } });
    } catch (error) {
      logger.error(`Error loading history from file ${historyFile}: ${error}`);
      return { apps: {} };
    }
  }

  save(state: CoverageHistoryState): void {
    const historyFile = this.settings.historyFile;

    if (!historyFile) {
      logger.debug('History file path is not defined, skipping history save');
      return;
    }

    try {
      fs.mkdirSync(path.dirname(historyFile), { recursive: true });
      fs.writeFileSync(historyFile, JSON.stringify(state), 'utf-8');
      logger.info(`History state saved to file: ${historyFile}`);
    } catch (error) {
      logger.error(`Error saving history to file ${historyFile}: ${error}`);
    }
  }

  saveFromReport(report: CoverageReportState): void {
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

    this.save(state);
  }
}

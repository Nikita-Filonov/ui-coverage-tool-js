import { getLogger } from '../tools/logger';
import { UICoverageTrackerStorage } from '../tracker/storage';
import { UICoverageHistoryStorage } from '../history/storage';
import { CoverageReportState } from '../reports/models';
import { UICoverageBuilder } from '../coverage/builder';
import { UICoverageHistoryBuilder } from '../history/builder';
import { UIReportsStorage } from '../reports/storage';
import { getSettings } from '../config/core';
import { getDefaultAppHistoryState } from '../history/default';

const logger = getLogger('SAVE_REPORT');

export const saveReport = () => {
  logger.info('Starting to save the report');

  const settings = getSettings();

  const reportsStorage = new UIReportsStorage(settings);
  const trackerStorage = new UICoverageTrackerStorage(settings);
  const historyStorage = new UICoverageHistoryStorage(settings);

  const reportState: CoverageReportState = {
    config: { apps: settings.apps },
    createdAt: new Date(),
    appsCoverage: {}
  };
  const historyState = historyStorage.load();
  const trackerState = trackerStorage.load();
  for (const app of settings.apps) {
    const resultsList = trackerState.filter({ app: app.key });

    const history = historyState.apps[app.key] || getDefaultAppHistoryState();
    const historyBuilder = new UICoverageHistoryBuilder({ history, settings });
    const coverageBuilder = new UICoverageBuilder({ resultsList, historyBuilder });
    reportState.appsCoverage[app.key] = coverageBuilder.build();
  }

  historyStorage.saveFromReport(reportState);
  reportsStorage.saveJsonReport(reportState);
  reportsStorage.saveHtmlReport(reportState);

  logger.info('Report saving process completed');
};
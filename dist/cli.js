#!/usr/bin/env node
import {
  ActionType,
  UICoverageTrackerStorage,
  getLogger,
  getSettings,
  isPathExists,
  loadJson,
  unpackSelectorGroupKey
} from "./chunk-QS54SRUL.js";

// src/cli.ts
import { Command } from "commander";

// src/history/storage.ts
import fs from "fs/promises";
import path from "path";

// src/history/selector.ts
var buildSelectorKey = ({ selector, selectorType }) => {
  return `${selectorType}_${selector}`;
};

// src/history/storage.ts
var logger = getLogger("UI_COVERAGE_HISTORY_STORAGE");
var UICoverageHistoryStorage = class {
  constructor({ settings }) {
    this.settings = settings;
  }
  async load() {
    const historyFile = this.settings.historyFile;
    if (!historyFile) {
      logger.debug("No history file path provided, returning empty history state");
      return { apps: {} };
    }
    if (!await isPathExists(historyFile)) {
      logger.error(`History file not found: ${historyFile}, returning empty history state`);
      return { apps: {} };
    }
    try {
      logger.info(`Loading history from file: ${historyFile}`);
      const content = await fs.readFile(historyFile, "utf-8");
      return loadJson({ content, fallback: { apps: {} } });
    } catch (error) {
      logger.error(`Error loading history from file ${historyFile}: ${error}`);
      return { apps: {} };
    }
  }
  async save(state) {
    const historyFile = this.settings.historyFile;
    if (!historyFile) {
      logger.debug("History file path is not defined, skipping history save");
      return;
    }
    try {
      await fs.mkdir(path.dirname(historyFile), { recursive: true });
      await fs.writeFile(historyFile, JSON.stringify(state), "utf-8");
      logger.info(`History state saved to file: ${historyFile}`);
    } catch (error) {
      logger.error(`Error saving history to file ${historyFile}: ${error}`);
    }
  }
  async saveFromReport(report) {
    const state = { apps: {} };
    for (const app of this.settings.apps) {
      const coverage = report.appsCoverage[app.key];
      if (!coverage) continue;
      const appState = { total: coverage.history, elements: {} };
      for (const element of coverage.elements) {
        const key = buildSelectorKey(element);
        appState.elements[key] = element.history;
      }
      state.apps[app.key] = appState;
    }
    await this.save(state);
  }
};

// src/coverage/builder.ts
var UICoverageBuilder = class {
  constructor({ resultsList, historyBuilder }) {
    this.resultsList = resultsList;
    this.historyBuilder = historyBuilder;
  }
  buildElementCoverage({ results, selector, selectorType }) {
    const actions = Object.values(ActionType).map((action) => ({ type: action, count: results.countAction(action) })).filter((action) => action.count > 0);
    const history = this.historyBuilder.getElementHistory({ actions, selector, selectorType });
    return { history, actions, selector, selectorType };
  }
  build() {
    const actions = [];
    for (const [action, results] of this.resultsList.groupedByAction.entries()) {
      if (results.totalActions > 0) {
        actions.push({ type: action, count: results.totalActions });
      }
    }
    const elements = [];
    for (const [selectorGroupKey, results] of this.resultsList.groupedBySelector.entries()) {
      const [selector, selectorType] = unpackSelectorGroupKey(selectorGroupKey);
      elements.push(this.buildElementCoverage({ results, selector, selectorType }));
    }
    const history = this.historyBuilder.getAppHistory({
      actions,
      totalActions: this.resultsList.totalActions,
      totalElements: this.resultsList.totalSelectors
    });
    return { history, elements };
  }
};

// src/history/builder.ts
var UICoverageHistoryBuilder = class {
  constructor({ history, settings }) {
    this.history = history;
    this.settings = settings;
    this.createdAt = /* @__PURE__ */ new Date();
  }
  buildAppHistory({ actions, totalActions, totalElements }) {
    return { actions, createdAt: this.createdAt, totalActions, totalElements };
  }
  buildElementHistory({ actions }) {
    return { actions, createdAt: this.createdAt };
  }
  appendHistory({ history, buildFunc }) {
    if (!this.settings.historyFile) {
      return [];
    }
    const newItem = buildFunc();
    if (!newItem.actions || newItem.actions.length === 0) {
      return history;
    }
    const combined = [...history, newItem].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
    return combined.slice(-this.settings.historyRetentionLimit);
  }
  getAppHistory(props) {
    return this.appendHistory({
      history: this.history.total,
      buildFunc: () => this.buildAppHistory(props)
    });
  }
  getElementHistory({ actions, selector, selectorType }) {
    const key = buildSelectorKey({ selector, selectorType });
    const history = this.history.elements[key] || [];
    return this.appendHistory({
      history,
      buildFunc: () => this.buildElementHistory({ actions })
    });
  }
};

// src/reports/storage.ts
import fs2 from "fs/promises";
import path2 from "path";
var logger2 = getLogger("UI_REPORTS_STORAGE");
var UIReportsStorage = class {
  constructor({ settings }) {
    this.settings = settings;
  }
  async injectStateIntoHtml(state) {
    const stateJson = JSON.stringify(state);
    const templateFile = this.settings.htmlReportTemplateFile;
    if (!templateFile || !await isPathExists(templateFile)) {
      logger2.error("Template HTML report file not found.");
      return "";
    }
    const html = await fs2.readFile(templateFile, "utf-8");
    const scriptRegex = /<script id="state" type="application\/json">[\s\S]*?<\/script>/gi;
    const scriptTag = `<script id="state" type="application/json">${stateJson}</script>`;
    return html.replace(scriptRegex, scriptTag);
  }
  async saveJsonReport(state) {
    const file = this.settings.jsonReportFile;
    if (!file) {
      logger2.info("JSON report file is not configured \u2014 skipping JSON report generation.");
      return;
    }
    try {
      await fs2.mkdir(path2.dirname(file), { recursive: true });
      await fs2.writeFile(file, JSON.stringify(state, null, 2));
      logger2.info(`JSON report saved to ${file}`);
    } catch (error) {
      logger2.error(`Failed to write JSON report: ${error}`);
    }
  }
  async saveHtmlReport(state) {
    const file = this.settings.htmlReportFile;
    if (!file) {
      logger2.info("HTML report file is not configured \u2014 skipping HTML report generation.");
      return;
    }
    try {
      const content = await this.injectStateIntoHtml(state);
      await fs2.mkdir(path2.dirname(file), { recursive: true });
      await fs2.writeFile(file, content, "utf-8");
      logger2.info(`HTML report saved to ${file}`);
    } catch (error) {
      logger2.error(`Failed to write HTML report: ${error}`);
    }
  }
};

// src/history/default.ts
var getDefaultAppHistoryState = () => ({
  total: [],
  elements: {}
});

// src/commands/save-report.ts
var logger3 = getLogger("SAVE_REPORT");
var saveReport = async () => {
  logger3.info("Starting to save the report");
  const settings = getSettings();
  const reportsStorage = new UIReportsStorage({ settings });
  const trackerStorage = new UICoverageTrackerStorage({ settings });
  const historyStorage = new UICoverageHistoryStorage({ settings });
  const reportState = {
    config: { apps: settings.apps },
    createdAt: /* @__PURE__ */ new Date(),
    appsCoverage: {}
  };
  const historyState = await historyStorage.load();
  const trackerState = await trackerStorage.load();
  for (const app of settings.apps) {
    const resultsList = trackerState.filter({ app: app.key });
    const history = historyState.apps[app.key] || getDefaultAppHistoryState();
    const historyBuilder = new UICoverageHistoryBuilder({ history, settings });
    const coverageBuilder = new UICoverageBuilder({ resultsList, historyBuilder });
    reportState.appsCoverage[app.key] = coverageBuilder.build();
  }
  await historyStorage.saveFromReport(reportState);
  await reportsStorage.saveJsonReport(reportState);
  await reportsStorage.saveHtmlReport(reportState);
  logger3.info("Report saving process completed");
};

// src/commands/print-config.ts
var logger4 = getLogger("PRINT_CONFIG");
var printConfig = () => {
  const settings = getSettings();
  logger4.info(JSON.stringify(settings, null, 2));
};

// src/cli.ts
var program = new Command();
program.name("ui-coverage-tool").description("UI Coverage CLI Tool").version("0.19.0");
program.command("save-report").description("Generate a coverage report based on collected result files.").action(saveReport);
program.command("print-config").description("Print the resolved configuration to the console.").action(printConfig);
program.parse(process.argv);
//# sourceMappingURL=cli.js.map
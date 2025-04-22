#!/usr/bin/env node
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/cli.ts
var import_commander = require("commander");

// src/tools/logger.ts
var getLogger = (name) => ({
  info: (msg) => console.info(`[${name}] ${msg}`),
  debug: (msg) => console.debug(`[${name}] ${msg}`),
  error: (msg) => console.error(`[${name}] ${msg}`),
  warning: (msg) => console.warn(`[${name}] ${msg}`)
});

// src/tracker/storage.ts
var import_promises2 = __toESM(require("fs/promises"), 1);
var import_path = __toESM(require("path"), 1);
var import_uuid = require("uuid");

// src/tracker/selector.ts
var buildSelectorGroupKey = ({ selector, selectorType }) => {
  return `${encodeURIComponent(selector)}|${selectorType}`;
};
var unpackSelectorGroupKey = (key) => {
  const [selector, selectorType] = key.split("|");
  return [decodeURIComponent(selector), selectorType];
};

// src/tracker/models.ts
var CoverageResultList = class _CoverageResultList {
  constructor({ results }) {
    this.results = results;
  }
  filter({ app }) {
    const filtered = this.results.filter((r) => !app || r.app.toLowerCase() === app.toLowerCase());
    return new _CoverageResultList({ results: filtered });
  }
  get groupedByAction() {
    return this.groupBy((r) => r.actionType);
  }
  get groupedBySelector() {
    return this.groupBy((r) => buildSelectorGroupKey(r));
  }
  get totalActions() {
    return this.results.length;
  }
  get totalSelectors() {
    return this.groupedBySelector.size;
  }
  countAction(actionType) {
    return this.results.filter((r) => r.actionType === actionType).length;
  }
  groupBy(keyGetter) {
    const map = /* @__PURE__ */ new Map();
    for (const result of this.results) {
      const key = keyGetter(result);
      const results = map.get(key) || [];
      results.push(result);
      map.set(key, results);
    }
    const resultMap = /* @__PURE__ */ new Map();
    for (const [key, group] of map.entries()) {
      resultMap.set(key, new _CoverageResultList({ results: group }));
    }
    return resultMap;
  }
};

// src/tools/files.ts
var import_fs = __toESM(require("fs"), 1);
var import_js_yaml = __toESM(require("js-yaml"), 1);
var import_promises = __toESM(require("fs/promises"), 1);
var logger = getLogger("FILES");
var isPathExists = async (path5) => {
  try {
    await import_promises.default.access(path5);
    return true;
  } catch (error) {
    return false;
  }
};
var loadFromJson = (file) => {
  try {
    if (!import_fs.default.existsSync(file)) return {};
    const raw = import_fs.default.readFileSync(file, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    logger.warning(`Failed to load JSON config ${file}: ${error}`);
    return {};
  }
};
var loadFromYaml = (file) => {
  try {
    if (!import_fs.default.existsSync(file)) return {};
    const raw = import_fs.default.readFileSync(file, "utf-8");
    return import_js_yaml.default.load(raw);
  } catch (error) {
    logger.warning(`Failed to load YAML config ${file}: ${error}`);
    return {};
  }
};

// src/tracker/storage.ts
var logger2 = getLogger("UI_COVERAGE_TRACKER_STORAGE");
var UICoverageTrackerStorage = class {
  constructor({ settings }) {
    this.settings = settings;
  }
  async load() {
    const resultsDir = this.settings.resultsDir;
    logger2.info(`Loading coverage results from directory: ${resultsDir}`);
    if (!await isPathExists(resultsDir)) {
      logger2.warning(`Results directory does not exist: ${resultsDir}`);
      return new CoverageResultList({ results: [] });
    }
    const results = [];
    for (const fileName of await import_promises2.default.readdir(resultsDir)) {
      const file = import_path.default.join(resultsDir, fileName);
      const fileStats = await import_promises2.default.stat(file);
      if (fileStats.isFile() && fileName.endsWith(".json")) {
        try {
          const json = await import_promises2.default.readFile(file, "utf-8");
          results.push(JSON.parse(json));
        } catch (error) {
          logger2.warning(`Failed to parse file ${fileName}: ${error}`);
        }
      }
    }
    logger2.info(`Loaded ${results.length} coverage files from directory: ${resultsDir}`);
    return new CoverageResultList({ results });
  }
  async save(coverage) {
    const resultsDir = this.settings.resultsDir;
    if (!await isPathExists(resultsDir)) {
      logger2.info(`Results directory does not exist, creating: ${resultsDir}`);
      await import_promises2.default.mkdir(resultsDir, { recursive: true });
    }
    const file = import_path.default.join(resultsDir, `${(0, import_uuid.v4)()}.json`);
    try {
      await import_promises2.default.writeFile(file, JSON.stringify(coverage), "utf-8");
    } catch (error) {
      logger2.error(`Error saving coverage data to file ${file}: ${error}`);
    }
  }
};

// src/history/storage.ts
var import_promises3 = __toESM(require("fs/promises"), 1);
var import_path2 = __toESM(require("path"), 1);

// src/tools/json.ts
var logger3 = getLogger("JSON");
var loadJson = ({ content, fallback }) => {
  try {
    return JSON.parse(content, (key, value) => {
      switch (key) {
        case "createdAt":
          return new Date(value);
        default:
          return value;
      }
    });
  } catch (error) {
    logger3.warning(`Failed to parse JSON: ${error}`);
    return fallback;
  }
};

// src/history/selector.ts
var buildSelectorKey = ({ selector, selectorType }) => {
  return `${selectorType}_${selector}`;
};

// src/history/storage.ts
var logger4 = getLogger("UI_COVERAGE_HISTORY_STORAGE");
var UICoverageHistoryStorage = class {
  constructor({ settings }) {
    this.settings = settings;
  }
  async load() {
    const historyFile = this.settings.historyFile;
    if (!historyFile) {
      logger4.debug("No history file path provided, returning empty history state");
      return { apps: {} };
    }
    if (!await isPathExists(historyFile)) {
      logger4.error(`History file not found: ${historyFile}, returning empty history state`);
      return { apps: {} };
    }
    try {
      logger4.info(`Loading history from file: ${historyFile}`);
      const content = await import_promises3.default.readFile(historyFile, "utf-8");
      return loadJson({ content, fallback: { apps: {} } });
    } catch (error) {
      logger4.error(`Error loading history from file ${historyFile}: ${error}`);
      return { apps: {} };
    }
  }
  async save(state) {
    const historyFile = this.settings.historyFile;
    if (!historyFile) {
      logger4.debug("History file path is not defined, skipping history save");
      return;
    }
    try {
      await import_promises3.default.mkdir(import_path2.default.dirname(historyFile), { recursive: true });
      await import_promises3.default.writeFile(historyFile, JSON.stringify(state), "utf-8");
      logger4.info(`History state saved to file: ${historyFile}`);
    } catch (error) {
      logger4.error(`Error saving history to file ${historyFile}: ${error}`);
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

// src/tools/actions.ts
var ActionType = /* @__PURE__ */ ((ActionType2) => {
  ActionType2["Fill"] = "FILL";
  ActionType2["Type"] = "TYPE";
  ActionType2["Select"] = "SELECT";
  ActionType2["Click"] = "CLICK";
  ActionType2["Hover"] = "HOVER";
  ActionType2["Text"] = "TEXT";
  ActionType2["Value"] = "VALUE";
  ActionType2["Hidden"] = "HIDDEN";
  ActionType2["Visible"] = "VISIBLE";
  ActionType2["Checked"] = "CHECKED";
  ActionType2["Enabled"] = "ENABLED";
  ActionType2["Disabled"] = "DISABLED";
  ActionType2["Unchecked"] = "UNCHECKED";
  return ActionType2;
})(ActionType || {});

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
var import_promises4 = __toESM(require("fs/promises"), 1);
var import_path3 = __toESM(require("path"), 1);
var logger5 = getLogger("UI_REPORTS_STORAGE");
var UIReportsStorage = class {
  constructor({ settings }) {
    this.settings = settings;
  }
  async injectStateIntoHtml(state) {
    const stateJson = JSON.stringify(state);
    const templateFile = this.settings.htmlReportTemplateFile;
    if (!templateFile || !await isPathExists(templateFile)) {
      logger5.error("Template HTML report file not found.");
      return "";
    }
    const html = await import_promises4.default.readFile(templateFile, "utf-8");
    const scriptRegex = /<script id="state" type="application\/json">[\s\S]*?<\/script>/gi;
    const scriptTag = `<script id="state" type="application/json">${stateJson}</script>`;
    return html.replace(scriptRegex, scriptTag);
  }
  async saveJsonReport(state) {
    const file = this.settings.jsonReportFile;
    if (!file) {
      logger5.info("JSON report file is not configured \u2014 skipping JSON report generation.");
      return;
    }
    try {
      await import_promises4.default.mkdir(import_path3.default.dirname(file), { recursive: true });
      await import_promises4.default.writeFile(file, JSON.stringify(state, null, 2));
      logger5.info(`JSON report saved to ${file}`);
    } catch (error) {
      logger5.error(`Failed to write JSON report: ${error}`);
    }
  }
  async saveHtmlReport(state) {
    const file = this.settings.htmlReportFile;
    if (!file) {
      logger5.info("HTML report file is not configured \u2014 skipping HTML report generation.");
      return;
    }
    try {
      const content = await this.injectStateIntoHtml(state);
      await import_promises4.default.mkdir(import_path3.default.dirname(file), { recursive: true });
      await import_promises4.default.writeFile(file, content, "utf-8");
      logger5.info(`HTML report saved to ${file}`);
    } catch (error) {
      logger5.error(`Failed to write HTML report: ${error}`);
    }
  }
};

// src/config/builders.ts
var import_path4 = __toESM(require("path"), 1);
var import_url = __toESM(require("url"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_meta = {};
import_dotenv.default.config();
var cwd = process.cwd();
var cleanUndefined = (input) => {
  return Object.fromEntries(Object.entries(input).filter(([_, v]) => v !== void 0));
};
var buildEnvSettings = () => cleanUndefined({
  apps: loadJson({ content: process.env.UI_COVERAGE_APPS || "", fallback: [] }),
  resultsDir: process.env.UI_COVERAGE_RESULTS_DIR || void 0,
  historyFile: process.env.UI_COVERAGE_HISTORY_FILE || void 0,
  historyRetentionLimit: parseInt(process.env.UI_COVERAGE_HISTORY_RETENTION_LIMIT || "", 10) || void 0,
  htmlReportFile: process.env.UI_COVERAGE_HTML_REPORT_FILE || void 0,
  jsonReportFile: process.env.UI_COVERAGE_JSON_REPORT_FILE || void 0
});
var buildJsonSettings = () => {
  return cleanUndefined(
    loadFromJson(import_path4.default.join(cwd, "ui-coverage.config.json"))
  );
};
var buildYamlSettings = () => {
  return cleanUndefined(
    loadFromYaml(import_path4.default.join(cwd, "ui-coverage.config.yaml"))
  );
};
var buildDefaultSettings = () => {
  const cwd2 = process.cwd();
  let htmlReportTemplateFile;
  try {
    htmlReportTemplateFile = import_path4.default.join(import_path4.default.dirname(import_url.default.fileURLToPath(import_meta.url)), "reports/templates/index.html");
  } catch (err) {
    htmlReportTemplateFile = import_path4.default.join(cwd2, "src/reports/templates/index.html");
  }
  return {
    apps: [],
    resultsDir: import_path4.default.join(cwd2, "coverage-results"),
    historyFile: import_path4.default.join(cwd2, "coverage-history.json"),
    historyRetentionLimit: 30,
    htmlReportFile: import_path4.default.join(cwd2, "index.html"),
    jsonReportFile: import_path4.default.join(cwd2, "coverage-report.json"),
    htmlReportTemplateFile
  };
};

// src/config/core.ts
var getSettings = () => {
  const defaultSettings = buildDefaultSettings();
  return {
    ...defaultSettings,
    ...buildYamlSettings(),
    ...buildJsonSettings(),
    ...buildEnvSettings(),
    htmlReportTemplateFile: defaultSettings.htmlReportTemplateFile
  };
};

// src/history/default.ts
var getDefaultAppHistoryState = () => ({
  total: [],
  elements: {}
});

// src/commands/save-report.ts
var logger6 = getLogger("SAVE_REPORT");
var saveReport = async () => {
  logger6.info("Starting to save the report");
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
  logger6.info("Report saving process completed");
};

// src/commands/print-config.ts
var logger7 = getLogger("PRINT_CONFIG");
var printConfig = () => {
  const settings = getSettings();
  logger7.info(JSON.stringify(settings, null, 2));
};

// src/cli.ts
var program = new import_commander.Command();
program.name("ui-coverage-tool").description("UI Coverage CLI Tool").version("0.19.0");
program.command("save-report").description("Generate a coverage report based on collected result files.").action(saveReport);
program.command("print-config").description("Print the resolved configuration to the console.").action(printConfig);
program.parse(process.argv);
//# sourceMappingURL=cli.cjs.map
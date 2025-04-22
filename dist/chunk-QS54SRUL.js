#!/usr/bin/env node

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

// src/tools/logger.ts
var getLogger = (name) => ({
  info: (msg) => console.info(`[${name}] ${msg}`),
  debug: (msg) => console.debug(`[${name}] ${msg}`),
  error: (msg) => console.error(`[${name}] ${msg}`),
  warning: (msg) => console.warn(`[${name}] ${msg}`)
});

// src/tracker/storage.ts
import fs2 from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

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
import fs from "fs";
import yaml from "js-yaml";
import fsAsync from "fs/promises";
var logger = getLogger("FILES");
var isPathExists = async (path3) => {
  try {
    await fsAsync.access(path3);
    return true;
  } catch (error) {
    return false;
  }
};
var loadFromJson = (file) => {
  try {
    if (!fs.existsSync(file)) return {};
    const raw = fs.readFileSync(file, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    logger.warning(`Failed to load JSON config ${file}: ${error}`);
    return {};
  }
};
var loadFromYaml = (file) => {
  try {
    if (!fs.existsSync(file)) return {};
    const raw = fs.readFileSync(file, "utf-8");
    return yaml.load(raw);
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
    for (const fileName of await fs2.readdir(resultsDir)) {
      const file = path.join(resultsDir, fileName);
      const fileStats = await fs2.stat(file);
      if (fileStats.isFile() && fileName.endsWith(".json")) {
        try {
          const json = await fs2.readFile(file, "utf-8");
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
      await fs2.mkdir(resultsDir, { recursive: true });
    }
    const file = path.join(resultsDir, `${uuidv4()}.json`);
    try {
      await fs2.writeFile(file, JSON.stringify(coverage), "utf-8");
    } catch (error) {
      logger2.error(`Error saving coverage data to file ${file}: ${error}`);
    }
  }
};

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

// src/config/builders.ts
import path2 from "path";
import url from "url";
import dotenv from "dotenv";
dotenv.config();
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
    loadFromJson(path2.join(cwd, "ui-coverage.config.json"))
  );
};
var buildYamlSettings = () => {
  return cleanUndefined(
    loadFromYaml(path2.join(cwd, "ui-coverage.config.yaml"))
  );
};
var buildDefaultSettings = () => {
  const cwd2 = process.cwd();
  let htmlReportTemplateFile;
  try {
    htmlReportTemplateFile = path2.join(path2.dirname(url.fileURLToPath(import.meta.url)), "reports/templates/index.html");
  } catch (err) {
    htmlReportTemplateFile = path2.join(cwd2, "src/reports/templates/index.html");
  }
  return {
    apps: [],
    resultsDir: path2.join(cwd2, "coverage-results"),
    historyFile: path2.join(cwd2, "coverage-history.json"),
    historyRetentionLimit: 30,
    htmlReportFile: path2.join(cwd2, "index.html"),
    jsonReportFile: path2.join(cwd2, "coverage-report.json"),
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

export {
  ActionType,
  getLogger,
  unpackSelectorGroupKey,
  isPathExists,
  UICoverageTrackerStorage,
  loadJson,
  getSettings
};
//# sourceMappingURL=chunk-QS54SRUL.js.map
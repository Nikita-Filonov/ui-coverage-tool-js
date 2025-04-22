#!/usr/bin/env node
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  ActionType: () => ActionType,
  SelectorType: () => SelectorType,
  UICoverageTracker: () => UICoverageTracker
});
module.exports = __toCommonJS(src_exports);

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

// src/tools/selector.ts
var SelectorType = /* @__PURE__ */ ((SelectorType2) => {
  SelectorType2["CSS"] = "CSS";
  SelectorType2["XPath"] = "XPATH";
  return SelectorType2;
})(SelectorType || {});

// src/tracker/storage.ts
var import_promises2 = __toESM(require("fs/promises"), 1);
var import_path = __toESM(require("path"), 1);
var import_uuid = require("uuid");

// src/tools/logger.ts
var getLogger = (name) => ({
  info: (msg) => console.info(`[${name}] ${msg}`),
  debug: (msg) => console.debug(`[${name}] ${msg}`),
  error: (msg) => console.error(`[${name}] ${msg}`),
  warning: (msg) => console.warn(`[${name}] ${msg}`)
});

// src/tracker/selector.ts
var buildSelectorGroupKey = ({ selector, selectorType }) => {
  return `${encodeURIComponent(selector)}|${selectorType}`;
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
var isPathExists = async (path3) => {
  try {
    await import_promises.default.access(path3);
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
var import_path2 = __toESM(require("path"), 1);
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
    loadFromJson(import_path2.default.join(cwd, "ui-coverage.config.json"))
  );
};
var buildYamlSettings = () => {
  return cleanUndefined(
    loadFromYaml(import_path2.default.join(cwd, "ui-coverage.config.yaml"))
  );
};
var buildDefaultSettings = () => {
  const cwd2 = process.cwd();
  let htmlReportTemplateFile;
  try {
    htmlReportTemplateFile = import_path2.default.join(import_path2.default.dirname(import_url.default.fileURLToPath(import_meta.url)), "reports/templates/index.html");
  } catch (err) {
    htmlReportTemplateFile = import_path2.default.join(cwd2, "src/reports/templates/index.html");
  }
  return {
    apps: [],
    resultsDir: import_path2.default.join(cwd2, "coverage-results"),
    historyFile: import_path2.default.join(cwd2, "coverage-history.json"),
    historyRetentionLimit: 30,
    htmlReportFile: import_path2.default.join(cwd2, "index.html"),
    jsonReportFile: import_path2.default.join(cwd2, "coverage-report.json"),
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

// src/tracker/core.ts
var UICoverageTracker = class {
  constructor({ app, settings }) {
    this.app = app;
    this.settings = settings || getSettings();
    this.storage = new UICoverageTrackerStorage({ settings: this.settings });
  }
  async trackCoverage({ selector, actionType, selectorType }) {
    await this.storage.save({ app: this.app, selector, actionType, selectorType });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ActionType,
  SelectorType,
  UICoverageTracker
});
//# sourceMappingURL=index.cjs.map
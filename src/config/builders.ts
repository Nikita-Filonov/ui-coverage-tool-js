import { AppConfig, Settings } from './models';
import { loadJson } from '../tools/json';
import { loadFromJson, loadFromYaml } from '../tools/files';
import path from 'path';
import url from 'url';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const cleanUndefined = <T>(input: Partial<T>): Partial<T> => {
  return Object.fromEntries(Object.entries(input).filter((entry) => entry[1] !== undefined)) as Partial<T>;
};

export const buildEnvSettings = (): Partial<Settings> =>
  cleanUndefined({
    apps: process.env.UI_COVERAGE_APPS
      ? loadJson<AppConfig[]>({ content: process.env.UI_COVERAGE_APPS, fallback: [] })
      : undefined,
    resultsDir: process.env.UI_COVERAGE_RESULTS_DIR || undefined,
    historyFile: process.env.UI_COVERAGE_HISTORY_FILE || undefined,
    historyRetentionLimit: parseInt(process.env.UI_COVERAGE_HISTORY_RETENTION_LIMIT || '', 10) || undefined,
    htmlReportFile: process.env.UI_COVERAGE_HTML_REPORT_FILE || undefined,
    jsonReportFile: process.env.UI_COVERAGE_JSON_REPORT_FILE || undefined
  });

export const buildJsonSettings = () => {
  return cleanUndefined(loadFromJson<Settings>(path.join(process.cwd(), 'ui-coverage.config.json')));
};

export const buildYamlSettings = () => {
  return cleanUndefined(loadFromYaml<Settings>(path.join(process.cwd(), 'ui-coverage.config.yaml')));
};

export const buildDefaultSettings = (): Settings => {
  const cwd = process.cwd();
  const moduleDir = path.dirname(url.fileURLToPath(import.meta.url));
  const templateDir = path.basename(moduleDir) === 'config' ? path.dirname(moduleDir) : moduleDir;
  const htmlReportTemplateFile = path.join(templateDir, 'reports/templates/index.html');

  return {
    apps: [],
    resultsDir: path.join(cwd, 'coverage-results'),
    historyFile: path.join(cwd, 'coverage-history.json'),
    historyRetentionLimit: 30,
    htmlReportFile: path.join(cwd, 'index.html'),
    jsonReportFile: path.join(cwd, 'coverage-report.json'),
    htmlReportTemplateFile
  };
};

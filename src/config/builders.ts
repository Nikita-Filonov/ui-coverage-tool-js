import { AppConfig, Settings } from './models';
import { loadJson } from '../tools/json';
import { loadFromJson, loadFromYaml } from '../tools/files';
import path from 'path';
import url from 'url';
import dotenv from 'dotenv';

dotenv.config();

const cwd = process.cwd();

const cleanUndefined = <T>(input: Partial<T>): Partial<T> => {
  return Object.fromEntries(Object.entries(input).filter(([_, v]) => v !== undefined)) as Partial<T>;
};

export const buildEnvSettings = (): Partial<Settings> => cleanUndefined({
  apps: loadJson<AppConfig[]>({ content: process.env.UI_COVERAGE_APPS || '', fallback: [] }),
  resultsDir: process.env.UI_COVERAGE_RESULTS_DIR || undefined,
  historyFile: process.env.UI_COVERAGE_HISTORY_FILE || undefined,
  historyRetentionLimit: parseInt(process.env.UI_COVERAGE_HISTORY_RETENTION_LIMIT || '', 10) || undefined,
  htmlReportFile: process.env.UI_COVERAGE_HTML_REPORT_FILE || undefined,
  jsonReportFile: process.env.UI_COVERAGE_JSON_REPORT_FILE || undefined
});

export const buildJsonSettings = () => {
  return cleanUndefined(
    loadFromJson<Settings>(path.join(cwd, 'ui-coverage.config.json'))
  );
};

export const buildYamlSettings = () => {
  return cleanUndefined(
    loadFromYaml<Partial<Settings>>(path.join(cwd, 'ui-coverage.config.yaml'))
  );
};

export const buildDefaultSettings = (): Settings => {
  const cwd = process.cwd();

  let htmlReportTemplateFile: string;
  try {
    htmlReportTemplateFile = path.join(path.dirname(url.fileURLToPath(import.meta.url)), 'reports/templates/index.html');
  } catch (err) {
    htmlReportTemplateFile = path.join(cwd, 'src/reports/templates/index.html');
  }

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
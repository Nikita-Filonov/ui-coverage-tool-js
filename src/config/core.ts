import path from 'path';
import dotenv from 'dotenv';
import { AppConfig, Settings } from './models';
import { loadJson } from '../tools/json';
import { loadFromJson, loadFromYaml } from '../tools/files';
import { defaultSettings } from './default';

dotenv.config();

const cleanUndefined = <T>(input: Partial<T>): Partial<T> => {
  return Object.fromEntries(Object.entries(input).filter(([_, v]) => v !== undefined)) as Partial<T>;
};

export const getSettings = (): Settings => {
  const cwd = process.cwd();

  const envSettings: Partial<Settings> = cleanUndefined({
    apps: loadJson<AppConfig[]>({ content: process.env.UI_COVERAGE_APPS || '', fallback: [] }),
    resultsDir: process.env.UI_COVERAGE_RESULTS_DIR || undefined,
    historyFile: process.env.UI_COVERAGE_HISTORY_FILE || undefined,
    historyRetentionLimit: parseInt(process.env.UI_COVERAGE_HISTORY_RETENTION_LIMIT || '', 10) || undefined,
    htmlReportFile: process.env.UI_COVERAGE_HTML_REPORT_FILE || undefined,
    jsonReportFile: process.env.UI_COVERAGE_JSON_REPORT_FILE || undefined
  });
  const jsonSettings = cleanUndefined(
    loadFromJson<Partial<Settings>>(path.join(cwd, 'ui-coverage.config.json'))
  );
  const yamlSettings = cleanUndefined(
    loadFromYaml<Partial<Settings>>(path.join(cwd, 'ui-coverage.config.yaml'))
  );


  return {
    ...defaultSettings,
    ...yamlSettings,
    ...jsonSettings,
    ...envSettings,
    htmlReportTemplateFile: defaultSettings.htmlReportTemplateFile
  };
};

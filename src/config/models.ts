import { AppKey, AppName } from '../tools/types';

export type AppConfig = {
  key: AppKey;
  url: string;
  name: AppName;
  tags?: string[];
  repository?: string;
};

export type Settings = {
  apps: AppConfig[];
  resultsDir: string;
  historyFile: string | null;
  historyRetentionLimit: number;
  htmlReportFile: string | null;
  jsonReportFile: string | null;
  htmlReportTemplateFile: string;
};
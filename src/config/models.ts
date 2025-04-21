export type AppConfig = {
  key: string;
  url: string;
  name: string;
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
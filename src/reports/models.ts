import { AppKey } from '../tools/types';
import { AppCoverage } from '../coverage/models';
import { AppConfig } from '../config/models';

export interface CoverageReportConfig {
  apps: AppConfig[];
}

export interface CoverageReportState {
  config: CoverageReportConfig;
  createdAt: Date;
  appsCoverage: Record<AppKey, AppCoverage>;
}


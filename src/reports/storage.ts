import fs from 'fs';
import path from 'path';
import { CoverageReportState } from './models';
import { getLogger } from '../tools/logger';
import { Settings } from '../config/models';

const logger = getLogger('UI_REPORTS_STORAGE');

export class UIReportsStorage {
  constructor(private settings: Settings) {
  }

  private injectStateIntoHtml(state: CoverageReportState): string {
    const stateJson = JSON.stringify(state);
    const templateFile = this.settings.htmlReportTemplateFile;

    if (!templateFile || !fs.existsSync(templateFile)) {
      logger.error('Template HTML report file not found.');
      return '';
    }

    const html = fs.readFileSync(templateFile, 'utf-8');

    const scriptRegex = /<script id="state" type="application\/json">[\s\S]*?<\/script>/gi;
    const scriptTag = `<script id="state" type="application/json">${stateJson}</script>`;

    return html.replace(scriptRegex, scriptTag);
  }

  saveJsonReport(state: CoverageReportState): void {
    const file = this.settings.jsonReportFile;

    if (!file) {
      logger.info('JSON report file is not configured — skipping JSON report generation.');
      return;
    }

    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(state, null, 2));
      logger.info(`JSON report saved to ${file}`);
    } catch (error) {
      logger.error(`Failed to write JSON report: ${error}`);
    }
  }

  saveHtmlReport(state: CoverageReportState): void {
    const file = this.settings.htmlReportFile;

    if (!file) {
      logger.info('HTML report file is not configured — skipping HTML report generation.');
      return;
    }

    try {
      const content = this.injectStateIntoHtml(state);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content, 'utf-8');
      logger.info(`HTML report saved to ${file}`);
    } catch (error) {
      logger.error(`Failed to write HTML report: ${error}`);
    }
  }
}

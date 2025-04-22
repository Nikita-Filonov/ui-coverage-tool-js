import fs from 'fs/promises';
import path from 'path';
import { CoverageReportState } from './models';
import { getLogger } from '../tools/logger';
import { Settings } from '../config/models';
import { isPathExists } from '../tools/files';

const logger = getLogger('UI_REPORTS_STORAGE');

export class UIReportsStorage {
  private settings: Settings;

  constructor({ settings }: { settings: Settings }) {
    this.settings = settings;
  }

  private async injectStateIntoHtml(state: CoverageReportState): Promise<string> {
    const stateJson = JSON.stringify(state);
    const templateFile = this.settings.htmlReportTemplateFile;

    if (!templateFile || !(await isPathExists(templateFile))) {
      logger.error('Template HTML report file not found.');
      return '';
    }

    const html = await fs.readFile(templateFile, 'utf-8');

    const scriptRegex = /<script id="state" type="application\/json">[\s\S]*?<\/script>/gi;
    const scriptTag = `<script id="state" type="application/json">${stateJson}</script>`;

    return html.replace(scriptRegex, scriptTag);
  }

  async saveJsonReport(state: CoverageReportState): Promise<void> {
    const file = this.settings.jsonReportFile;

    if (!file) {
      logger.info('JSON report file is not configured — skipping JSON report generation.');
      return;
    }

    try {
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, JSON.stringify(state, null, 2));
      logger.info(`JSON report saved to ${file}`);
    } catch (error) {
      logger.error(`Failed to write JSON report: ${error}`);
    }
  }

  async saveHtmlReport(state: CoverageReportState): Promise<void> {
    const file = this.settings.htmlReportFile;

    if (!file) {
      logger.info('HTML report file is not configured — skipping HTML report generation.');
      return;
    }

    try {
      const content = await this.injectStateIntoHtml(state);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, content, 'utf-8');
      logger.info(`HTML report saved to ${file}`);
    } catch (error) {
      logger.error(`Failed to write HTML report: ${error}`);
    }
  }
}

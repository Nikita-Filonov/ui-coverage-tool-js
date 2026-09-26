import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'node:crypto';
import { getLogger } from '../tools/logger';
import { CoverageResult, CoverageResultList, isCoverageResult } from './models';
import { Settings } from '../config/models';
import { isPathExists } from '../tools/files';

const logger = getLogger('UI_COVERAGE_TRACKER_STORAGE');

export class UICoverageTrackerStorage {
  private settings: Settings;

  constructor({ settings }: { settings: Settings }) {
    this.settings = settings;
  }

  async load(): Promise<CoverageResultList> {
    const resultsDir = this.settings.resultsDir;

    logger.info(`Loading coverage results from directory: ${resultsDir}`);

    if (!(await isPathExists(resultsDir))) {
      logger.warning(`Results directory does not exist: ${resultsDir}`);
      return new CoverageResultList({ results: [] });
    }

    const results: CoverageResult[] = [];
    for (const fileName of await fs.readdir(resultsDir)) {
      const file = path.join(resultsDir, fileName);
      const fileStats = await fs.stat(file);

      if (fileStats.isFile() && fileName.endsWith('.json')) {
        try {
          const json = await fs.readFile(file, 'utf-8');
          const coverage: unknown = JSON.parse(json);
          if (!isCoverageResult(coverage)) throw new Error('Invalid coverage result');
          results.push(coverage);
        } catch (error) {
          logger.warning(`Failed to parse file ${fileName}: ${error}`);
        }
      }
    }

    logger.info(`Loaded ${results.length} coverage files from directory: ${resultsDir}`);
    return new CoverageResultList({ results });
  }

  async clear(): Promise<void> {
    const resultsDir = this.settings.resultsDir;
    let directoryStats;
    try {
      directoryStats = await fs.stat(resultsDir);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.info(`Results directory does not exist: ${resultsDir}`);
        return;
      }
      throw error;
    }

    if (!directoryStats.isDirectory()) {
      throw new Error(`Results path is not a directory: ${resultsDir}`);
    }

    const protectedFiles = new Set<string>();
    for (const file of [this.settings.historyFile, this.settings.jsonReportFile]) {
      if (file && (await isPathExists(file))) protectedFiles.add(await fs.realpath(file));
    }

    let removed = 0;
    for (const fileName of await fs.readdir(resultsDir)) {
      if (!fileName.endsWith('.json')) continue;
      const file = path.join(resultsDir, fileName);
      if (!(await fs.stat(file)).isFile() || protectedFiles.has(await fs.realpath(file))) continue;
      try {
        await fs.unlink(file);
        removed += 1;
      } catch (error) {
        throw new Error(`Failed to remove coverage result ${file}: ${error}`, { cause: error });
      }
    }
    logger.info(`Removed ${removed} coverage files from directory: ${resultsDir}`);
  }

  async save(coverage: CoverageResult) {
    const resultsDir = this.settings.resultsDir;

    if (!(await isPathExists(resultsDir))) {
      logger.info(`Results directory does not exist, creating: ${resultsDir}`);
      await fs.mkdir(resultsDir, { recursive: true });
    }

    const file = path.join(resultsDir, `${randomUUID()}.json`);

    try {
      await fs.writeFile(file, JSON.stringify(coverage), 'utf-8');
    } catch (error) {
      logger.error(`Error saving coverage data to file ${file}: ${error}`);
    }
  }
}

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getLogger } from '../tools/logger';
import { CoverageResult, CoverageResultList } from './models';
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
          results.push(JSON.parse(json));
        } catch (error) {
          logger.warning(`Failed to parse file ${fileName}: ${error}`);
        }
      }
    }

    logger.info(`Loaded ${results.length} coverage files from directory: ${resultsDir}`);
    return new CoverageResultList({ results });
  }

  async save(coverage: CoverageResult) {
    const resultsDir = this.settings.resultsDir;

    if (!(await isPathExists(resultsDir))) {
      logger.info(`Results directory does not exist, creating: ${resultsDir}`);
      await fs.mkdir(resultsDir, { recursive: true });
    }

    const file = path.join(resultsDir, `${uuidv4()}.json`);

    try {
      await fs.writeFile(file, JSON.stringify(coverage), 'utf-8');
    } catch (error) {
      logger.error(`Error saving coverage data to file ${file}: ${error}`);
    }
  }
}

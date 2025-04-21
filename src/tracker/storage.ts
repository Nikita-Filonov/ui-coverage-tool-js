import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getLogger } from '../tools/logger';
import { CoverageResultList, Models } from './models';
import { Settings } from '../config/models';

const logger = getLogger('UI_COVERAGE_TRACKER_STORAGE');

export class UICoverageTrackerStorage {
  private settings: Settings;

  constructor(settings: Settings) {
    this.settings = settings;
  }

  load(): CoverageResultList {
    const resultsDir = this.settings.resultsDir;

    logger.info(`Loading coverage results from directory: ${resultsDir}`);

    if (!fs.existsSync(resultsDir)) {
      logger.warning(`Results directory does not exist: ${resultsDir}`);
      return new CoverageResultList([]);
    }

    const results: Models[] = [];

    for (const fileName of fs.readdirSync(resultsDir)) {
      const file = path.join(resultsDir, fileName);

      if (fs.statSync(file).isFile() && fileName.endsWith('.json')) {
        try {
          const json = fs.readFileSync(file, 'utf-8');
          results.push(JSON.parse(json));
        } catch (error) {
          logger.warning(`Failed to parse file ${fileName}: ${error}`);
        }
      }
    }

    logger.info(`Loaded ${results.length} coverage files from directory: ${resultsDir}`);
    return new CoverageResultList(results);
  }

  save(coverage: Models) {
    const resultsDir = this.settings.resultsDir;

    if (!fs.existsSync(resultsDir)) {
      logger.info(`Results directory does not exist, creating: ${resultsDir}`);
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const file = path.join(resultsDir, `${uuidv4()}.json`);

    try {
      fs.writeFileSync(file, JSON.stringify(coverage), 'utf-8');
    } catch (error) {
      logger.error(`Error saving coverage data to file ${file}: ${error}`);
    }
  }
}

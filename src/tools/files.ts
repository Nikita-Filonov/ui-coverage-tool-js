import fs from 'fs';
import yaml from 'js-yaml';
import fsAsync from 'fs/promises';
import { getLogger } from './logger';

const logger = getLogger('FILES');

export const isPathExists = async (path: string): Promise<boolean> => {
  try {
    await fsAsync.access(path);
    return true;
  } catch (error) {
    return false;
  }
};

export const loadFromJson = <T>(file: string): Partial<T> => {
  try {
    if (!fs.existsSync(file)) return {};

    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    logger.warning(`Failed to load JSON config ${file}: ${error}`);
    return {};
  }
};

export const loadFromYaml = <T>(file: string): Partial<T> => {
  try {
    if (!fs.existsSync(file)) return {};
    
    const raw = fs.readFileSync(file, 'utf-8');
    return yaml.load(raw) as Partial<T>;
  } catch (error) {
    logger.warning(`Failed to load YAML config ${file}: ${error}`);
    return {};
  }
};


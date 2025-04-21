import fs from 'fs';
import yaml from 'js-yaml';

export const loadFromJson = <T>(file: string): Partial<T> => {
  try {
    if (!fs.existsSync(file)) return {};
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`Failed to load JSON config: ${file}`, error);
    return {};
  }
};

export const loadFromYaml = <T>(file: string): Partial<T> => {
  try {
    if (!fs.existsSync(file)) return {};
    const raw = fs.readFileSync(file, 'utf-8');
    return yaml.load(raw) as Partial<T>;
  } catch (error) {
    console.warn(`Failed to load YAML config: ${file}`, error);
    return {};
  }
};
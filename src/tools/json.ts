import { getLogger } from './logger';

const logger = getLogger('JSON');

type LoadJsonProps<T> = {
  content: string
  fallback: T
}

export const loadJson = <T>({ content, fallback }: LoadJsonProps<T>): T => {
  try {
    return JSON.parse(content, (key, value) => {
      switch (key) {
        case 'createdAt':
          return new Date(value);
        default:
          return value;
      }
    });
  } catch (error) {
    logger.warning(`Failed to parse JSON: ${error}`);
    return fallback;
  }
};
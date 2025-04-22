import { getLogger } from '../tools/logger';
import { getSettings } from '../config/core';

const logger = getLogger('PRINT_CONFIG');

export const printConfig = () => {
  const settings = getSettings();
  logger.info(JSON.stringify(settings, null, 2));
};
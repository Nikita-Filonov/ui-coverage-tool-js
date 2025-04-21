import { AppHistoryState } from './models';

export const getDefaultAppHistoryState = (): AppHistoryState => ({
  total: [],
  elements: {}
});
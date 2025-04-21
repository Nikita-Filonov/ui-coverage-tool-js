import { ActionType } from '../tools/actions';
import { AppKey } from '../tools/types';

export interface ActionHistory {
  type: ActionType;
  count: number;
}

export interface ElementHistory {
  actions: ActionHistory[];
  createdAt: Date;
}

export interface AppHistory {
  actions: ActionHistory[];
  createdAt: Date;
  totalActions: number;
  totalElements: number;
}

export interface AppHistoryState {
  total: AppHistory[];
  elements: Record<string, ElementHistory[]>;
}

export interface CoverageHistoryState {
  apps: Record<AppKey, AppHistoryState>;
}


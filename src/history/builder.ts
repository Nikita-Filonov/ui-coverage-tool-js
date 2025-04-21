import { ActionHistory, AppHistory, AppHistoryState, ElementHistory } from './models';
import { Selector } from '../tools/types';
import { buildSelectorKey } from './selector';
import { SelectorType } from '../tools/selector';
import { Settings } from '../config/models';

type UICoverageHistoryBuilderProps = {
  history: AppHistoryState
  settings: Settings
}

type GetElementHistoryProps = {
  actions: ActionHistory[],
  selector: Selector,
  selectorType: SelectorType
}

type BuildAppHistoryProps = {
  actions: ActionHistory[],
  totalActions: number,
  totalElements: number
}

type BuildElementHistoryProps = {
  actions: ActionHistory[]
}

type BaseHistory = { actions: ActionHistory[]; createdAt: Date }

type AppendHistoryProps<T extends BaseHistory> = {
  history: T[],
  buildFunc: () => T
}

export class UICoverageHistoryBuilder {
  private history: AppHistoryState;
  private settings: Settings;
  private createdAt: Date;

  constructor({ history, settings }: UICoverageHistoryBuilderProps) {
    this.history = history;
    this.settings = settings;
    this.createdAt = new Date();
  }

  buildAppHistory({ actions, totalActions, totalElements }: BuildAppHistoryProps): AppHistory {
    return { actions, createdAt: this.createdAt, totalActions, totalElements };
  }

  buildElementHistory({ actions }: BuildElementHistoryProps): ElementHistory {
    return { actions, createdAt: this.createdAt };
  }

  private appendHistory<T extends BaseHistory>({ history, buildFunc }: AppendHistoryProps<T>): T[] {
    if (!this.settings.historyFile) {
      return [];
    }

    const newItem = buildFunc();
    if (!newItem.actions || newItem.actions.length === 0) {
      return history;
    }

    const combined = [...history, newItem].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    return combined.slice(-this.settings.historyRetentionLimit);
  }

  getAppHistory(props: BuildAppHistoryProps): AppHistory[] {
    return this.appendHistory({
      history: this.history.total,
      buildFunc: () => this.buildAppHistory(props)
    });
  }

  getElementHistory({ actions, selector, selectorType }: GetElementHistoryProps): ElementHistory[] {
    const key = buildSelectorKey({ selector, selectorType });
    const history = this.history.elements[key] || [];
    return this.appendHistory({
      history,
      buildFunc: () => this.buildElementHistory({ actions })
    });
  }
}

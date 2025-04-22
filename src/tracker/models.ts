import { ActionType } from '../tools/actions';
import { SelectorType } from '../tools/selector';
import { AppKey, Selector } from '../tools/types';
import { buildSelectorGroupKey, SelectorGroupKey } from './selector';

export interface CoverageResult {
  app: AppKey;
  selector: Selector;
  actionType: ActionType;
  selectorType: SelectorType;
}

export class CoverageResultList {
  private readonly results: CoverageResult[];

  constructor({ results }: { results: CoverageResult[] }) {
    this.results = results;
  }

  filter({ app }: { app?: AppKey }): CoverageResultList {
    const filtered = this.results.filter(r => !app || r.app.toLowerCase() === app.toLowerCase());
    return new CoverageResultList({ results: filtered });
  }

  get groupedByAction(): Map<ActionType, CoverageResultList> {
    return this.groupBy(r => r.actionType);
  }

  get groupedBySelector(): Map<SelectorGroupKey, CoverageResultList> {
    return this.groupBy(r => buildSelectorGroupKey(r));
  }

  get totalActions(): number {
    return this.results.length;
  }

  get totalSelectors(): number {
    return this.groupedBySelector.size;
  }

  countAction(actionType: ActionType): number {
    return this.results.filter(r => r.actionType === actionType).length;
  }

  private groupBy<K>(keyGetter: (r: CoverageResult) => K): Map<K, CoverageResultList> {
    const map = new Map<K, CoverageResult[]>();
    for (const result of this.results) {
      const key = keyGetter(result);
      const results = map.get(key) || [];
      results.push(result);
      map.set(key, results);
    }

    const resultMap = new Map<K, CoverageResultList>();
    for (const [key, group] of map.entries()) {
      resultMap.set(key, new CoverageResultList({ results: group }));
    }

    return resultMap;
  }
}

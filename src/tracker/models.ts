import { ActionType } from '../tools/actions';
import { SelectorType } from '../tools/selector';
import { AppKey, Selector } from '../tools/types';

type SelectorGroupKey = [Selector, SelectorType]

export interface Models {
  app: AppKey;
  selector: Selector;
  actionType: ActionType;
  selectorType: SelectorType;
}

export class CoverageResultList {
  private readonly results: Models[];

  constructor(results: Models[]) {
    this.results = results;
  }

  filter({ app }: { app?: AppKey }): CoverageResultList {
    const filtered = this.results.filter(r => !app || r.app.toLowerCase() === app.toLowerCase());
    return new CoverageResultList(filtered);
  }

  get groupedByAction(): Map<ActionType, CoverageResultList> {
    return this.groupBy(r => r.actionType);
  }

  get groupedBySelector(): Map<SelectorGroupKey, CoverageResultList> {
    return this.groupBy(r => [r.selector, r.selectorType]);
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

  private groupBy<K>(keyGetter: (r: Models) => K): Map<K, CoverageResultList> {
    const map = new Map<K, Models[]>();
    for (const result of this.results) {
      const key = keyGetter(result);
      const group = map.get(key) || [];
      group.push(result);
      map.set(key, group);
    }

    const resultMap = new Map<K, CoverageResultList>();
    for (const [key, group] of map.entries()) {
      resultMap.set(key, new CoverageResultList(group));
    }

    return resultMap;
  }
}

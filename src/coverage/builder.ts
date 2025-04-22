import { ActionType } from '../tools/actions';
import { SelectorType } from '../tools/selector';
import { Selector } from '../tools/types';
import { ActionCoverage, AppCoverage, ElementCoverage } from './models';
import { CoverageResultList } from '../tracker/models';
import { UICoverageHistoryBuilder } from '../history/builder';
import { ActionHistory } from '../history/models';
import { unpackSelectorGroupKey } from '../tracker/selector';

type UICoverageBuilderProps = {
  resultsList: CoverageResultList
  historyBuilder: UICoverageHistoryBuilder
}

type BuildElementCoverageProps = {
  results: CoverageResultList
  selector: Selector
  selectorType: SelectorType
}

export class UICoverageBuilder {
  private resultsList: CoverageResultList;
  private historyBuilder: UICoverageHistoryBuilder;

  constructor({ resultsList, historyBuilder }: UICoverageBuilderProps) {
    this.resultsList = resultsList;
    this.historyBuilder = historyBuilder;
  }

  private buildElementCoverage({ results, selector, selectorType }: BuildElementCoverageProps): ElementCoverage {
    const actions: ActionCoverage[] = Object.values(ActionType)
      .map((action) => ({ type: action, count: results.countAction(action) }))
      .filter((action) => action.count > 0);
    const history = this.historyBuilder.getElementHistory({ actions, selector, selectorType });

    return { history, actions, selector, selectorType };
  }

  build(): AppCoverage {
    const actions: ActionHistory[] = [];
    for (const [action, results] of this.resultsList.groupedByAction.entries()) {
      if (results.totalActions > 0) {
        actions.push({ type: action, count: results.totalActions });
      }
    }

    const elements: ElementCoverage[] = [];
    for (const [selectorGroupKey, results] of this.resultsList.groupedBySelector.entries()) {
      const [selector, selectorType] = unpackSelectorGroupKey(selectorGroupKey);
      elements.push(this.buildElementCoverage({ results, selector, selectorType }));
    }

    const history = this.historyBuilder.getAppHistory({
      actions,
      totalActions: this.resultsList.totalActions,
      totalElements: this.resultsList.totalSelectors
    });

    return { history, elements };
  }
}

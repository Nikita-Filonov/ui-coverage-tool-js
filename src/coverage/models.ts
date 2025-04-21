import { ActionType } from '../tools/actions';
import { AppHistory, ElementHistory } from '../history/models';
import { Selector } from '../tools/types';
import { SelectorType } from '../tools/selector';

export interface ActionCoverage {
  type: ActionType;
  count: number;
}

export interface ElementCoverage {
  history: ElementHistory[];
  actions: ActionCoverage[];
  selector: Selector;
  selectorType: SelectorType;
}

export interface AppCoverage {
  history: AppHistory[];
  elements: ElementCoverage[];
}

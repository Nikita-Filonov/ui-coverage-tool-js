import { Selector, SelectorKey } from '../tools/types';
import { SelectorType } from '../tools/selector';

type BuildSelectorKeyProps = {
  selector: Selector
  selectorType: SelectorType
}

export const buildSelectorKey = ({ selector, selectorType }: BuildSelectorKeyProps): SelectorKey => {
  return `${selectorType}_${selector}`;
};


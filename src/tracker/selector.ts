import { Selector } from '../tools/types';
import { SelectorType } from '../tools/selector';

export type SelectorGroupKey = string

type BuildSelectorGroupKeyProps = {
  selector: Selector;
  selectorType: SelectorType;
}

export const buildSelectorGroupKey = ({ selector, selectorType }: BuildSelectorGroupKeyProps): SelectorGroupKey => {
  return `${encodeURIComponent(selector)}|${selectorType}`;
};

export const unpackSelectorGroupKey = (key: SelectorGroupKey): [Selector, SelectorType] => {
  const [selector, selectorType] = key.split('|');
  return [decodeURIComponent(selector) as Selector, selectorType as SelectorType];
};
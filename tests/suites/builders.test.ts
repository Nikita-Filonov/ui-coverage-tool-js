import { describe, expect, vi } from 'vitest';
import { makeResult, test } from '../fixtures';
import { ActionType, SelectorType } from '../../src';
import { CoverageResultList } from '../../src/tracker/models';
import { UICoverageBuilder } from '../../src/coverage/builder';
import { UICoverageHistoryBuilder } from '../../src/history/builder';
import { getDefaultAppHistoryState } from '../../src/history/default';
import { buildSelectorKey } from '../../src/history/selector';

const actions = [{ type: ActionType.Click, count: 2 }];

describe('history builder', () => {
  test('creates independent default histories', () => {
    const first = getDefaultAppHistoryState();
    first.elements.login = [];
    expect(getDefaultAppHistoryState()).toEqual({ total: [], elements: {} });
  });

  test('sorts and retains the newest app and element history', ({ settings }) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-03T00:00:00Z'));
    settings.historyRetentionLimit = 2;
    const first = { actions, createdAt: new Date('2026-01-01T00:00:00Z'), totalActions: 2, totalElements: 1 };
    const second = { ...first, createdAt: new Date('2026-01-02T00:00:00Z') };
    const history = { total: [second, first], elements: { CSS_login: [second, first] } };
    const builder = new UICoverageHistoryBuilder({ settings, history });
    const appHistory = builder.getAppHistory({ actions, totalActions: 2, totalElements: 1 });
    const elementHistory = builder.getElementHistory({ actions, selector: 'login', selectorType: SelectorType.CSS });
    expect(appHistory.map((item) => item.createdAt.toISOString())).toEqual([
      '2026-01-02T00:00:00.000Z',
      '2026-01-03T00:00:00.000Z'
    ]);
    expect(elementHistory).toHaveLength(2);
    expect(elementHistory[1]).toEqual({ actions, createdAt: new Date() });
    expect(history.total).toEqual([second, first]);
  });

  test('does not append history for an empty run', ({ settings }) => {
    const history = getDefaultAppHistoryState();
    const builder = new UICoverageHistoryBuilder({ settings, history });
    expect(builder.getAppHistory({ actions: [], totalActions: 0, totalElements: 0 })).toBe(history.total);
    expect(builder.getElementHistory({ actions: [], selector: '#missing', selectorType: SelectorType.CSS })).toEqual(
      []
    );
  });

  test('returns empty histories when history storage is disabled', ({ settings }) => {
    settings.historyFile = null;
    const builder = new UICoverageHistoryBuilder({ settings, history: getDefaultAppHistoryState() });
    expect(builder.getAppHistory({ actions, totalActions: 2, totalElements: 1 })).toEqual([]);
    expect(builder.getElementHistory({ actions, selector: '#login', selectorType: SelectorType.CSS })).toEqual([]);
  });

  test('keeps selector types separate in history keys', () => {
    expect(buildSelectorKey({ selector: '#login', selectorType: SelectorType.CSS })).toBe('CSS_#login');
    expect(buildSelectorKey({ selector: '#login', selectorType: SelectorType.XPath })).toBe('XPATH_#login');
  });
});

describe('coverage builder', () => {
  test('aggregates repeated actions while separating selector types', ({ settings }) => {
    const resultsList = new CoverageResultList({
      results: [
        makeResult(),
        makeResult(),
        makeResult({ actionType: ActionType.Fill }),
        makeResult({ selectorType: SelectorType.XPath })
      ]
    });
    const historyBuilder = new UICoverageHistoryBuilder({ settings, history: getDefaultAppHistoryState() });
    const report = new UICoverageBuilder({ resultsList, historyBuilder }).build();
    expect(report.elements).toHaveLength(2);
    expect(report.elements[0]).toMatchObject({
      selector: '#login',
      selectorType: SelectorType.CSS,
      actions: [
        { type: ActionType.Fill, count: 1 },
        { type: ActionType.Click, count: 2 }
      ]
    });
    expect(report.elements[1]).toMatchObject({
      selectorType: SelectorType.XPath,
      actions: [{ type: ActionType.Click, count: 1 }]
    });
    expect(report.history[0]).toMatchObject({
      totalActions: 4,
      totalElements: 2,
      actions: [
        { type: ActionType.Click, count: 3 },
        { type: ActionType.Fill, count: 1 }
      ]
    });
  });

  test('produces empty coverage for an application without results', ({ settings }) => {
    const historyBuilder = new UICoverageHistoryBuilder({ settings, history: getDefaultAppHistoryState() });
    expect(
      new UICoverageBuilder({ resultsList: new CoverageResultList({ results: [] }), historyBuilder }).build()
    ).toEqual({ history: [], elements: [] });
  });

  test('includes every supported action type', ({ settings }) => {
    const resultsList = new CoverageResultList({
      results: Object.values(ActionType).map((actionType) => makeResult({ actionType }))
    });
    const historyBuilder = new UICoverageHistoryBuilder({ settings, history: getDefaultAppHistoryState() });
    const report = new UICoverageBuilder({ resultsList, historyBuilder }).build();
    expect(report.elements[0].actions.map((action) => action.type)).toEqual(Object.values(ActionType));
    expect(report.history[0].totalActions).toBe(Object.values(ActionType).length);
  });
});

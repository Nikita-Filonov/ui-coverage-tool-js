import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, vi } from 'vitest';
import { makeResult, test } from '../fixtures';
import { UICoverageTracker, ActionType, SelectorType } from '../../src';
import { UICoverageTrackerStorage } from '../../src/tracker/storage';
import { CoverageResultList } from '../../src/tracker/models';
import { buildSelectorGroupKey, unpackSelectorGroupKey } from '../../src/tracker/selector';

describe('CoverageResultList', () => {
  test('counts repeated actions and separates selectors by type', () => {
    const list = new CoverageResultList({
      results: [
        makeResult(),
        makeResult(),
        makeResult({ actionType: ActionType.Fill }),
        makeResult({ selectorType: SelectorType.XPath })
      ]
    });
    expect(list.totalActions).toBe(4);
    expect(list.totalSelectors).toBe(2);
    expect(list.countAction(ActionType.Click)).toBe(3);
    expect(list.countAction(ActionType.Hover)).toBe(0);
    expect(list.groupedByAction.get(ActionType.Fill)?.totalActions).toBe(1);
    expect(list.groupedBySelector.get(buildSelectorGroupKey(makeResult()))?.totalActions).toBe(3);
  });

  test('filters applications without changing the original list', () => {
    const list = new CoverageResultList({ results: [makeResult(), makeResult({ app: 'other' })] });
    expect(list.filter({ app: 'SHOP' }).totalActions).toBe(1);
    expect(list.filter({ app: 'unknown' }).totalActions).toBe(0);
    expect(list.filter({}).totalActions).toBe(2);
    expect(list.totalActions).toBe(2);
  });

  test.each(['#login', '[title="Привет | 100%"]', '//div[@id="a|b"]', ''])('round trips selector %s', (selector) => {
    expect(unpackSelectorGroupKey(buildSelectorGroupKey({ selector, selectorType: SelectorType.XPath }))).toEqual([
      selector,
      SelectorType.XPath
    ]);
  });
});

describe('UICoverageTrackerStorage', () => {
  test('loads an empty list when the results directory is missing', async ({ settings }) => {
    expect((await new UICoverageTrackerStorage({ settings }).load()).totalActions).toBe(0);
  });

  test('saves each interaction to its own JSON file', async ({ settings }) => {
    const tracker = new UICoverageTracker({ app: 'shop', settings });
    await tracker.trackCoverage(makeResult());
    await tracker.trackCoverage(makeResult({ actionType: ActionType.Fill }));
    const files = await fs.readdir(settings.resultsDir);
    expect(files).toHaveLength(2);
    expect(new Set(files).size).toBe(2);
    expect(files.every((file) => /^[\da-f-]{36}\.json$/.test(file))).toBe(true);
    const results = await new UICoverageTrackerStorage({ settings }).load();
    expect(results.totalActions).toBe(2);
    expect(results.countAction(ActionType.Fill)).toBe(1);
    expect(JSON.parse(await fs.readFile(path.join(settings.resultsDir, files[0]), 'utf8'))).toMatchObject({
      app: 'shop',
      selector: '#login'
    });
  });

  test('ignores invalid JSON, other files and nested directories', async ({ settings }) => {
    const storage = new UICoverageTrackerStorage({ settings });
    await storage.save(makeResult());
    await fs.writeFile(path.join(settings.resultsDir, 'bad.json'), '{');
    await fs.writeFile(path.join(settings.resultsDir, 'notes.txt'), '{}');
    await fs.mkdir(path.join(settings.resultsDir, 'nested.json'));
    expect((await storage.load()).totalActions).toBe(1);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Failed to parse file bad.json'));
  });

  test('logs write failures', async ({ settings }) => {
    vi.spyOn(fs, 'writeFile').mockRejectedValue(new Error('disk full'));
    await new UICoverageTrackerStorage({ settings }).save(makeResult());
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('disk full'));
  });

  test.for([
    null,
    1,
    'text',
    [],
    {},
    { ...makeResult(), app: 1 },
    { ...makeResult(), selector: null },
    { ...makeResult(), actionType: 'UNKNOWN' },
    { ...makeResult(), selectorType: 'UNKNOWN' },
    { apps: {} }
  ])('ignores JSON that is not a coverage result: %j', async (value, { settings }) => {
    const storage = new UICoverageTrackerStorage({ settings });
    await storage.save(makeResult());
    await fs.writeFile(path.join(settings.resultsDir, 'invalid.json'), JSON.stringify(value));
    expect((await storage.load()).totalActions).toBe(1);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('invalid.json'));
  });
});

describe('clear', () => {
  test('does not create a missing results directory', async ({ settings }) => {
    await new UICoverageTrackerStorage({ settings }).clear();
    await expect(fs.stat(settings.resultsDir)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  test('removes only top-level JSON results', async ({ settings }) => {
    const storage = new UICoverageTrackerStorage({ settings });
    await storage.save(makeResult());
    await fs.writeFile(path.join(settings.resultsDir, 'invalid.json'), '{');
    await fs.writeFile(path.join(settings.resultsDir, 'keep.txt'), 'keep');
    await fs.mkdir(path.join(settings.resultsDir, 'nested.json'));
    await fs.writeFile(path.join(settings.resultsDir, 'nested.json/keep.json'), '{}');
    await storage.clear();
    expect(await fs.readdir(settings.resultsDir)).toEqual(['keep.txt', 'nested.json']);
    expect(await fs.readFile(path.join(settings.resultsDir, 'nested.json/keep.json'), 'utf8')).toBe('{}');
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('Removed 2 coverage files'));
  });

  test('preserves configured history and report including symlinks', async ({ settings }) => {
    settings.historyFile = path.join(settings.resultsDir, 'history.json');
    settings.jsonReportFile = path.join(settings.resultsDir, 'report.json');
    await fs.mkdir(settings.resultsDir);
    await fs.writeFile(settings.historyFile, 'history');
    await fs.writeFile(settings.jsonReportFile, 'report');
    await fs.symlink(settings.historyFile, path.join(settings.resultsDir, 'history-alias.json'));
    await new UICoverageTrackerStorage({ settings }).save(makeResult());
    await new UICoverageTrackerStorage({ settings }).clear();
    expect(await fs.readdir(settings.resultsDir)).toEqual(['history-alias.json', 'history.json', 'report.json']);
    expect(await fs.readFile(settings.historyFile, 'utf8')).toBe('history');
    expect(await fs.readFile(settings.jsonReportFile, 'utf8')).toBe('report');
  });

  test('works with disabled history and JSON report', async ({ settings }) => {
    settings.historyFile = null;
    settings.jsonReportFile = null;
    const storage = new UICoverageTrackerStorage({ settings });
    await storage.save(makeResult());
    await storage.clear();
    expect(await fs.readdir(settings.resultsDir)).toEqual([]);
  });

  test('rejects a results path that is a file', async ({ settings }) => {
    await fs.writeFile(settings.resultsDir, '{}');
    await expect(new UICoverageTrackerStorage({ settings }).clear()).rejects.toThrow('not a directory');
  });

  test('propagates directory access errors', async ({ settings }) => {
    vi.spyOn(fs, 'stat').mockRejectedValue(Object.assign(new Error('permission denied'), { code: 'EACCES' }));
    await expect(new UICoverageTrackerStorage({ settings }).clear()).rejects.toThrow('permission denied');
  });

  test('reports removal failures with the affected path', async ({ settings }) => {
    const storage = new UICoverageTrackerStorage({ settings });
    await storage.save(makeResult());
    vi.spyOn(fs, 'unlink').mockRejectedValue(new Error('permission denied'));
    await expect(storage.clear()).rejects.toThrow('Failed to remove coverage result');
    expect(await fs.readdir(settings.resultsDir)).toHaveLength(1);
  });
});

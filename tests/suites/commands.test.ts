import fs from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, describe, expect, vi } from 'vitest';
import { app, makeResult, test } from '../fixtures';
import { UICoverageTracker, ActionType } from '../../src';
import { UICoverageTrackerStorage } from '../../src/tracker/storage';
import { createProgram } from '../../src/commands/core';
import { version } from '../../package.json';

beforeEach(() => {
  for (const key of Object.keys(process.env).filter((name) => name.startsWith('UI_COVERAGE_')))
    vi.stubEnv(key, undefined);
});

describe('CLI', () => {
  test('registers cleanup last and reports the package version', () => {
    const program = createProgram();
    expect(program.commands.map((command) => command.name())).toEqual(['save-report', 'print-config', 'clear-results']);
    expect(program.version()).toBe(version);
  });

  test('prints the resolved configuration', async ({ directory }) => {
    vi.spyOn(process, 'cwd').mockReturnValue(directory);
    await createProgram().parseAsync(['print-config'], { from: 'user' });
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining(path.join(directory, 'coverage-results')));
  });

  test('clears results using the configured directory', async ({ directory, settings }) => {
    vi.spyOn(process, 'cwd').mockReturnValue(directory);
    await fs.writeFile(path.join(directory, 'ui-coverage.config.json'), JSON.stringify(settings));
    await new UICoverageTrackerStorage({ settings }).save(makeResult());
    await createProgram().parseAsync(['clear-results'], { from: 'user' });
    expect(await fs.readdir(settings.resultsDir)).toEqual([]);
  });

  test('propagates cleanup errors', async ({ directory, settings }) => {
    vi.spyOn(process, 'cwd').mockReturnValue(directory);
    await fs.writeFile(path.join(directory, 'ui-coverage.config.json'), JSON.stringify(settings));
    await fs.writeFile(settings.resultsDir, '{}');
    await expect(createProgram().parseAsync(['clear-results'], { from: 'user' })).rejects.toThrow('not a directory');
  });

  test('generates reports for multiple apps and preserves history between clean runs', async ({
    directory,
    settings
  }) => {
    vi.spyOn(process, 'cwd').mockReturnValue(directory);
    settings.apps = [app, { ...app, key: 'admin' }, { ...app, key: 'empty' }];
    settings.historyRetentionLimit = 2;
    await fs.writeFile(path.join(directory, 'ui-coverage.config.json'), JSON.stringify(settings));
    const shop = new UICoverageTracker({ app: 'SHOP', settings });
    const admin = new UICoverageTracker({ app: 'admin', settings });
    await shop.trackCoverage(makeResult());
    await shop.trackCoverage(makeResult());
    await admin.trackCoverage(makeResult({ actionType: ActionType.Fill }));
    await createProgram().parseAsync(['save-report'], { from: 'user' });
    const first = JSON.parse(await fs.readFile(settings.jsonReportFile!, 'utf8'));
    expect(first.appsCoverage.shop.history[0]).toMatchObject({ totalActions: 2, totalElements: 1 });
    expect(first.appsCoverage.admin.elements[0].actions).toEqual([{ type: ActionType.Fill, count: 1 }]);
    expect(first.appsCoverage.empty).toEqual({ history: [], elements: [] });
    const html = await fs.readFile(settings.htmlReportFile!, 'utf8');
    const state = html.match(/<script id="state" type="application\/json">([\s\S]*?)<\/script>/);
    expect(JSON.parse(state![1])).toEqual(first);
    for (let run = 0; run < 2; run++) {
      await createProgram().parseAsync(['clear-results'], { from: 'user' });
      await shop.trackCoverage(makeResult());
      await createProgram().parseAsync(['save-report'], { from: 'user' });
    }
    const last = JSON.parse(await fs.readFile(settings.jsonReportFile!, 'utf8'));
    expect(last.appsCoverage.shop.history).toHaveLength(2);
    expect(last.appsCoverage.shop.history.at(-1).totalActions).toBe(1);
    expect(last.appsCoverage.shop.elements[0].history).toHaveLength(2);
    expect(last.appsCoverage.admin.history).toHaveLength(1);
  });

  test('aggregates all saved results until explicit cleanup', async ({ directory, settings }) => {
    vi.spyOn(process, 'cwd').mockReturnValue(directory);
    await fs.writeFile(path.join(directory, 'ui-coverage.config.json'), JSON.stringify(settings));
    const tracker = new UICoverageTracker({ app: 'shop', settings });
    await tracker.trackCoverage(makeResult());
    await createProgram().parseAsync(['save-report'], { from: 'user' });
    await tracker.trackCoverage(makeResult());
    await createProgram().parseAsync(['save-report'], { from: 'user' });
    const state = JSON.parse(await fs.readFile(settings.jsonReportFile!, 'utf8'));
    expect(state.appsCoverage.shop.history.at(-1).totalActions).toBe(2);
  });

  test('supports history and JSON reports inside the results directory', async ({ directory, settings }) => {
    vi.spyOn(process, 'cwd').mockReturnValue(directory);
    settings.historyFile = path.join(settings.resultsDir, 'history.json');
    settings.jsonReportFile = path.join(settings.resultsDir, 'report.json');
    await fs.writeFile(path.join(directory, 'ui-coverage.config.json'), JSON.stringify(settings));
    const tracker = new UICoverageTracker({ app: 'shop', settings });
    await tracker.trackCoverage(makeResult());
    await createProgram().parseAsync(['save-report'], { from: 'user' });
    await createProgram().parseAsync(['clear-results'], { from: 'user' });
    await tracker.trackCoverage(makeResult({ actionType: ActionType.Fill }));
    await createProgram().parseAsync(['save-report'], { from: 'user' });
    const report = JSON.parse(await fs.readFile(settings.jsonReportFile, 'utf8'));
    expect(report.appsCoverage.shop.history).toHaveLength(2);
    expect(report.appsCoverage.shop.elements[0].actions).toEqual([{ type: ActionType.Fill, count: 1 }]);
  });
});

import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, vi } from 'vitest';
import { app, makeReport, test } from '../fixtures';
import { UICoverageHistoryStorage } from '../../src/history/storage';
import { UIReportsStorage } from '../../src/reports/storage';
import { ActionType, SelectorType } from '../../src';

describe('history storage', () => {
  test('round trips history with Date objects and creates parent directories', async ({ settings }) => {
    const storage = new UICoverageHistoryStorage({ settings });
    const state = {
      apps: {
        shop: {
          total: [
            {
              actions: [{ type: ActionType.Click, count: 1 }],
              createdAt: new Date('2026-01-01'),
              totalActions: 1,
              totalElements: 1
            }
          ],
          elements: {}
        }
      }
    };
    await storage.save(state);
    expect(await storage.load()).toEqual(state);
  });

  test.for(['disabled', 'missing', 'invalid', 'unreadable'])(
    'returns empty history for %s storage',
    async (mode, { settings }) => {
      if (mode === 'disabled') settings.historyFile = null;
      if (mode === 'invalid' || mode === 'unreadable') {
        await fs.mkdir(path.dirname(settings.historyFile!), { recursive: true });
        await fs.writeFile(settings.historyFile!, '{');
        if (mode === 'unreadable') vi.spyOn(fs, 'readFile').mockRejectedValue(new Error('permission denied'));
      }
      expect(await new UICoverageHistoryStorage({ settings }).load()).toEqual({ apps: {} });
    }
  );

  test('skips saving disabled history', async ({ settings }) => {
    settings.historyFile = null;
    const write = vi.spyOn(fs, 'writeFile');
    await new UICoverageHistoryStorage({ settings }).save({ apps: {} });
    expect(write).not.toHaveBeenCalled();
  });

  test('logs errors when saving history fails', async ({ settings }) => {
    vi.spyOn(fs, 'writeFile').mockRejectedValue(new Error('disk full'));
    await new UICoverageHistoryStorage({ settings }).save({ apps: {} });
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('disk full'));
  });

  test('extracts app and element histories from the report and skips absent apps', async ({ settings }) => {
    settings.apps.push({ ...app, key: 'missing' });
    const elementHistory = [{ actions: [{ type: ActionType.Click, count: 2 }], createdAt: new Date('2026-01-01') }];
    const report = makeReport({
      appsCoverage: {
        shop: {
          history: [],
          elements: [
            {
              selector: '#login',
              selectorType: SelectorType.CSS,
              actions: elementHistory[0].actions,
              history: elementHistory
            }
          ]
        }
      }
    });
    const storage = new UICoverageHistoryStorage({ settings });
    await storage.saveFromReport(report);
    expect(await storage.load()).toEqual({ apps: { shop: { total: [], elements: { 'CSS_#login': elementHistory } } } });
  });
});

describe('report storage', () => {
  test('writes JSON and injects the same state into the HTML template', async ({ settings }) => {
    const state = makeReport();
    const storage = new UIReportsStorage({ settings });
    await storage.saveJsonReport(state);
    await storage.saveHtmlReport(state);
    const json = JSON.parse(await fs.readFile(settings.jsonReportFile!, 'utf8'));
    const html = await fs.readFile(settings.htmlReportFile!, 'utf8');
    expect(json).toEqual(JSON.parse(JSON.stringify(state)));
    expect(html).toBe(`<html><script id="state" type="application/json">${JSON.stringify(state)}</script></html>`);
  });

  test.for(['json', 'html'])('skips a disabled %s report', async (format, { settings }) => {
    settings.jsonReportFile = null;
    settings.htmlReportFile = null;
    const write = vi.spyOn(fs, 'writeFile');
    const storage = new UIReportsStorage({ settings });
    if (format === 'json') await storage.saveJsonReport(makeReport());
    else await storage.saveHtmlReport(makeReport());
    expect(write).not.toHaveBeenCalled();
  });

  test.for(['json', 'html'])('logs a failed %s report write', async (format, { settings }) => {
    vi.spyOn(fs, 'writeFile').mockRejectedValue(new Error('disk full'));
    const storage = new UIReportsStorage({ settings });
    if (format === 'json') await storage.saveJsonReport(makeReport());
    else await storage.saveHtmlReport(makeReport());
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('disk full'));
  });

  test.for(['', 'missing.html'])('logs a missing template %s', async (template, { settings }) => {
    settings.htmlReportTemplateFile = template;
    await new UIReportsStorage({ settings }).saveHtmlReport(makeReport());
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Template HTML report file not found'));
  });

  test('logs a template read failure', async ({ settings }) => {
    vi.spyOn(fs, 'readFile').mockRejectedValue(new Error('permission denied'));
    await new UIReportsStorage({ settings }).saveHtmlReport(makeReport());
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('permission denied'));
  });
});

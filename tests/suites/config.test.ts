import fs from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, describe, expect, vi } from 'vitest';
import { app, test } from '../fixtures';
import { getSettings } from '../../src/config/core';
import { buildDefaultSettings, buildEnvSettings } from '../../src/config/builders';
import { isPathExists, loadFromJson, loadFromYaml } from '../../src/tools/files';
import { loadJson } from '../../src/tools/json';
import { getLogger } from '../../src/tools/logger';
import { UICoverageTracker } from '../../src';
import { UICoverageTrackerStorage } from '../../src/tracker/storage';

beforeEach(() => {
  for (const key of Object.keys(process.env).filter((name) => name.startsWith('UI_COVERAGE_')))
    vi.stubEnv(key, undefined);
});

describe('settings', () => {
  test('uses defaults from the current directory and finds the bundled template', async ({ directory }) => {
    vi.spyOn(process, 'cwd').mockReturnValue(directory);
    const settings = buildDefaultSettings();
    expect(settings).toMatchObject({
      apps: [],
      resultsDir: path.join(directory, 'coverage-results'),
      historyRetentionLimit: 30
    });
    expect(await isPathExists(settings.htmlReportTemplateFile)).toBe(true);
    expect(buildEnvSettings()).toEqual({});
  });

  test('keeps applications from YAML when no environment override is set', async ({ directory }) => {
    vi.spyOn(process, 'cwd').mockReturnValue(directory);
    await fs.writeFile(
      path.join(directory, 'ui-coverage.config.yaml'),
      'apps:\n  - key: shop\n    name: Shop\n    url: https://shop.example\n'
    );
    expect(getSettings().apps).toEqual([app]);
  });

  test('merges defaults, YAML, JSON and environment in priority order', async ({ directory }) => {
    vi.spyOn(process, 'cwd').mockReturnValue(directory);
    await fs.writeFile(
      path.join(directory, 'ui-coverage.config.yaml'),
      'resultsDir: yaml\nhistoryRetentionLimit: 5\nhistoryFile: null\n'
    );
    await fs.writeFile(
      path.join(directory, 'ui-coverage.config.json'),
      JSON.stringify({
        apps: [app],
        resultsDir: 'json',
        historyRetentionLimit: 10,
        htmlReportTemplateFile: 'custom.html'
      })
    );
    vi.stubEnv('UI_COVERAGE_RESULTS_DIR', 'environment');
    const settings = getSettings();
    expect(settings).toMatchObject({
      apps: [app],
      resultsDir: 'environment',
      historyRetentionLimit: 10,
      historyFile: null
    });
    expect(settings.htmlReportTemplateFile).not.toBe('custom.html');
  });

  test('reads all supported environment variables', () => {
    const environment = {
      APPS: JSON.stringify([app]),
      RESULTS_DIR: 'results',
      HISTORY_FILE: 'history.json',
      HISTORY_RETENTION_LIMIT: '7',
      HTML_REPORT_FILE: 'report.html',
      JSON_REPORT_FILE: 'report.json'
    };
    for (const [key, value] of Object.entries(environment)) vi.stubEnv(`UI_COVERAGE_${key}`, value);
    expect(buildEnvSettings()).toEqual({
      apps: [app],
      resultsDir: 'results',
      historyFile: 'history.json',
      historyRetentionLimit: 7,
      htmlReportFile: 'report.html',
      jsonReportFile: 'report.json'
    });
  });

  test('falls back for invalid environment JSON and retention', () => {
    vi.stubEnv('UI_COVERAGE_APPS', '{');
    vi.stubEnv('UI_COVERAGE_HISTORY_RETENTION_LIMIT', 'invalid');
    expect(buildEnvSettings()).toEqual({ apps: [] });
  });

  test('accepts empty configuration files', async ({ directory }) => {
    vi.spyOn(process, 'cwd').mockReturnValue(directory);
    await fs.writeFile(path.join(directory, 'ui-coverage.config.yaml'), '');
    await fs.writeFile(path.join(directory, 'ui-coverage.config.json'), '{}');
    expect(getSettings().apps).toEqual([]);
  });

  test('preserves YAML anchors, merges and plain string values after the parser upgrade', async ({ directory }) => {
    vi.spyOn(process, 'cwd').mockReturnValue(directory);
    await fs.writeFile(
      path.join(directory, 'ui-coverage.config.yaml'),
      'defaults: &defaults\n  name: on\n  url: https://shop.example\napps:\n  - <<: *defaults\n    key: shop\n'
    );
    expect(getSettings().apps).toEqual([{ key: 'shop', name: 'on', url: 'https://shop.example' }]);
  });

  test('tracker loads settings when no explicit settings are supplied', async ({ directory }) => {
    vi.spyOn(process, 'cwd').mockReturnValue(directory);
    const tracker = new UICoverageTracker({ app: 'shop' });
    const { makeResult } = await import('../fixtures');
    await tracker.trackCoverage(makeResult());
    expect((await new UICoverageTrackerStorage({ settings: getSettings() }).load()).totalActions).toBe(1);
  });
});

describe('file helpers', () => {
  test.for(['json', 'yaml'])('returns empty settings for missing or invalid %s', async (format, { directory }) => {
    const file = path.join(directory, `config.${format}`);
    const load = format === 'json' ? loadFromJson : loadFromYaml;
    expect(load(file)).toEqual({});
    await fs.writeFile(file, format === 'json' ? '{' : 'apps: [');
    expect(load(file)).toEqual({});
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Failed to load'));
  });

  test('checks existing and missing paths', async ({ directory }) => {
    expect(await isPathExists(directory)).toBe(true);
    expect(await isPathExists(path.join(directory, 'missing'))).toBe(false);
  });

  test('revives dates in nested JSON history', () => {
    expect(
      loadJson({ content: '{"apps":{"shop":{"createdAt":"2026-01-01T00:00:00Z","name":"Shop"}}}', fallback: {} })
    ).toEqual({ apps: { shop: { createdAt: new Date('2026-01-01T00:00:00Z'), name: 'Shop' } } });
  });

  test('returns the supplied JSON fallback and logs parsing errors', () => {
    const fallback = { apps: {} };
    expect(loadJson({ content: '{', fallback })).toBe(fallback);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Failed to parse JSON'));
  });

  test.each([
    ['info', 'info'],
    ['debug', 'debug'],
    ['warning', 'warn'],
    ['error', 'error']
  ] as const)('logs %s with its namespace', (level, method) => {
    getLogger('TEST')[level]('message');
    expect(console[method]).toHaveBeenCalledWith('[TEST] message');
  });
});

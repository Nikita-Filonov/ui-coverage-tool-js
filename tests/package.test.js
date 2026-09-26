import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const metadata = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const environment = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('UI_COVERAGE_')));
let directory;
let consumer;
let cli;
let contents;

const runCli = (args) => execute(process.execPath, [cli, ...args], { cwd: consumer, env: environment });

before(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ui-coverage-package-'));
  consumer = path.join(directory, 'consumer');
  await fs.mkdir(consumer);
  consumer = await fs.realpath(consumer);
  await fs.writeFile(path.join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  const packed = await execute('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', directory], {
    cwd: root
  });
  const info = JSON.parse(packed.stdout)[0];
  contents = info.files.map((file) => file.path);
  await execute(
    'npm',
    ['install', '--ignore-scripts', '--no-audit', '--no-fund', path.join(directory, info.filename)],
    { cwd: consumer }
  );
  cli = path.join(consumer, 'node_modules/ui-coverage-tool-js/dist/cli.js');
  await fs.writeFile(
    path.join(consumer, 'ui-coverage.config.json'),
    JSON.stringify({ apps: [{ key: 'shop', name: 'Shop', url: 'https://shop.example' }] })
  );
});

after(async () => {
  if (directory) await fs.rm(directory, { recursive: true, force: true });
});

test('npm archive contains the report, entry points and both type declarations', () => {
  for (const file of [
    'dist/index.js',
    'dist/index.cjs',
    'dist/index.d.ts',
    'dist/index.d.cts',
    'dist/cli.js',
    'dist/reports/templates/index.html'
  ])
    assert.ok(contents.includes(file), file);
  assert.ok(
    !contents.some((file) => file.startsWith('tests/') || file.startsWith('src/') || file.includes('yarn.lock'))
  );
});

for (const format of ['esm', 'cjs']) {
  test(`installed ${format} library tracks actions and finds its own template`, async () => {
    const imports =
      format === 'esm'
        ? "import { UICoverageTracker, ActionType, SelectorType } from 'ui-coverage-tool-js';"
        : "const { UICoverageTracker, ActionType, SelectorType } = require('ui-coverage-tool-js');";
    const file = path.join(consumer, format === 'esm' ? 'run.mjs' : 'run.cjs');
    await fs.writeFile(
      file,
      `${imports}\n(async () => {\nconst tracker = new UICoverageTracker({ app: 'shop' });\nawait tracker.trackCoverage({ selector: '#login', actionType: ActionType.Click, selectorType: SelectorType.CSS });\n})().catch(error => { console.error(error); process.exitCode = 1; });`
    );
    await execute(process.execPath, [file], { cwd: consumer, env: environment });
    const files = await fs.readdir(path.join(consumer, 'coverage-results'));
    assert.ok(files.length > 0);
    const result = JSON.parse(await fs.readFile(path.join(consumer, 'coverage-results', files[0]), 'utf8'));
    assert.deepEqual(result, { app: 'shop', selector: '#login', actionType: 'CLICK', selectorType: 'CSS' });
    if (format === 'cjs') {
      const output = await execute(process.execPath, [cli.replace(/\.js$/, '.cjs'), 'print-config'], {
        cwd: consumer,
        env: environment
      });
      const config = JSON.parse(output.stdout.slice(output.stdout.indexOf('{')));
      assert.ok((await fs.stat(config.htmlReportTemplateFile)).isFile());
    }
  });
}

test('installed CLI prints its version and lists cleanup last', async () => {
  assert.equal((await runCli(['--version'])).stdout.trim(), metadata.version);
  const help = (await runCli(['--help'])).stdout;
  assert.ok(help.indexOf('clear-results') > help.indexOf('print-config'));
  assert.ok(help.includes('save-report'));
});

test('installed CLI uses the packaged template from a different working directory', async () => {
  const output = (await runCli(['print-config'])).stdout;
  const config = JSON.parse(output.slice(output.indexOf('{')));
  assert.ok(config.htmlReportTemplateFile.startsWith(path.join(consumer, 'node_modules/ui-coverage-tool-js/dist')));
  assert.ok((await fs.stat(config.htmlReportTemplateFile)).isFile());
  await runCli(['save-report']);
  const report = JSON.parse(await fs.readFile(path.join(consumer, 'coverage-report.json'), 'utf8'));
  const html = await fs.readFile(path.join(consumer, 'index.html'), 'utf8');
  assert.ok(html.includes('<div id="root"></div>'));
  assert.deepEqual(
    JSON.parse(html.match(/<script id="state" type="application\/json">([\s\S]*?)<\/script>/)[1]),
    report
  );
  assert.equal(report.appsCoverage.shop.elements[0].selector, '#login');
});

test('installed CLI clears results and preserves history and reports', async () => {
  const history = await fs.readFile(path.join(consumer, 'coverage-history.json'), 'utf8');
  const report = await fs.readFile(path.join(consumer, 'coverage-report.json'), 'utf8');
  await runCli(['clear-results']);
  assert.deepEqual(await fs.readdir(path.join(consumer, 'coverage-results')), []);
  assert.equal(await fs.readFile(path.join(consumer, 'coverage-history.json'), 'utf8'), history);
  assert.equal(await fs.readFile(path.join(consumer, 'coverage-report.json'), 'utf8'), report);
});

test('installed CLI reads .env from the consumer project', async () => {
  const file = path.join(consumer, '.env');
  try {
    await fs.writeFile(file, 'UI_COVERAGE_HISTORY_RETENTION_LIMIT=5\n');
    const output = (await runCli(['print-config'])).stdout;
    assert.equal(JSON.parse(output.slice(output.indexOf('{'))).historyRetentionLimit, 5);
  } finally {
    await fs.unlink(file);
  }
});

test('installed CLI returns a failing exit code for an invalid results path', async () => {
  await fs.rm(path.join(consumer, 'coverage-results'), { recursive: true });
  await fs.writeFile(path.join(consumer, 'coverage-results'), '{}');
  await assert.rejects(
    runCli(['clear-results']),
    (error) => error.code === 1 && error.stderr.includes('not a directory')
  );
});

test('TypeScript consumers resolve ESM and CommonJS declarations', async () => {
  const content =
    "import { UICoverageTracker, ActionType, SelectorType } from 'ui-coverage-tool-js';\nconst tracker = new UICoverageTracker({ app: 'shop' });\ntracker.trackCoverage({ selector: '#login', actionType: ActionType.Click, selectorType: SelectorType.CSS });\n";
  await fs.writeFile(path.join(consumer, 'consumer.mts'), content);
  await fs.writeFile(path.join(consumer, 'consumer.cts'), content);
  await execute(
    process.execPath,
    [
      path.join(root, 'node_modules/typescript/bin/tsc'),
      '--noEmit',
      '--strict',
      '--module',
      'NodeNext',
      '--moduleResolution',
      'NodeNext',
      '--target',
      'ES2022',
      '--types',
      'node',
      '--typeRoots',
      path.join(root, 'node_modules/@types'),
      'consumer.mts',
      'consumer.cts'
    ],
    { cwd: consumer }
  );
});

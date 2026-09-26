import { afterEach, expect, test, vi } from 'vitest';

const originalExitCode = process.exitCode;

afterEach(() => {
  process.exitCode = originalExitCode;
  vi.doUnmock('../../src/commands/core');
  vi.resetModules();
});

test('CLI entry forwards process arguments to the asynchronous parser', async () => {
  const parseAsync = vi.fn().mockResolvedValue(undefined);
  vi.doMock('../../src/commands/core', () => ({ createProgram: () => ({ parseAsync }) }));
  await import('../../src/cli');
  expect(parseAsync).toHaveBeenCalledWith(process.argv);
});

test('CLI entry logs errors and sets a failing exit code', async () => {
  const parseAsync = vi.fn().mockRejectedValue(new Error('cleanup failed'));
  vi.doMock('../../src/commands/core', () => ({ createProgram: () => ({ parseAsync }) }));
  await import('../../src/cli');
  expect(console.error).toHaveBeenCalledWith('cleanup failed');
  expect(process.exitCode).toBe(1);
});

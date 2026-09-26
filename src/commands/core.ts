import { Command } from 'commander';
import { version } from '../../package.json';
import { saveReport } from './save-report';
import { printConfig } from './print-config';
import { clearResults } from './clear-results';

export const createProgram = (): Command => {
  const program = new Command().name('ui-coverage-tool').description('UI Coverage CLI Tool').version(version);

  program
    .command('save-report')
    .description('Generate a coverage report based on collected result files.')
    .action(saveReport);
  program.command('print-config').description('Print the resolved configuration to the console.').action(printConfig);
  program
    .command('clear-results')
    .description('Remove collected coverage result files from the configured results directory.')
    .action(clearResults);

  return program;
};

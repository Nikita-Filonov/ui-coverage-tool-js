import { Command } from 'commander';
import { saveReport } from './commands/save-report';
import { printConfig } from './commands/print-config';

const program = new Command();

program
  .name('ui-coverage-tool')
  .description('UI Coverage CLI Tool')
  .version('0.25.0');

program
  .command('save-report')
  .description('Generate a coverage report based on collected result files.')
  .action(saveReport);

program
  .command('print-config')
  .description('Print the resolved configuration to the console.')
  .action(printConfig);

program.parse(process.argv);
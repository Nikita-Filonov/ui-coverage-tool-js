#!/usr/bin/env node
import { Command } from 'commander';
import { saveReport } from './commands/save-report';
const program = new Command();
program
    .name('ui-coverage-tool')
    .description('UI Coverage CLI Tool')
    .version('0.1.0');
program
    .command('save-report')
    .description('...')
    .action(saveReport);
program.parse(process.argv);

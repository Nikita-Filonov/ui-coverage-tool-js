#!/usr/bin/env node
import { createProgram } from './commands/core';

createProgram()
  .parseAsync(process.argv)
  .catch((error: Error) => {
    console.error(error.message);
    process.exitCode = 1;
  });

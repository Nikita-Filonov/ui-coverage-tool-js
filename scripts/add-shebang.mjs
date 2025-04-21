// scripts/add-shebang.mjs
import fs from 'fs/promises';

const cliPath = './dist/cli.js';

let content = await fs.readFile(cliPath, 'utf-8');
if (!content.startsWith('#!')) {
  content = `#!/usr/bin/env node\n${content}`;
  await fs.writeFile(cliPath, content, 'utf-8');
}

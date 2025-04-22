import fs from 'fs/promises';
import path from 'path';

const source = path.resolve('./submodules/ui-coverage-report/build/index.html');
const destination = path.resolve('./src/reports/templates/index.html');

await fs.mkdir(path.dirname(destination), { recursive: true });
await fs.copyFile(source, destination);
console.log('✅ Template copied into local src');
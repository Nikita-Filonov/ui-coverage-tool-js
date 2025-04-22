import fs from 'fs/promises';
import path from 'path';

const source = path.resolve('./src/reports/templates/index.html');
const destination = path.resolve('./dist/reports/templates/index.html');

await fs.mkdir(path.dirname(destination), { recursive: true });
await fs.copyFile(source, destination);
console.log('✅ Template deployed to dist');

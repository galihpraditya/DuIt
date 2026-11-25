import fs from 'node:fs';
import path from 'node:path';
import { registerHooks } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import { transform } from 'sucrase';

function resolveTsFile(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL));
      const resolved = resolveTsFile(path.resolve(parentDir, specifier));
      if (resolved) {
        return { url: pathToFileURL(resolved).href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith('file:') && (url.endsWith('.ts') || url.endsWith('.tsx'))) {
      const filePath = fileURLToPath(url);
      const source = fs.readFileSync(filePath, 'utf8');
      const compiled = transform(source, {
        transforms: ['typescript'],
        disableESTransforms: true,
        filePath,
      });
      return {
        format: 'module',
        source: compiled.code,
        shortCircuit: true,
      };
    }
    return nextLoad(url, context);
  },
});

function collectTestFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTestFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

const srcRoot = path.resolve(process.cwd(), 'src');
const testFiles = collectTestFiles(srcRoot);

if (testFiles.length === 0) {
  console.error('No *.test.ts files found under src/');
  process.exit(1);
}

const stream = run({ files: testFiles, isolation: 'none' });
stream.compose(spec).pipe(process.stdout);
stream.on('test:fail', () => {
  process.exitCode = 1;
});

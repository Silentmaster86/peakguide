// Uses esbuild from the installed Vite toolchain (peakguide_front: npm ci).
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const require = createRequire(new URL('../peakguide_front/package.json', import.meta.url));
const { build } = require('esbuild');
const destination = new URL('../supabase/dashboard/welcome-email.ts', import.meta.url);
const result = await build({
  absWorkingDir: fileURLToPath(new URL('../', import.meta.url)),
  entryPoints: [fileURLToPath(new URL('../supabase/functions/welcome-email/index.ts', import.meta.url))],
  bundle: true, format: 'esm', platform: 'neutral', target: 'es2022', charset: 'utf8',
  external: ['npm:*'], write: false,
  banner: { js: '// @ts-nocheck\n// GENERATED: node scripts/build_welcome_dashboard.mjs\n// Paste this entire file into Supabase Dashboard as index.ts.\n// Function name: welcome-email. Verify JWT with legacy secret: OFF.\n// Source modules are type-checked separately; this bundle contains no secrets.' },
});
const output = result.outputFiles[0].text;
if (process.argv.includes('--check')) {
  if (await readFile(destination, 'utf8') !== output) throw new Error('Dashboard bundle is stale; regenerate it.');
} else {
  await mkdir(new URL('./', destination), { recursive: true });
  await writeFile(destination, output);
}
console.log('Welcome email dashboard bundle is up to date.');

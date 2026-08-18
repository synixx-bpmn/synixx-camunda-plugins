// Baut alle Plugin-Bundles (esbuild, IIFE — Camunda Modeler 5+ hat im
// Renderer kein nodeIntegration, requires müssen inline gebündelt sein).
import { build } from 'esbuild';
import { readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
for (const name of readdirSync(join(ROOT, 'plugins'))) {
    const minify = name === 'bpmn-graphviz'; // viz.js ist groß
    await build({
        entryPoints: [join(ROOT, 'plugins', name, 'entry.js')],
        outfile: join(ROOT, 'plugins', name, 'plugin', 'client.bundle.js'),
        bundle: true, format: 'iife', target: 'es2020', minify,
        logLevel: 'warning',
    });
    console.log('📦', name);
}

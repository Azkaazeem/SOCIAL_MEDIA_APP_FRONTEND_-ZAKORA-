import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  process.chdir(__dirname);
} catch (e) {
  console.warn("Could not change directory:", e);
}

// Launch Vite CLI
await import('./node_modules/vite/bin/vite.js');

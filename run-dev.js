import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
let projectDir = path.dirname(__filename);

// Replace UNC path with mapped drive letter for esbuild compatibility
if (/^[\\\/]{2}desktop-n7u2bks[\\\/]Desktop/i.test(projectDir)) {
  projectDir = projectDir.replace(/^[\\\/]{2}desktop-n7u2bks[\\\/]Desktop/i, 'Q:\\Azka\\OneDrive\\Desktop');
} else if (/^[\\\/]{2}desktop-n7u2bks[\\\/]Users/i.test(projectDir)) {
  projectDir = projectDir.replace(/^[\\\/]{2}desktop-n7u2bks[\\\/]Users/i, 'Q:');
}

const viteBin = path.join(projectDir, 'node_modules', 'vite', 'bin', 'vite.js');

const child = spawn(process.execPath, [viteBin], {
  cwd: projectDir,
  stdio: 'inherit'
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

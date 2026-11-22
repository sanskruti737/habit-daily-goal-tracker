import { spawn } from 'node:child_process';

const commands = [
  { name: 'backend', command: 'npm run dev', cwd: 'backend' },
  { name: 'frontend', command: 'npm run dev', cwd: 'frontend' }
];

const children = commands.map(({ name, command, cwd }) => {
  const child = spawn(command, {
    cwd,
    shell: process.platform === 'win32',
    stdio: 'inherit',
    env: process.env
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      shutdown(code);
    }
  });

  return child;
});

function shutdown(code = 0) {
  children.forEach((child) => {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  });
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

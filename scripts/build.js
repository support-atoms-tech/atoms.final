#!/usr/bin/env node
import { spawn } from 'child_process';

// Check if --no-lint flag is present
const args = process.argv.slice(2);
const skipLint = args.includes('--no-lint');

// Remove --no-lint from args and pass rest to next build
const nextArgs = args.filter((arg) => arg !== '--no-lint');

// Set environment variable if --no-lint is present
const env = {
    ...process.env,
    ...(skipLint && { SKIP_LINT: 'true' }),
};

// Run next build
const child = spawn('next', ['build', ...nextArgs], {
    stdio: 'inherit',
    env,
    shell: true,
});

child.on('exit', (code) => {
    process.exit(code || 0);
});

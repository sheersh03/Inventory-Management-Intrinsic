#!/usr/bin/env node
/**
 * Safe pull: backs up data/ and bills/, runs git pull, restores them.
 * Run from project root: node scripts/safe-pull.mjs
 * Or: npm run safe-pull
 */
import { cpSync, rmSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const dataDir = path.join(projectRoot, 'data');
const billsDir = path.join(projectRoot, 'bills');
const dataBackup = path.join(projectRoot, 'data_backup');
const billsBackup = path.join(projectRoot, 'bills_backup');

console.log('1. Backing up your data...');
if (existsSync(dataDir)) {
  cpSync(dataDir, dataBackup, { recursive: true });
  console.log('   - data/ backed up');
}
if (existsSync(billsDir)) {
  cpSync(billsDir, billsBackup, { recursive: true });
  console.log('   - bills/ backed up');
}

console.log('2. Pulling latest changes...');
execSync('git pull', { cwd: projectRoot, stdio: 'inherit' });

console.log('3. Restoring your data...');
if (existsSync(dataBackup)) {
  if (existsSync(dataDir)) rmSync(dataDir, { recursive: true });
  cpSync(dataBackup, dataDir, { recursive: true });
  rmSync(dataBackup, { recursive: true });
  console.log('   - data/ restored');
}
if (existsSync(billsBackup)) {
  if (existsSync(billsDir)) rmSync(billsDir, { recursive: true });
  cpSync(billsBackup, billsDir, { recursive: true });
  rmSync(billsBackup, { recursive: true });
  console.log('   - bills/ restored');
}

console.log('\nDone! Your data is safe. You can run "npm run dev" now.');

#!/usr/bin/env node
import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const databaseUrl = process.env.DATABASE_URL;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function hasCommand(command) {
  const result = spawnSync(command, ['--version'], { stdio: 'ignore' });
  return result.status === 0;
}

if (!databaseUrl) {
  fail('DATABASE_URL is required to create a database backup.');
}

const url = new URL(databaseUrl);
const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ''));
if (!databaseName) {
  fail('DATABASE_URL must include a database name.');
}

const command = ['mariadb-dump', 'mysqldump'].find(hasCommand);
if (!command) {
  fail('Install mariadb-dump or mysqldump before running npm run backup:db.');
}

const backupDir = resolve(process.env.DB_BACKUP_DIR || 'backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputPath = resolve(backupDir, `hustfood-${timestamp}.sql`);
const sslMode = String(url.searchParams.get('ssl-mode') || url.searchParams.get('sslmode') || '').toUpperCase();
const sslCa = url.searchParams.get('ssl-ca') || url.searchParams.get('sslca');

mkdirSync(backupDir, { recursive: true });

const args = [
  `--host=${url.hostname}`,
  `--port=${url.port || '3306'}`,
  `--user=${decodeURIComponent(url.username)}`,
  '--single-transaction',
  '--routines',
  '--triggers',
  `--result-file=${outputPath}`,
  databaseName
];

if (sslMode && sslMode !== 'DISABLED') {
  if (command === 'mysqldump') {
    args.splice(args.length - 1, 0, `--ssl-mode=${sslMode}`);
  } else {
    args.splice(args.length - 1, 0, '--ssl');
  }
}

if (sslCa) {
  args.splice(args.length - 1, 0, `--ssl-ca=${sslCa}`);
}

const env = {
  ...process.env,
  MYSQL_PWD: decodeURIComponent(url.password)
};

const result = spawnSync(command, args, {
  stdio: 'inherit',
  env
});

if (result.status !== 0) {
  fail(`Database backup failed with ${command}.`);
}

console.log(`Database backup saved to ${outputPath}`);

import { spawnSync } from 'node:child_process';
import { platform, env as processEnv } from 'node:process';

const env = { ...processEnv };

if (platform === 'darwin') {
  try {
    const result = spawnSync('xcrun', ['--sdk', 'macosx', '--show-sdk-path'], {
      encoding: 'utf8',
      stdio: 'pipe',
    });

    if (result.status === 0 && result.stdout.trim()) {
      const sdkRoot = result.stdout.trim();
      env.SDKROOT ||= sdkRoot;
      const includePath = `${sdkRoot}/usr/include/c++/v1`;
      env.CPLUS_INCLUDE_PATH = env.CPLUS_INCLUDE_PATH
        ? `${includePath}:${env.CPLUS_INCLUDE_PATH}`
        : includePath;
    } else if (result.error) {
      console.warn('Warning: unable to locate macOS SDK via xcrun:', result.error.message);
    }
  } catch (error) {
    console.warn('Warning: unable to configure macOS SDK paths:', error.message);
  }
}

const args = process.argv.length > 2 ? process.argv.slice(2) : ['-f', '-w', 'better-sqlite3'];
const bin = platform === 'win32'
  ? String.raw`node_modules\.bin\electron-rebuild.cmd`
  : 'node_modules/.bin/electron-rebuild';

const { status, error } = spawnSync(bin, args, {
  env,
  stdio: 'inherit',
});

if (error) {
  console.error('Failed to launch electron-rebuild:', error.message);
  process.exit(1);
}

process.exit(status ?? 1);

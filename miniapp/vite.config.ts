import react from '@vitejs/plugin-react';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';

function parseAllowedHosts(env: Record<string, string>): string[] {
  const rawValues = [env.MINIAPP_URL, env.MINIAPP_CORS_ORIGINS, env.VITE_ALLOWED_HOSTS]
    .filter(Boolean)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set(rawValues.map((value) => extractHostname(value)).filter(Boolean))];
}

function extractHostname(value: string): string {
  try {
    return new URL(value).hostname;
  } catch {
    return value.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }
}

function readEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    return {};
  }

  return readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce<Record<string, string>>((accumulator, line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return accumulator;
      }

      const separatorIndex = trimmedLine.indexOf('=');
      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = trimmedLine.slice(0, separatorIndex).trim();
      const value = trimmedLine.slice(separatorIndex + 1).trim();

      if (!key || key in accumulator) {
        return accumulator;
      }

      accumulator[key] = value;
      return accumulator;
    }, {});
}

export default defineConfig(({ mode }) => {
  const rootDir = resolve(process.cwd(), '..');
  const projectEnv = loadEnv(mode, process.cwd(), '');
  const rootEnv = loadEnv(mode, rootDir, '');
  const rootExampleEnv = readEnvFile(resolve(rootDir, '.env.example'));
  const env = {
    ...rootExampleEnv,
    ...rootEnv,
    ...projectEnv,
  };

  return {
    base: '/miniapp/',
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(process.cwd(), 'src'),
      },
    },
    server: {
      host: true,
      port: 80,
      strictPort: true,
      allowedHosts: parseAllowedHosts(env),
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: true,
      port: 4173,
      strictPort: true,
    },
  };
});

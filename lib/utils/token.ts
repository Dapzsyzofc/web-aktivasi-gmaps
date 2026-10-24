import crypto from 'crypto';

export function generatePublicToken(): string {
  return crypto.randomBytes(16).toString('base64url');
}

export function generateInventoryCode(batchPrefix: string, index: number): string {
  const paddedIndex = String(index).padStart(4, '0');
  return `${batchPrefix}-${paddedIndex}`;
}

export function generateBatchPrefix(): string {
  return 'DAPZ';
}

export function getBaseAppUrl(fallbackOrigin?: string): string {
  const rawEnvUrl = (process.env.NEXT_PUBLIC_APP_URL || '').trim().replace(/\/+$/, '');
  const isEnvLocalhost =
    rawEnvUrl.includes('localhost') || rawEnvUrl.includes('127.0.0.1');

  // Prefer NEXT_PUBLIC_APP_URL if it points to a real deployed domain
  if (rawEnvUrl && !isEnvLocalhost) {
    return rawEnvUrl;
  }

  // Otherwise use the actual request/window origin if available and not localhost
  const cleanFallback = (fallbackOrigin || '').trim().replace(/\/+$/, '');
  if (cleanFallback && !cleanFallback.includes('localhost') && !cleanFallback.includes('127.0.0.1')) {
    return cleanFallback;
  }

  // Check Vercel automatic environment variables
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim().replace(/\/+$/, '')}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.trim().replace(/\/+$/, '')}`;
  }

  return rawEnvUrl || cleanFallback || 'http://localhost:3000';
}

export function getPublicUrl(token: string, fallbackOrigin?: string): string {
  const baseUrl = getBaseAppUrl(fallbackOrigin);
  return `${baseUrl}/m/${encodeURIComponent(token.trim())}`;
}

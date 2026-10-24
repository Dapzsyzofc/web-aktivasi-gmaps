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

export function getPublicUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/m/${token}`;
}

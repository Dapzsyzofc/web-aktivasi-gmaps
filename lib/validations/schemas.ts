import { z } from 'zod';

const ALLOWED_MAPS_DOMAINS = [
  'google.com/maps',
  'google.co.id/maps',
  'goo.gl/maps',
  'maps.app.goo.gl',
  'maps.google.com',
  'maps.google.co.id',
  'www.google.com/maps',
  'www.google.co.id/maps',
  'g.page',
  'www.g.page',
  'share.google',
];

function isValidGoogleMapsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const hostPath = parsed.host + parsed.pathname;
    return ALLOWED_MAPS_DOMAINS.some(domain => hostPath.startsWith(domain));
  } catch {
    return false;
  }
}

export const googleMapsUrlSchema = z
  .string()
  .url('URL tidak valid')
  .refine(isValidGoogleMapsUrl, {
    message: 'Hanya URL Google Maps yang diizinkan (https://google.com/maps/...)',
  });

export const createBatchSchema = z.object({
  name: z.string().min(1, 'Nama batch wajib diisi').max(100, 'Nama batch maksimal 100 karakter'),
  quantity: z.number().int().min(1, 'Minimal 1 kartu').max(1000, 'Maksimal 1.000 kartu per batch'),
  notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional().nullable(),
});

export const createBusinessSchema = z.object({
  name: z.string().min(1, 'Nama usaha wajib diisi').max(200, 'Nama usaha maksimal 200 karakter'),
  google_maps_url: googleMapsUrlSchema.optional().nullable(),
  contact_name: z.string().max(100).optional().nullable(),
  contact_phone: z.string().max(20).optional().nullable(),
  internal_notes: z.string().max(1000).optional().nullable(),
});

export const updateBusinessSchema = z.object({
  name: z.string().min(1, 'Nama usaha wajib diisi').max(200).optional(),
  google_maps_url: googleMapsUrlSchema.optional().nullable(),
  contact_name: z.string().max(100).optional().nullable(),
  contact_phone: z.string().max(20).optional().nullable(),
  internal_notes: z.string().max(1000).optional().nullable(),
});

export const activateCardSchema = z.object({
  business_id: z.string().uuid('ID bisnis tidak valid'),
});

export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
export type ActivateCardInput = z.infer<typeof activateCardSchema>;

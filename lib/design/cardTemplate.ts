import QRCode from 'qrcode';

export const CARD_TEMPLATE = {
  src: '/card-template.png',
  width: 723,
  height: 1024,
  // Measured from the template: old QR modules span x 425–655, y 460–680,
  // inside a white rounded panel whose inner area is x 404–678, y 440–700.
  // The cover stays clear of the panel's rounded corners and border.
  qrCover: { x: 421, y: 456, w: 238, h: 228 },
  qrArea: { x: 427, y: 457, size: 226 },
} as const;

// A6 portrait at 300 DPI is 1748px tall; keep the template's aspect ratio.
export const PRINT_SCALE = 1748 / CARD_TEMPLATE.height;

export function validateQrUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'URL wajib diisi.';
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return 'Format URL tidak valid. Contoh: https://maps.app.goo.gl/xxxx';
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return 'URL harus diawali http:// atau https://';
  }
  if (!parsed.hostname.includes('.')) return 'Domain URL tidak valid.';
  return null;
}

export function loadTemplateImage(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Gagal memuat gambar desain'));
    img.src = CARD_TEMPLATE.src;
  });
}

/**
 * Draws the original template, blanks only the old QR, then draws a real QR
 * for `url`. Modules are drawn as rects snapped to device pixels so the code
 * stays crisp at any export scale. Pass url = null to leave the QR area blank.
 */
export function renderCardDesign(
  canvas: HTMLCanvasElement,
  template: HTMLImageElement,
  url: string | null,
  scale = 1,
): { modules: number; version: number } | null {
  const { width, height, qrCover, qrArea } = CARD_TEMPLATE;
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(
    Math.floor(qrCover.x * scale),
    Math.floor(qrCover.y * scale),
    Math.ceil(qrCover.w * scale),
    Math.ceil(qrCover.h * scale),
  );

  if (!url) return null;

  // Short URLs get level Q; long Maps links drop to M so modules stay large enough to scan.
  const level = url.length <= 120 ? 'Q' : 'M';
  const qr = QRCode.create(url, { errorCorrectionLevel: level });
  const n = qr.modules.size;
  const moduleSize = qrArea.size / n;
  const edge = (i: number, origin: number) => Math.round((origin + i * moduleSize) * scale);

  ctx.fillStyle = '#000000';
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (!qr.modules.get(row, col)) continue;
      const x0 = edge(col, qrArea.x);
      const y0 = edge(row, qrArea.y);
      ctx.fillRect(x0, y0, edge(col + 1, qrArea.x) - x0, edge(row + 1, qrArea.y) - y0);
    }
  }

  return { modules: n, version: qr.version };
}

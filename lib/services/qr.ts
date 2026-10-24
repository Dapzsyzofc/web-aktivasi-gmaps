import QRCode from 'qrcode';

export async function generateQRSvg(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 4,
    width: 300,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
}

export async function generateQRPng(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    type: 'png',
    errorCorrectionLevel: 'M',
    margin: 4,
    width: 600,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
}

export async function generateQRDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    margin: 4,
    width: 300,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
}

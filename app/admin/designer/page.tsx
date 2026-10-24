'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CARD_TEMPLATE,
  PRINT_SCALE,
  loadTemplateImage,
  renderCardDesign,
} from '@/lib/design/cardTemplate';

export default function DesignerPage() {
  return (
    <Suspense fallback={null}>
      <PrintBoards />
    </Suspense>
  );
}

interface CardInfo {
  id: string;
  inventory_code: string;
  public_token: string;
  status: string;
}

function PrintBoards() {
  const searchParams = useSearchParams();
  const batchId = searchParams.get('batch');
  const cardId = searchParams.get('card');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const templateRef = useRef<HTMLImageElement | null>(null);

  const [cards, setCards] = useState<CardInfo[]>([]);
  const [batchName, setBatchName] = useState('');
  const [templateReady, setTemplateReady] = useState(false);
  const [templateError, setTemplateError] = useState('');
  const [previewIdx, setPreviewIdx] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    loadTemplateImage()
      .then(img => { templateRef.current = img; setTemplateReady(true); })
      .catch(err => setTemplateError(err.message));
  }, []);

  useEffect(() => {
    if (batchId) {
      fetch(`/api/admin/batches/${batchId}`)
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (data) {
            setBatchName(data.name);
            setCards((data.cards || []).map((c: any) => ({
              id: c.id,
              inventory_code: c.inventory_code,
              public_token: c.public_token,
              status: c.status,
            })));
          }
        })
        .catch(() => {});
    } else if (cardId) {
      fetch(`/api/admin/cards/${cardId}`)
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (data) {
            setCards([{
              id: data.id,
              inventory_code: data.inventory_code,
              public_token: data.public_token,
              status: data.status,
            }]);
          }
        })
        .catch(() => {});
    }
  }, [batchId, cardId]);

  const currentCard = cards[previewIdx] || null;
  const currentUrl = currentCard ? `${appUrl}/m/${currentCard.public_token}` : null;

  useEffect(() => {
    if (!templateReady || !canvasRef.current || !templateRef.current) return;
    renderCardDesign(canvasRef.current, templateRef.current, currentUrl, 1);
  }, [templateReady, currentUrl]);

  const renderSingle = useCallback(
    (token: string, scale: number): string | null => {
      if (!templateRef.current) return null;
      const url = `${appUrl}/m/${token}`;
      const canvas = document.createElement('canvas');
      renderCardDesign(canvas, templateRef.current, url, scale);
      return canvas.toDataURL('image/png');
    },
    [appUrl],
  );

  function downloadSingle(card: CardInfo) {
    const dataUrl = renderSingle(card.public_token, PRINT_SCALE);
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `papan-${card.inventory_code.toLowerCase()}.png`;
    a.click();
  }

  async function downloadAllZip() {
    if (!templateRef.current || cards.length === 0) return;
    setExporting(true);
    setProgress({ done: 0, total: cards.length });
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const url = `${appUrl}/m/${card.public_token}`;
        const canvas = document.createElement('canvas');
        renderCardDesign(canvas, templateRef.current!, url, PRINT_SCALE);
        const blob: Blob = await new Promise(resolve =>
          canvas.toBlob(b => resolve(b!), 'image/png'),
        );
        zip.file(`papan-${card.inventory_code.toLowerCase()}.png`, blob);
        setProgress({ done: i + 1, total: cards.length });
        // Yield to keep UI responsive
        await new Promise(r => setTimeout(r, 0));
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `papan-${(batchName || 'batch').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setExporting(false);
    }
  }

  const printW = Math.round(CARD_TEMPLATE.width * PRINT_SCALE);
  const printH = Math.round(CARD_TEMPLATE.height * PRINT_SCALE);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href={batchId ? `/admin/batches/${batchId}` : '/admin/cards'} className="text-xs text-gray-400 hover:text-gray-600 mb-1 inline-block">
          ← {batchId ? 'Kembali ke Batch' : 'Kembali ke Kartu'}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Cetak Papan</h1>
        <p className="text-sm text-gray-500 mt-1">
          {batchName && `Batch ${batchName} • `}
          {cards.length} papan • QR menuju <span className="font-mono text-xs">/m/[token]</span>
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-start">
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Unduh untuk Cetak</h2>
            <p className="text-xs text-gray-400 mb-4">
              Setiap papan punya QR unik. Saat di-scan, pengunjung diarahkan ke halaman aktivasi. Setelah admin mengaktifkan, QR langsung menuju Google Maps UMKM.
            </p>
            <div className="flex flex-wrap gap-3">
              {cards.length > 1 && (
                <button
                  onClick={downloadAllZip}
                  disabled={!templateReady || exporting}
                  className="btn-primary"
                >
                  {exporting
                    ? `Membuat ZIP... (${progress.done}/${progress.total})`
                    : `Unduh Semua (ZIP) — ${cards.length} papan`}
                </button>
              )}
              {cards.length === 1 && currentCard && (
                <button
                  onClick={() => downloadSingle(currentCard)}
                  disabled={!templateReady}
                  className="btn-primary"
                >
                  Unduh PNG Cetak A6 ({printW}×{printH})
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Resolusi cetak: {printW}×{printH} px (300 DPI A6 portrait).
            </p>
          </div>

          {cards.length > 1 && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-3">Daftar Papan</h2>
              <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 -mx-2">
                {cards.map((card, idx) => (
                  <div
                    key={card.id}
                    className={`flex items-center justify-between px-2 py-2 rounded-md cursor-pointer transition-colors ${idx === previewIdx ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
                    onClick={() => setPreviewIdx(idx)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-medium text-gray-800">{card.inventory_code}</span>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); downloadSingle(card); }}
                      className="text-xs text-primary-500 hover:text-primary-600"
                      disabled={!templateReady}
                    >
                      Unduh
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card p-4 lg:sticky lg:top-8">
          <div className="relative w-full max-w-[362px] mx-auto" style={{ aspectRatio: `${CARD_TEMPLATE.width} / ${CARD_TEMPLATE.height}` }}>
            <canvas
              ref={canvasRef}
              width={CARD_TEMPLATE.width}
              height={CARD_TEMPLATE.height}
              className="w-full h-full rounded-md shadow-sm border border-gray-100"
              aria-label="Pratinjau papan"
            />
            {!templateReady && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400 bg-gray-50 rounded-md">
                {templateError || 'Memuat desain...'}
              </div>
            )}
          </div>
          {currentCard && (
            <p className="text-[11px] text-gray-400 text-center mt-3">
              {currentCard.inventory_code} • /m/{currentCard.public_token.slice(0, 10)}…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

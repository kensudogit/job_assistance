/**
 * スクリーンショット撮影コンポーネント
 * 画面のスクリーンショットを撮影し、サーバーにアップロードする機能を提供
 */
import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { api } from '@/lib/api';

interface ScreenshotCaptureProps {
  workerId: number;
  onCaptureComplete?: (screenshotId: number) => void;
  targetElementId?: string; // 撮影対象の要素ID（指定しない場合は全体）
}

export default function ScreenshotCapture({ 
  workerId, 
  onCaptureComplete,
  targetElementId 
}: ScreenshotCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const captureButtonRef = useRef<HTMLButtonElement>(null);

  /**
   * スクリーンショットを撮影してアップロード
   */
  const captureScreenshot = async () => {
    setIsCapturing(true);
    setError(null);
    setSuccess(false);

    try {
      // 撮影対象の要素を取得
      const targetElement = targetElementId 
        ? document.getElementById(targetElementId)
        : document.body;

      if (!targetElement) {
        throw new Error('撮影対象の要素が見つかりません');
      }

      // html2canvasでスクリーンショットを撮影
      const canvas = await html2canvas(targetElement, {
        useCORS: true,
        logging: false,
        scale: 1,
        backgroundColor: '#ffffff',
      });

      // CanvasをBlobに変換
      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error('スクリーンショットの生成に失敗しました');
        }

        try {
          // FormDataを作成
          const formData = new FormData();
          const fileName = `screenshot_${workerId}_${Date.now()}.png`;
          formData.append('file', blob, fileName);
          formData.append('worker_id', workerId.toString());
          formData.append('document_type', 'screenshot');
          formData.append('title', `スクリーンショット ${new Date().toLocaleString('ja-JP')}`);
          formData.append('description', '画面キャプチャ');

          // サーバーにアップロード
          const response = await api.post('/api/workers/screenshot', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            withCredentials: true,
          });

          if (response.data.success) {
            setSuccess(true);
            if (onCaptureComplete && response.data.data?.id) {
              onCaptureComplete(response.data.data.id);
            }
            // 3秒後に成功メッセージを非表示
            setTimeout(() => setSuccess(false), 3000);
          } else {
            throw new Error(response.data.error || 'アップロードに失敗しました');
          }
        } catch (err: any) {
          console.error('Screenshot upload error:', err);
          setError(err.response?.data?.error || err.message || 'アップロードに失敗しました');
        } finally {
          setIsCapturing(false);
        }
      }, 'image/png', 0.9);
    } catch (err: any) {
      console.error('Screenshot capture error:', err);
      setError(err.message || 'スクリーンショットの撮影に失敗しました');
      setIsCapturing(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        ref={captureButtonRef}
        onClick={captureScreenshot}
        disabled={isCapturing}
        className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
          isCapturing
            ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
        }`}
      >
        {isCapturing ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            撮影中...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            スクリーンショットを撮影
          </span>
        )}
      </button>

      {error && (
        <div className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm">
          スクリーンショットを保存しました
        </div>
      )}
    </div>
  );
}


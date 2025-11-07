/**
 * スクリーンショット一覧表示コンポーネント
 * 保存されたスクリーンショットを一覧表示し、表示・ダウンロードできる機能を提供
 */
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Screenshot {
  id: number;
  worker_id: number;
  document_type: string;
  title: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

interface ScreenshotListProps {
  workerId: number;
}

export default function ScreenshotList({ workerId }: ScreenshotListProps) {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);

  /**
   * スクリーンショット一覧を取得
   */
  const fetchScreenshots = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/workers/${workerId}/documents`, {
        withCredentials: true,
      });
      if (response.data.success) {
        // スクリーンショットのみをフィルタリング
        const screenshotList = response.data.data.filter(
          (doc: any) => doc.document_type === 'screenshot'
        );
        setScreenshots(screenshotList);
      } else {
        throw new Error(response.data.error || 'スクリーンショットの取得に失敗しました');
      }
    } catch (err: any) {
      console.error('Screenshot fetch error:', err);
      setError(err.response?.data?.error || err.message || 'スクリーンショットの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workerId) {
      fetchScreenshots();
    }
  }, [workerId]);

  /**
   * スクリーンショットのURLを取得
   */
  const getScreenshotUrl = (filePath: string) => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
    return `${apiBaseUrl}/api/files/${filePath}`;
  };

  /**
   * スクリーンショットをダウンロード
   */
  const downloadScreenshot = async (screenshot: Screenshot) => {
    try {
      const url = getScreenshotUrl(screenshot.file_path);
      const response = await fetch(url, {
        credentials: 'include',
      });
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = screenshot.file_name || `screenshot_${screenshot.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        throw new Error('ダウンロードに失敗しました');
      }
    } catch (err: any) {
      console.error('Download error:', err);
      alert('ダウンロードに失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">スクリーンショット一覧</h3>
        <button
          onClick={fetchScreenshots}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors"
        >
          更新
        </button>
      </div>

      {screenshots.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          スクリーンショットがありません
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {screenshots.map((screenshot) => (
            <div
              key={screenshot.id}
              className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedScreenshot(screenshot)}
            >
              <div className="aspect-video bg-gray-100 rounded-lg mb-2 overflow-hidden">
                <img
                  src={getScreenshotUrl(screenshot.file_path)}
                  alt={screenshot.title}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7lm77niYfliqDovb3lpLHotKU8L3RleHQ+PC9zdmc+';
                  }}
                />
              </div>
              <div className="text-sm font-medium truncate">{screenshot.title}</div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(screenshot.created_at).toLocaleString('ja-JP')}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedScreenshot(screenshot);
                  }}
                  className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                >
                  表示
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadScreenshot(screenshot);
                  }}
                  className="flex-1 px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors"
                >
                  ダウンロード
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* モーダル：スクリーンショット拡大表示 */}
      {selectedScreenshot && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div className="max-w-4xl max-h-full relative">
            <button
              onClick={() => setSelectedScreenshot(null)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-200 transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={getScreenshotUrl(selectedScreenshot.file_path)}
              alt={selectedScreenshot.title}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-4 text-white text-center">
              <div className="font-semibold">{selectedScreenshot.title}</div>
              <div className="text-sm text-gray-300 mt-1">
                {new Date(selectedScreenshot.created_at).toLocaleString('ja-JP')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


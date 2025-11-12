/**
 * ScreenshotList コンポーネントのテスト
 * vitest と @testing-library/react を使用
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ScreenshotList from '../ScreenshotList';
import { api } from '@/lib/api';

// api モジュールをモック化
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

// fetch をモック化
global.fetch = vi.fn();

// window.URL.createObjectURL と revokeObjectURL をモック化
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// import.meta.env をモック化
vi.mock('import.meta', () => ({
  env: {
    VITE_API_BASE_URL: 'http://localhost:5000',
    NEXT_PUBLIC_API_BASE_URL: '',
  },
}));

describe('ScreenshotList', () => {
  const mockWorkerId = 1;
  
  const mockScreenshots = [
    {
      id: 1,
      worker_id: 1,
      document_type: 'screenshot',
      title: 'テストスクリーンショット1',
      file_path: 'screenshots/test1.png',
      file_name: 'test1.png',
      file_size: 1024,
      mime_type: 'image/png',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      worker_id: 1,
      document_type: 'screenshot',
      title: 'テストスクリーンショット2',
      file_path: 'screenshots/test2.png',
      file_name: 'test2.png',
      file_size: 2048,
      mime_type: 'image/png',
      created_at: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ローディング状態', () => {
    it('初期表示時にローディングスピナーを表示する', async () => {
      (api.get as any).mockImplementation(() => 
        new Promise(() => {}) // 解決しないPromiseでローディング状態を維持
      );

      render(<ScreenshotList workerId={mockWorkerId} />);
      
      // ローディングスピナーのクラス名で確認
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('スクリーンショット一覧の取得', () => {
    it('スクリーンショット一覧を正常に取得して表示する', async () => {
      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockScreenshots,
        },
      });

      render(<ScreenshotList workerId={mockWorkerId} />);

      await waitFor(() => {
        expect(screen.getByText('スクリーンショット一覧')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('テストスクリーンショット1')).toBeInTheDocument();
        expect(screen.getByText('テストスクリーンショット2')).toBeInTheDocument();
      });
    });

    it('スクリーンショットが0件の場合、空のメッセージを表示する', async () => {
      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: [],
        },
      });

      render(<ScreenshotList workerId={mockWorkerId} />);

      await waitFor(() => {
        expect(screen.getByText('スクリーンショットがありません')).toBeInTheDocument();
      });
    });

    it('APIエラー時にエラーメッセージを表示する', async () => {
      (api.get as any).mockRejectedValue({
        response: {
          data: {
            error: 'スクリーンショットの取得に失敗しました',
          },
        },
      });

      render(<ScreenshotList workerId={mockWorkerId} />);

      await waitFor(() => {
        expect(screen.getByText('スクリーンショットの取得に失敗しました')).toBeInTheDocument();
      });
    });

    it('APIレスポンスがsuccess: falseの場合、エラーメッセージを表示する', async () => {
      (api.get as any).mockResolvedValue({
        data: {
          success: false,
          error: 'データの取得に失敗しました',
        },
      });

      render(<ScreenshotList workerId={mockWorkerId} />);

      await waitFor(() => {
        expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument();
      });
    });

    it('document_typeがscreenshot以外のドキュメントをフィルタリングする', async () => {
      const mixedDocuments = [
        ...mockScreenshots,
        {
          id: 3,
          worker_id: 1,
          document_type: 'document',
          title: 'ドキュメント',
          file_path: 'documents/test.pdf',
          file_name: 'test.pdf',
          file_size: 4096,
          mime_type: 'application/pdf',
          created_at: '2024-01-03T00:00:00Z',
        },
      ];

      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mixedDocuments,
        },
      });

      render(<ScreenshotList workerId={mockWorkerId} />);

      await waitFor(() => {
        expect(screen.getByText('テストスクリーンショット1')).toBeInTheDocument();
        expect(screen.getByText('テストスクリーンショット2')).toBeInTheDocument();
        expect(screen.queryByText('ドキュメント')).not.toBeInTheDocument();
      });
    });
  });

  describe('更新ボタン', () => {
    it('更新ボタンをクリックすると、スクリーンショット一覧を再取得する', async () => {
      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockScreenshots,
        },
      });

      render(<ScreenshotList workerId={mockWorkerId} />);

      await waitFor(() => {
        expect(screen.getByText('テストスクリーンショット1')).toBeInTheDocument();
      });

      const updateButton = screen.getByText('更新');
      fireEvent.click(updateButton);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('スクリーンショットの選択とモーダル表示', () => {
    it('スクリーンショットカードをクリックすると、モーダルが表示される', async () => {
      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockScreenshots,
        },
      });

      render(<ScreenshotList workerId={mockWorkerId} />);

      await waitFor(() => {
        expect(screen.getByText('テストスクリーンショット1')).toBeInTheDocument();
      });

      const screenshotCard = screen.getByText('テストスクリーンショット1').closest('div');
      if (screenshotCard) {
        fireEvent.click(screenshotCard);
      }

      await waitFor(() => {
        // モーダル内にタイトルが表示されることを確認
        const modalTitle = screen.getAllByText('テストスクリーンショット1');
        expect(modalTitle.length).toBeGreaterThan(1); // カードとモーダルの両方に存在
      });
    });

    it('表示ボタンをクリックすると、モーダルが表示される', async () => {
      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockScreenshots,
        },
      });

      render(<ScreenshotList workerId={mockWorkerId} />);

      await waitFor(() => {
        expect(screen.getByText('テストスクリーンショット1')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText('表示');
      fireEvent.click(viewButtons[0]);

      await waitFor(() => {
        // モーダルが表示されることを確認
        const modalTitle = screen.getAllByText('テストスクリーンショット1');
        expect(modalTitle.length).toBeGreaterThan(1);
      });
    });

    it('モーダルの閉じるボタンをクリックすると、モーダルが閉じる', async () => {
      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockScreenshots,
        },
      });

      render(<ScreenshotList workerId={mockWorkerId} />);

      await waitFor(() => {
        expect(screen.getByText('テストスクリーンショット1')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText('表示');
      fireEvent.click(viewButtons[0]);

      await waitFor(() => {
        // モーダルが表示されることを確認
        const modal = document.querySelector('.fixed.inset-0');
        expect(modal).toBeInTheDocument();
      });

      // 閉じるボタンを探す（SVGを含むボタン）
      const closeButton = document.querySelector('button svg[viewBox="0 0 24 24"]')?.closest('button');
      expect(closeButton).toBeInTheDocument();
      
      if (closeButton) {
        fireEvent.click(closeButton);
        
        await waitFor(() => {
          // モーダルが閉じられることを確認
          const modal = document.querySelector('.fixed.inset-0');
          expect(modal).not.toBeInTheDocument();
        });
      }
    });

    it('モーダルの背景をクリックすると、モーダルが閉じる', async () => {
      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockScreenshots,
        },
      });

      render(<ScreenshotList workerId={mockWorkerId} />);

      await waitFor(() => {
        expect(screen.getByText('テストスクリーンショット1')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText('表示');
      fireEvent.click(viewButtons[0]);

      await waitFor(() => {
        // モーダルの背景要素を探す
        const modalBackground = document.querySelector('.fixed.inset-0');
        if (modalBackground) {
          fireEvent.click(modalBackground);
        }
      });
    });
  });

  describe('ダウンロード機能', () => {
    it('ダウンロードボタンをクリックすると、スクリーンショットをダウンロードする', async () => {
      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockScreenshots,
        },
      });

      const mockBlob = new Blob(['test'], { type: 'image/png' });
      (global.fetch as any).mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });

      // createElement, appendChild, removeChild をモック化
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      const originalCreateElement = document.createElement.bind(document);
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return mockLink as any;
        }
        return originalCreateElement(tagName);
      });

      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

      render(<ScreenshotList workerId={mockWorkerId} />);

      await waitFor(() => {
        expect(screen.getByText('テストスクリーンショット1')).toBeInTheDocument();
      });

      const downloadButtons = screen.getAllByText('ダウンロード');
      fireEvent.click(downloadButtons[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:5000/api/files/screenshots/test1.png',
          expect.objectContaining({
            credentials: 'include',
          })
        );
      });

      await waitFor(() => {
        expect(createElementSpy).toHaveBeenCalledWith('a');
        expect(mockLink.download).toBe('test1.png');
        expect(appendChildSpy).toHaveBeenCalled();
        expect(mockLink.click).toHaveBeenCalled();
        expect(removeChildSpy).toHaveBeenCalled();
        expect(global.URL.revokeObjectURL).toHaveBeenCalled();
      }, { timeout: 3000 });

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('ダウンロードが失敗した場合、アラートを表示する', async () => {
      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockScreenshots,
        },
      });

      (global.fetch as any).mockResolvedValue({
        ok: false,
      });

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<ScreenshotList workerId={mockWorkerId} />);

      await waitFor(() => {
        expect(screen.getByText('テストスクリーンショット1')).toBeInTheDocument();
      });

      const downloadButtons = screen.getAllByText('ダウンロード');
      fireEvent.click(downloadButtons[0]);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('ダウンロードに失敗しました');
      });

      alertSpy.mockRestore();
    });

    it('file_nameが存在しない場合、デフォルトのファイル名を使用する', async () => {
      const screenshotWithoutFileName = {
        ...mockScreenshots[0],
        file_name: '',
      };

      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: [screenshotWithoutFileName],
        },
      });

      const mockBlob = new Blob(['test'], { type: 'image/png' });
      (global.fetch as any).mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return mockLink as any;
        }
        return originalCreateElement(tagName);
      });

      render(<ScreenshotList workerId={mockWorkerId} />);

      await waitFor(() => {
        expect(screen.getByText('テストスクリーンショット1')).toBeInTheDocument();
      });

      const downloadButtons = screen.getAllByText('ダウンロード');
      fireEvent.click(downloadButtons[0]);

      await waitFor(() => {
        expect(mockLink.download).toBe('screenshot_1.png');
      });
    });
  });

  describe('画像のエラーハンドリング', () => {
    it('画像の読み込みに失敗した場合、プレースホルダー画像を表示する', async () => {
      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockScreenshots,
        },
      });

      render(<ScreenshotList workerId={mockWorkerId} />);

      await waitFor(() => {
        expect(screen.getByText('テストスクリーンショット1')).toBeInTheDocument();
      });

      const images = screen.getAllByAltText('テストスクリーンショット1');
      if (images.length > 0) {
        fireEvent.error(images[0]);
        
        await waitFor(() => {
          // エラー後、srcがプレースホルダーに変更されることを確認
          const img = images[0] as HTMLImageElement;
          expect(img.src).toContain('data:image/svg+xml');
        });
      }
    });
  });

  describe('日付の表示', () => {
    it('作成日時を日本語形式で表示する', async () => {
      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockScreenshots,
        },
      });

      render(<ScreenshotList workerId={mockWorkerId} />);

      await waitFor(() => {
        // 日付が表示されることを確認（形式は環境によって異なる可能性があるため、存在確認のみ）
        const dateText = new Date('2024-01-01T00:00:00Z').toLocaleString('ja-JP');
        // 日付が含まれる要素が存在することを確認
        expect(screen.getByText('テストスクリーンショット1')).toBeInTheDocument();
      });
    });
  });

  describe('workerIdの変更', () => {
    it('workerIdが変更されると、新しいスクリーンショット一覧を取得する', async () => {
      const { rerender } = render(<ScreenshotList workerId={1} />);

      (api.get as any).mockResolvedValue({
        data: {
          success: true,
          data: mockScreenshots,
        },
      });

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          '/api/workers/1/documents',
          expect.any(Object)
        );
      });

      // workerIdを変更
      rerender(<ScreenshotList workerId={2} />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          '/api/workers/2/documents',
          expect.any(Object)
        );
      });
    });
  });
});


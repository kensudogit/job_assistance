/**
 * APIクライアントのテスト
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, workerApi, ApiResponse } from '../api';

// apiモジュールをモック化せず、実際のapiインスタンスを使用
// ただし、HTTPリクエストはモック化する

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('api instance', () => {
    it('apiインスタンスが作成される', () => {
      expect(api).toBeDefined();
      expect(api.defaults.baseURL).toBeDefined();
    });

    it('デフォルトのContent-Typeヘッダーが設定される', () => {
      expect(api.defaults.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('workerApi', () => {
    const mockWorker = {
      id: 1,
      name: 'テスト太郎',
      email: 'test@example.com',
    };

    describe('getAll', () => {
      it('すべての就労者を取得する', async () => {
        const mockResponse: ApiResponse<typeof mockWorker[]> = {
          success: true,
          data: [mockWorker],
        };

        // api.getを直接モック化
        const getSpy = vi.spyOn(api, 'get').mockResolvedValue({
          data: mockResponse,
        } as any);

        const result = await workerApi.getAll();

        expect(getSpy).toHaveBeenCalledWith('/api/workers');
        expect(result).toEqual([mockWorker]);
      });

      it('APIエラー時にエラーをスローする', async () => {
        const mockResponse: ApiResponse<typeof mockWorker[]> = {
          success: false,
          error: '取得に失敗しました',
        };

        const getSpy = vi.spyOn(api, 'get').mockResolvedValue({
          data: mockResponse,
        } as any);

        await expect(workerApi.getAll()).rejects.toThrow('取得に失敗しました');
      });
    });

    describe('getById', () => {
      it('IDで就労者を取得する', async () => {
        const mockResponse: ApiResponse<typeof mockWorker> = {
          success: true,
          data: mockWorker,
        };

        const getSpy = vi.spyOn(api, 'get').mockResolvedValue({
          data: mockResponse,
        } as any);

        const result = await workerApi.getById(1);

        expect(getSpy).toHaveBeenCalledWith('/api/workers/1');
        expect(result).toEqual(mockWorker);
      });
    });

    describe('create', () => {
      it('新しい就労者を作成する', async () => {
        const newWorker = {
          name: '新規太郎',
          email: 'new@example.com',
        };

        const mockResponse: ApiResponse<typeof mockWorker> = {
          success: true,
          data: { ...mockWorker, ...newWorker },
        };

        const postSpy = vi.spyOn(api, 'post').mockResolvedValue({
          data: mockResponse,
        } as any);

        const result = await workerApi.create(newWorker as any);

        expect(postSpy).toHaveBeenCalledWith('/api/workers', newWorker);
        expect(result).toEqual({ ...mockWorker, ...newWorker });
      });
    });

    describe('update', () => {
      it('就労者情報を更新する', async () => {
        const updateData = {
          name: '更新太郎',
        };

        const mockResponse: ApiResponse<typeof mockWorker> = {
          success: true,
          data: { ...mockWorker, ...updateData },
        };

        const putSpy = vi.spyOn(api, 'put').mockResolvedValue({
          data: mockResponse,
        } as any);

        const result = await workerApi.update(1, updateData);

        expect(putSpy).toHaveBeenCalledWith('/api/workers/1', updateData);
        expect(result).toEqual({ ...mockWorker, ...updateData });
      });
    });

    describe('delete', () => {
      it('就労者を削除する', async () => {
        const mockResponse: ApiResponse<void> = {
          success: true,
        };

        const deleteSpy = vi.spyOn(api, 'delete').mockResolvedValue({
          data: mockResponse,
        } as any);

        await workerApi.delete(1);

        expect(deleteSpy).toHaveBeenCalledWith('/api/workers/1');
      });

      it('削除失敗時にエラーをスローする', async () => {
        const mockResponse: ApiResponse<void> = {
          success: false,
          error: '削除に失敗しました',
        };

        const deleteSpy = vi.spyOn(api, 'delete').mockResolvedValue({
          data: mockResponse,
        } as any);

        await expect(workerApi.delete(1)).rejects.toThrow('削除に失敗しました');
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('ネットワークエラーを適切に処理する', async () => {
      const networkError = {
        request: {},
        message: 'Network Error',
      };

      vi.spyOn(api, 'get').mockRejectedValue(networkError);

      await expect(workerApi.getAll()).rejects.toThrow();
    });

    it('レスポンスエラーを適切に処理する', async () => {
      const responseError = {
        response: {
          status: 404,
          data: {
            error: 'Not Found',
          },
        },
      };

      vi.spyOn(api, 'get').mockRejectedValue(responseError);

      await expect(workerApi.getAll()).rejects.toThrow();
    });
  });
});


/**
 * ScreenshotCapture コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ScreenshotCapture from '../ScreenshotCapture';
import { api } from '@/lib/api';
import html2canvas from 'html2canvas';

vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

vi.mock('html2canvas', () => ({
  default: vi.fn(),
}));

describe('ScreenshotCapture', () => {
  const mockWorkerId = 1;
  const mockOnCaptureComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('スクリーンショット撮影ボタンが表示される', () => {
    render(
      <ScreenshotCapture workerId={mockWorkerId} onCaptureComplete={mockOnCaptureComplete} />
    );

    expect(screen.getByText(/スクリーンショット|screenshot/i)).toBeInTheDocument();
  });

  it('スクリーンショットを撮影してアップロードできる', async () => {
    const mockCanvas = {
      toDataURL: vi.fn(() => 'data:image/png;base64,test'),
    };
    (html2canvas as any).mockResolvedValue(mockCanvas);
    (api.post as any).mockResolvedValue({
      data: {
        success: true,
        data: { id: 1 },
      },
    });

    render(
      <ScreenshotCapture workerId={mockWorkerId} onCaptureComplete={mockOnCaptureComplete} />
    );

    const captureButton = screen.getByText(/スクリーンショット|screenshot/i);
    fireEvent.click(captureButton);

    await waitFor(() => {
      expect(html2canvas).toHaveBeenCalled();
      expect(api.post).toHaveBeenCalled();
    });
  });

  it('撮影エラー時にエラーメッセージを表示する', async () => {
    (html2canvas as any).mockRejectedValue(new Error('撮影に失敗しました'));

    render(
      <ScreenshotCapture workerId={mockWorkerId} onCaptureComplete={mockOnCaptureComplete} />
    );

    const captureButton = screen.getByText(/スクリーンショット|screenshot/i);
    fireEvent.click(captureButton);

    await waitFor(() => {
      expect(screen.getByText(/撮影に失敗しました|error/i)).toBeInTheDocument();
    });
  });

  it('指定された要素を撮影できる', async () => {
    const mockElement = document.createElement('div');
    mockElement.id = 'target-element';
    document.body.appendChild(mockElement);

    const mockCanvas = {
      toDataURL: vi.fn(() => 'data:image/png;base64,test'),
    };
    (html2canvas as any).mockResolvedValue(mockCanvas);
    (api.post as any).mockResolvedValue({
      data: {
        success: true,
        data: { id: 1 },
      },
    });

    render(
      <ScreenshotCapture
        workerId={mockWorkerId}
        onCaptureComplete={mockOnCaptureComplete}
        targetElementId="target-element"
      />
    );

    const captureButton = screen.getByText(/スクリーンショット|screenshot/i);
    fireEvent.click(captureButton);

    await waitFor(() => {
      expect(html2canvas).toHaveBeenCalledWith(mockElement, expect.any(Object));
    });

    document.body.removeChild(mockElement);
  });
});


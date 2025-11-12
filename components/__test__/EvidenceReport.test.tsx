/**
 * EvidenceReport コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EvidenceReport from '../EvidenceReport';
import { evidenceReportApi } from '@/lib/api';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: { ja: { translation: {} }, en: { translation: {} } },
  lng: 'ja',
  fallbackLng: 'ja',
  interpolation: { escapeValue: false },
});

vi.mock('@/lib/api', () => ({
  evidenceReportApi: {
    downloadPDF: vi.fn(),
    downloadCSV: vi.fn(),
  },
}));

// fetchをモック化
global.fetch = vi.fn();
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('EvidenceReport', () => {
  const mockWorkerId = 1;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('証跡レポートコンポーネントが表示される', () => {
    render(
      <TestWrapper>
        <EvidenceReport workerId={mockWorkerId} />
      </TestWrapper>
    );

    expect(screen.getByText(/PDF|CSV|レポート|report/i)).toBeInTheDocument();
  });

  it('PDFダウンロードボタンが表示される', () => {
    render(
      <TestWrapper>
        <EvidenceReport workerId={mockWorkerId} />
      </TestWrapper>
    );

    expect(screen.getByText(/PDF|ダウンロード|download/i)).toBeInTheDocument();
  });

  it('CSVダウンロードボタンが表示される', () => {
    render(
      <TestWrapper>
        <EvidenceReport workerId={mockWorkerId} />
      </TestWrapper>
    );

    expect(screen.getByText(/CSV|ダウンロード|download/i)).toBeInTheDocument();
  });

  it('期間を指定してPDFをダウンロードできる', async () => {
    const mockBlob = new Blob(['test'], { type: 'application/pdf' });
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
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

    render(
      <TestWrapper>
        <EvidenceReport workerId={mockWorkerId} />
      </TestWrapper>
    );

    const pdfButton = screen.getByText(/PDF|ダウンロード|download/i);
    fireEvent.click(pdfButton);

    await waitFor(() => {
      expect(evidenceReportApi.downloadPDF).toHaveBeenCalled();
    });
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    (evidenceReportApi.downloadPDF as any).mockRejectedValue(new Error('ダウンロードに失敗しました'));

    render(
      <TestWrapper>
        <EvidenceReport workerId={mockWorkerId} />
      </TestWrapper>
    );

    const pdfButton = screen.getByText(/PDF|ダウンロード|download/i);
    fireEvent.click(pdfButton);

    await waitFor(() => {
      expect(screen.getByText(/ダウンロードに失敗しました|Error/i)).toBeInTheDocument();
    });
  });
});


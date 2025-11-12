/**
 * ManagementPanel コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ManagementPanel from '../ManagementPanel';

// 子コンポーネントをモック化
vi.mock('../AdminSummary', () => ({
  default: () => <div data-testid="admin-summary">AdminSummary</div>,
}));

vi.mock('../WorkerList', () => ({
  default: ({ onSelectWorker, selectedWorker }: any) => (
    <div data-testid="worker-list">
      WorkerList
      <button onClick={() => onSelectWorker(1)}>Select Worker</button>
      <div>Selected: {selectedWorker}</div>
    </div>
  ),
}));

vi.mock('../TrainingMenuManagement', () => ({
  default: () => <div data-testid="training-menu">TrainingMenuManagement</div>,
}));

describe('ManagementPanel', () => {
  const mockOnSelectWorker = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('コンポーネントがレンダリングされる', () => {
    render(
      <ManagementPanel
        selectedWorker={null}
        onSelectWorker={mockOnSelectWorker}
        userRole="administrator"
      />
    );

    expect(screen.getByText(/管理者向けサマリー/)).toBeInTheDocument();
  });

  describe('管理者ロール', () => {
    it('管理者向けサマリー、全作業員の進捗、訓練メニュー管理のすべてが表示される', () => {
      render(
        <ManagementPanel
          selectedWorker={null}
          onSelectWorker={mockOnSelectWorker}
          userRole="administrator"
        />
      );

      expect(screen.getByText(/管理者向けサマリー/)).toBeInTheDocument();
      expect(screen.getByText(/全作業員の進捗/)).toBeInTheDocument();
      expect(screen.getByText(/訓練メニュー管理/)).toBeInTheDocument();
    });

    it('管理者向けサマリーの表示/非表示を切り替えられる', () => {
      render(
        <ManagementPanel
          selectedWorker={null}
          onSelectWorker={mockOnSelectWorker}
          userRole="administrator"
        />
      );

      const toggleButton = screen.getByText(/管理者向けサマリー/);
      expect(screen.getByTestId('admin-summary')).toBeInTheDocument();

      fireEvent.click(toggleButton);
      expect(screen.queryByTestId('admin-summary')).not.toBeInTheDocument();

      fireEvent.click(toggleButton);
      expect(screen.getByTestId('admin-summary')).toBeInTheDocument();
    });

    it('訓練メニュー管理の表示/非表示を切り替えられる', () => {
      render(
        <ManagementPanel
          selectedWorker={null}
          onSelectWorker={mockOnSelectWorker}
          userRole="administrator"
        />
      );

      const toggleButton = screen.getByText(/訓練メニュー管理/);
      expect(screen.getByTestId('training-menu')).toBeInTheDocument();

      fireEvent.click(toggleButton);
      expect(screen.queryByTestId('training-menu')).not.toBeInTheDocument();

      fireEvent.click(toggleButton);
      expect(screen.getByTestId('training-menu')).toBeInTheDocument();
    });
  });

  describe('監査者ロール', () => {
    it('管理者向けサマリーと全作業員の進捗が表示される', () => {
      render(
        <ManagementPanel
          selectedWorker={null}
          onSelectWorker={mockOnSelectWorker}
          userRole="auditor"
        />
      );

      expect(screen.getByText(/管理者向けサマリー/)).toBeInTheDocument();
      expect(screen.getByText(/全作業員の進捗/)).toBeInTheDocument();
      expect(screen.queryByText(/訓練メニュー管理/)).not.toBeInTheDocument();
    });

    it('訓練メニュー管理は表示されない', () => {
      render(
        <ManagementPanel
          selectedWorker={null}
          onSelectWorker={mockOnSelectWorker}
          userRole="auditor"
        />
      );

      expect(screen.queryByTestId('training-menu')).not.toBeInTheDocument();
    });
  });

  describe('受講者ロール', () => {
    it('管理者向けサマリー、全作業員の進捗、訓練メニュー管理がすべて表示されない', () => {
      render(
        <ManagementPanel
          selectedWorker={null}
          onSelectWorker={mockOnSelectWorker}
          userRole="trainee"
        />
      );

      expect(screen.queryByText('管理者向けサマリー')).not.toBeInTheDocument();
      expect(screen.queryByText('全作業員の進捗')).not.toBeInTheDocument();
      expect(screen.queryByText('訓練メニュー管理')).not.toBeInTheDocument();
    });
  });

  it('WorkerListにonSelectWorkerが渡される', () => {
    render(
      <ManagementPanel
        selectedWorker={null}
        onSelectWorker={mockOnSelectWorker}
        userRole="administrator"
      />
    );

    const selectButton = screen.getByText('Select Worker');
    fireEvent.click(selectButton);

    expect(mockOnSelectWorker).toHaveBeenCalledWith(1);
  });

  it('selectedWorkerがWorkerListに渡される', () => {
    render(
      <ManagementPanel
        selectedWorker={123}
        onSelectWorker={mockOnSelectWorker}
        userRole="administrator"
      />
    );

    expect(screen.getByText('Selected: 123')).toBeInTheDocument();
  });
});


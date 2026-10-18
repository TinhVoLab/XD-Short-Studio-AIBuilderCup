import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './Button';

interface PanelErrorBoundaryProps {
  children: ReactNode;
  resetKey?: string | number | null;
  panelName?: string;
}

interface PanelErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class PanelErrorBoundary extends Component<
  PanelErrorBoundaryProps,
  PanelErrorBoundaryState
> {
  public state: PanelErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): PanelErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn(
      `[PanelErrorBoundary] Caught error in panel "${this.props.panelName || 'Unknown'}":`,
      error.message,
      errorInfo
    );
  }

  public componentDidUpdate(prevProps: PanelErrorBoundaryProps) {
    // Auto-recovery: If user switches tab or active element, reset error state
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 16,
            margin: 12,
            backgroundColor: 'rgba(255, 77, 79, 0.06)',
            border: '1px solid rgba(255, 77, 79, 0.3)',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            color: 'var(--text, #f0f6fc)',
            fontSize: 'var(--font-sm, 11.5px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ff7875', fontWeight: 600 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{this.props.panelName || 'Bảng điều khiển'} gặp sự cố hiển thị</span>
          </div>

          <p style={{ margin: 0, color: 'var(--text-sub, #8b949e)', lineHeight: 1.4 }}>
            Đã cô lập lỗi thành công. Các chức năng phát video, dòng thời gian và dự án vẫn hoạt động bình thường.
          </p>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <Button
              variant="secondary"
              size="xs"
              onClick={this.handleRetry}
              leftIcon={
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6" />
                  <path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                </svg>
              }
            >
              Thử lại
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

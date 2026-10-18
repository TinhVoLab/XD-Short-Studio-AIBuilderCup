import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error caught by ErrorBoundary:', error, errorInfo)
    this.setState({ errorInfo })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleResetStorage = () => {
    if (window.confirm('Khôi phục trạng thái mặc định (xóa cache tạm của phiên này)?')) {
      localStorage.removeItem('xd_short_active_project_id')
      localStorage.setItem('xd_short_view_mode', 'editor')
      window.location.href = window.location.origin + '?view=app'
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            width: '100vw',
            backgroundColor: '#0A0D14',
            color: '#FFF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            fontFamily: 'Inter, system-ui, sans-serif',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              maxWidth: 600,
              width: '100%',
              backgroundColor: '#121722',
              border: '1px solid rgba(255, 68, 68, 0.4)',
              borderRadius: 12,
              padding: 24,
              boxShadow: '0 16px 40px rgba(0,0,0,0.8), 0 0 20px rgba(255, 68, 68, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: 'rgba(255, 68, 68, 0.15)',
                  border: '1px solid #FF4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FF4444',
                  fontWeight: 900,
                  fontSize: 16,
                }}
              >
                !
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#FFF' }}>
                Đã xảy ra sự cố hiển thị (Render Error)
              </h2>
            </div>

            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Hệ thống đã tự động bảo vệ dữ liệu dự án của bạn và ghi lại lỗi chi tiết dưới đây.
            </p>

            <div
              style={{
                backgroundColor: '#080A0E',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 8,
                padding: '12px 14px',
                fontSize: 11,
                fontFamily: 'monospace',
                color: '#FF7777',
                marginBottom: 20,
                maxHeight: 180,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {this.state.error?.toString() || 'Lỗi không xác định'}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={this.handleResetStorage}
                style={{
                  padding: '8px 14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 6,
                  color: '#D1D5DB',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Khôi phục mặc định
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  padding: '8px 18px',
                  backgroundColor: '#BEFF01',
                  border: 'none',
                  borderRadius: 6,
                  color: '#000',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Tải lại trang
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

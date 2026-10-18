import React, { Component, ErrorInfo, ReactNode } from 'react';
import { SceneElement } from '../../types/scene';

interface ElementErrorBoundaryProps {
  el: SceneElement;
  children: ReactNode;
}

interface ElementErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ElementErrorBoundary extends Component<
  ElementErrorBoundaryProps,
  ElementErrorBoundaryState
> {
  public state: ElementErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ElementErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn(
      `[ElementErrorBoundary] Caught runtime error on element "${this.props.el?.id}" (${this.props.el?.type}):`,
      error.message,
      errorInfo
    );
  }

  public componentDidUpdate(prevProps: ElementErrorBoundaryProps) {
    // Auto-recovery: If element props change (e.g. user edited in Inspector, undo, or frame shift), retry render
    if (prevProps.el !== this.props.el && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  public render() {
    if (this.state.hasError) {
      const { el } = this.props;
      return (
        <div
          style={{
            position: 'absolute',
            left: el?.left ?? 0,
            top: el?.top ?? 0,
            width: el?.width ?? 160,
            height: el?.height ?? 50,
            transform: `rotate(${el?.angle ?? 0}deg) scale(${el?.scaleX ?? 1}, ${el?.scaleY ?? 1})`,
            border: '1.5px dashed rgba(255, 77, 79, 0.45)',
            backgroundColor: 'rgba(255, 77, 79, 0.08)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '4px 8px',
            color: '#ff7875',
            fontSize: 11,
            fontFamily: 'sans-serif',
            boxSizing: 'border-box',
            pointerEvents: 'none',
            zIndex: 999,
          }}
          title={`Sự cố hiển thị: ${this.state.error?.message || 'Lỗi cú pháp hoặc dữ liệu không hợp lệ'}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>[Lỗi phần tử: {el?.type || 'unknown'}]</span>
        </div>
      );
    }

    return this.props.children;
  }
}

import React from 'react';
import styles from '../ProjectsModal.module.css';
import { Button } from '@/components/ui';

interface BatchRenderActionBarProps {
  selectedCount: number;
  isQueueRunning: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  isAllSelected: boolean;
  onStartBatchRender: () => void;
  onCancelQueue: () => void;
}

export const BatchRenderActionBar: React.FC<BatchRenderActionBarProps> = ({
  selectedCount,
  isQueueRunning,
  onSelectAll,
  onDeselectAll,
  isAllSelected,
  onStartBatchRender,
  onCancelQueue
}) => {
  if (selectedCount === 0 && !isQueueRunning) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 14px',
      marginBottom: '12px',
      background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.15) 0%, rgba(190, 255, 1, 0.1) 100%)',
      border: '1px solid rgba(168, 85, 247, 0.35)',
      borderRadius: '10px',
      animation: 'fadeIn 0.2s ease',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{
          fontSize: '12px',
          fontWeight: 700,
          color: '#BEFF01',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span>Đã chọn: {selectedCount} dự án</span>
        </span>

        <Button
          variant="secondary"
          size="xs"
          onClick={isAllSelected ? onDeselectAll : onSelectAll}
        >
          {isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
        </Button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isQueueRunning ? (
          <Button
            variant="danger"
            size="xs"
            onClick={onCancelQueue}
            leftIcon={
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="4" width="16" height="16" rx="2" />
              </svg>
            }
          >
            Hủy hàng đợi
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={onStartBatchRender}
            leftIcon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
              </svg>
            }
          >
            RENDER ĐỒNG LOẠT ({selectedCount})
          </Button>
        )}
      </div>
    </div>
  );
};

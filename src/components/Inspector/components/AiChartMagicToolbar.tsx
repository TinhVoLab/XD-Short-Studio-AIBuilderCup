import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { ELEMENTS_REGISTRY } from '@/config/elementsRegistry';
import { AiMagicFillModal } from '@/components/AiMagicFillModal';

interface AiChartMagicToolbarProps {
  element: any;
}

export default function AiChartMagicToolbar({ element }: AiChartMagicToolbarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!element || !element.type) return null;
  
  // Only show the Magic Fill toolbar if this element type supports it (has an ai() method)
  const registryEntry = ELEMENTS_REGISTRY[element.type];
  if (!registryEntry || typeof registryEntry.ai !== 'function') return null;

  return (
    <>
      <div
        style={{
          marginTop: '2px',
          marginBottom: '14px',
          padding: '12px',
          background: 'linear-gradient(135deg, rgba(190, 255, 1, 0.06) 0%, rgba(0, 212, 255, 0.06) 100%)',
          border: '1px solid rgba(190, 255, 1, 0.2)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style={{ color: 'var(--accent, #BEFF01)', flexShrink: 0 }}>
              <path d="M8 0L9.4 5.6L15 7L9.4 8.4L8 14L6.6 8.4L1 7L6.6 5.6L8 0Z" />
            </svg>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'var(--accent, #BEFF01)',
                letterSpacing: '0.4px',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              AI Magic Fill
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted, #6e7681)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Điền số liệu & cấu trúc tự động
          </span>
        </div>
        
        <Button 
          size="sm" 
          variant="primary" 
          onClick={() => setIsModalOpen(true)}
          style={{ 
            height: '26px', 
            fontSize: '11px', 
            padding: '0 10px',
            fontWeight: 700,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0L9.4 5.6L15 7L9.4 8.4L8 14L6.6 8.4L1 7L6.6 5.6L8 0Z" />
          </svg>
          Mở AI
        </Button>
      </div>

      {/* AI Magic Fill Modal */}
      <AiMagicFillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        element={element}
      />
    </>
  );
}

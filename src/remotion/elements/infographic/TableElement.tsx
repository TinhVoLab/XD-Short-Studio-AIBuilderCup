import React from 'react';
import { spring, interpolate } from 'remotion';
import { AdvElementProps } from '../types';

export const TableElement: React.FC<AdvElementProps> = ({ el, computedStyle, frame, fps, delayFrames = 0 }) => {
  const tableData: any = el.tableData || {};
  const headers = Array.isArray(tableData.headers) && tableData.headers.length > 0 
    ? tableData.headers 
    : ['Phương án A', 'Phương án B'];
    
  const rawRows = Array.isArray(tableData.rows) ? tableData.rows : [
    ['$25K-60K', '$400-1.2K'],
    ['$4K-9K /th', '--'],
    ['Tự động', '$500-5K /lần']
  ];

  const rawLabels = Array.isArray(tableData.labels) && tableData.labels.length > 0
    ? tableData.labels
    : (Array.isArray(tableData.rowLabels) ? tableData.rowLabels : ['Chi Phí Xây Dựng', 'Vận Hành', 'Bảo Trì']);

  const w = el.width || 336;
  const accent = el.accentColor || el.color || 'var(--accent)';
  const secondAccent = (el as any).secondAccent || (tableData as any).secondColor || 'var(--text)';

  // Animation tổng thể của Bảng
  const enterSpring = spring({
    fps,
    frame: Math.max(0, frame - delayFrames),
    config: { damping: 14, stiffness: 120 }
  });

  return (
    <div style={{ 
      ...computedStyle, 
      width: w,
      backgroundColor: el.bgColor || 'var(--card-bg)',
      border: `1px solid color-mix(in srgb, ${accent} 40%, transparent)`,
      borderRadius: el.radius !== undefined ? el.radius : 16,
      padding: '16px 14px',
      boxShadow: `var(--shadow-md, 0 8px 32px rgba(0, 0, 0, 0.5))`,
      boxSizing: 'border-box',
      display: 'flex', 
      flexDirection: 'column', 
      // computedStyle (style cũ) mang alignItems: center → các hàng co về bề rộng chữ (~170px); kéo giãn đủ thẻ
      alignItems: 'stretch',
      justifyContent: 'flex-start',
      gap: 12,
      opacity: enterSpring,
      transform: `${computedStyle.transform || ''} scale(${interpolate(enterSpring, [0, 1], [0.95, 1])})`,
    }}>
      
      {/* Header So Sánh 2 Bên */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 10,
        borderBottom: '1px solid var(--border)',
        position: 'relative'
      }}>
        {/* Vạch kẻ chia đôi */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 10,
          width: 1,
          backgroundColor: 'var(--border)',
          transform: 'translateX(-50%)'
        }} />

        <div style={{ flex: 1, textAlign: 'center', paddingRight: 8, overflow: 'hidden' }}>
          <span style={{ 
            fontSize: 13, fontWeight: 900, color: 'var(--text)', fontFamily: 'Be Vietnam Pro', 
            textTransform: 'uppercase', letterSpacing: 0.5,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block'
          }}>
            {String(headers[0])}
          </span>
        </div>
        
        <div style={{ flex: 1, textAlign: 'center', paddingLeft: 8, overflow: 'hidden' }}>
          <span style={{ 
            fontSize: 13, fontWeight: 900, color: secondAccent, fontFamily: 'Be Vietnam Pro', 
            textTransform: 'uppercase', letterSpacing: 0.5,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block'
          }}>
            {String(headers[1] || 'Phương án B')}
          </span>
        </div>
      </div>

      {/* Danh Sách Các Tiêu Chí (Rows) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {rawRows.map((r: any, rIdx: number) => {
          const cells = Array.isArray(r) ? r : [String(r)];
          const rowLabel = rawLabels[rIdx] || `Tiêu chí ${rIdx + 1}`;
          
          // Animation lật mở từng hàng
          const rowSpring = spring({
            fps,
            frame: Math.max(0, frame - delayFrames - (rIdx * 4) - 6),
            config: { damping: 12 }
          });

          return (
            <div key={rIdx} style={{
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              opacity: rowSpring,
              transform: `translateY(${interpolate(rowSpring, [0, 1], [10, 0])}px)`,
            }}>
              
              {/* Tên Tiêu Chí (Nằm giữa, viền mỏng trong suốt) */}
              <div style={{
                alignSelf: 'center',
                backgroundColor: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: '3px 12px',
                zIndex: 2,
                marginBottom: -10, // Đè lên line mờ
              }}>
                <span style={{ 
                  fontSize: 10, fontWeight: 700, color: 'var(--text)', fontFamily: 'Inter', letterSpacing: 0.3,
                  whiteSpace: 'nowrap'
                }}>
                  {rowLabel}
                </span>
              </div>

              {/* Box Chứa Dữ Liệu 2 Cột Trái Phải (Trong suốt) */}
              <div style={{
                display: 'flex',
                backgroundColor: 'transparent', // Màu trong suốt theo yêu cầu
                padding: '16px 4px 6px 4px', 
                borderBottom: rIdx < rawRows.length - 1 ? '1px dashed var(--border)' : 'none',
                position: 'relative',
              }}>
                {/* Vạch mờ chia đôi background */}
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  bottom: 0,
                  width: 1,
                  backgroundColor: 'var(--border)',
                }} />

                {/* Giá trị cột A */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', paddingRight: 8, overflow: 'hidden' }}>
                  <span style={{ 
                    fontSize: 13, fontWeight: 800, color: 'var(--text)', fontFamily: 'Be Vietnam Pro', textAlign: 'center',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {String(cells[0] ?? '--')}
                  </span>
                </div>

                {/* Giá trị cột B */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', paddingLeft: 8, overflow: 'hidden' }}>
                  <span style={{ 
                    fontSize: 13, fontWeight: 800, color: 'var(--text-sub)', fontFamily: 'Be Vietnam Pro', textAlign: 'center',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {String(cells[1] ?? '--')}
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};


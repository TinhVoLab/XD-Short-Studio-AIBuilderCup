import React from 'react';
import { ElementProps } from '../types';
import { mixColor } from '../../utils/rich-text-parser';

export const LottieElement: React.FC<ElementProps & { frame: number; fps?: number }> = ({ el, computedStyle, frame }) => {
  const w = el.width || 85;
  const h = el.height || 85;
  const preset = el.lottiePreset || 'tech-hud';
  const color = el.color || el.accentColor || '#BEFF01';

  return (
    <div
      style={{
        ...computedStyle,
        width: w,
        height: h,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* ── 0. HOOK & CURIOSITY (Group 2) ── */}
      {preset === 'shifty-eyes' && (
        <div
          style={{
            fontSize: Math.min(w, h) * 0.75,
            transform: `translateX(${Math.sin(frame * 0.2) * 12}px) scale(${1 + Math.abs(Math.sin(frame * 0.1)) * 0.15})`,
            textShadow: '0 0 14px rgba(0, 212, 255, 0.6)',
          }}
        >
          👀
        </div>
      )}

      {preset === 'shh-secret' && (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Pulsing secret sound wave circle */}
          <div
            style={{
              position: 'absolute',
              width: w * 0.85,
              height: h * 0.85,
              borderRadius: '50%',
              border: `1.5px dashed ${color}`,
              opacity: (1 - ((frame * 1.5) % 25) / 25) * 0.7,
              transform: `scale(${1 + (((frame * 1.5) % 25) / 25) * 0.6})`,
            }}
          />
          <div
            style={{
              fontSize: Math.min(w, h) * 0.75,
              transform: `translateY(${Math.sin(frame * 0.25) * -5}px) rotate(${Math.sin(frame * 0.2) * 6}deg)`,
              textShadow: `0 0 14px ${mixColor(color, 53)}`,
            }}
          >
            🤫
          </div>
        </div>
      )}

      {preset === 'bouncing-question' && (
        <div
          style={{
            fontSize: Math.min(w, h) * 0.8,
            transform: `translateY(${Math.abs(Math.sin(frame * 0.3)) * -14}px) rotate(${Math.sin(frame * 0.3) * 15}deg) scale(${1 + Math.sin(frame * 0.3) * 0.1})`,
            textShadow: '0 0 16px rgba(192, 132, 252, 0.6)',
          }}
        >
          ❓
        </div>
      )}

      {preset === 'idea-pop' && (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Radiating burst aura */}
          <div
            style={{
              position: 'absolute',
              width: w * 0.9,
              height: h * 0.9,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,215,0,0.35) 0%, transparent 70%)',
              transform: `scale(${frame % 15 < 8 ? 1.4 : 0.9})`,
              opacity: frame % 15 < 8 ? 0.9 : 0.3,
            }}
          />
          <div
            style={{
              fontSize: Math.min(w, h) * 0.75,
              transform: `scale(${1 + (frame % 12 < 6 ? 0.22 : 0)}) rotate(${Math.sin(frame * 0.2) * 8}deg)`,
              textShadow: '0 0 16px rgba(255, 215, 0, 0.7)',
            }}
          >
            💡
          </div>
        </div>
      )}

      {/* ── 1. CTA & ACTIONS ── */}
      {preset === 'subscribe-bell' && (
        <div
          style={{
            fontSize: Math.min(w, h) * 0.75,
            transform: `rotate(${Math.sin(frame * 0.35) * 22}deg)`,
            transformOrigin: 'top center',
            textShadow: '0 0 12px rgba(255,215,0,0.6)',
          }}
        >
          🔔
        </div>
      )}

      {preset === 'heart-beat' && (
        <div
          style={{
            fontSize: Math.min(w, h) * 0.75,
            transform: `scale(${1 + Math.abs(Math.sin(frame * 0.25)) * 0.28})`,
            textShadow: '0 0 15px rgba(255,51,102,0.7)',
          }}
        >
          ❤️
        </div>
      )}

      {preset === 'live-hearts' && (
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'visible' }}>
          {Array.from({ length: 7 }).map((_, i) => {
            const isLike = i % 3 === 0;
            const emoji = isLike ? '👍' : (i % 2 === 0 ? '💖' : '❤️');
            
            // Speed multiplier
            const speed = 1.4 + (i * 0.2);
            // Offset so they don't spawn at the same time
            const offset = i * 45;
            // Cycle length (frames)
            const cycle = 120;
            const current = (frame * speed + offset) % cycle;
            // Normalize progress 0 -> 1
            const p = current / cycle;
            
            // Y goes from bottom to way up high
            const y = h + 20 - p * (h * 3.5);
            
            // X sways left and right using Sine wave
            const sway = Math.sin(p * Math.PI * (2 + i % 3)) * (w * 0.6);
            const baseX = (w / 2) + ((i % 2 === 0 ? 1 : -1) * (i * 3)) - 10; 
            
            // Opacity fades out near the top
            let op = 1;
            if (p > 0.75) op = 1 - (p - 0.75) / 0.25;
            if (p < 0.1) op = p / 0.1;
            
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: baseX + sway,
                  top: y,
                  opacity: op,
                  fontSize: Math.min(w, h) * (isLike ? 0.3 : 0.35),
                  transform: `rotate(${Math.sin(p * Math.PI * 4) * 15}deg)`,
                }}
              >
                {emoji}
              </div>
            );
          })}
        </div>
      )}

      {preset === 'mouse-click' && (() => {
        const cycle = frame % 100;
        
        let ptrScale = 1;
        let ptrX = 0;
        let ptrY = 0;
        let ptrOpacity = 1;

        if (cycle < 20) {
          const p = cycle / 20;
          const ease = 1 - Math.pow(1 - p, 3);
          ptrX = 150 * (1 - ease); // Fly from 150px away
          ptrY = 150 * (1 - ease);
          ptrScale = ease;
        } else if (cycle >= 20 && cycle < 45) {
          if (cycle >= 35 && cycle < 40) ptrScale = 1 - ((cycle - 35) / 5) * 0.15;
          else if (cycle >= 40 && cycle < 45) ptrScale = 0.85 + ((cycle - 40) / 5) * 0.15;
        } else if (cycle >= 80) {
          const p = (cycle - 80) / 20;
          const ease = p * p;
          ptrX = ease * 80; // Fly out 80px
          ptrY = ease * 80;
          ptrOpacity = 1 - p;
        }

        const rippleProgress = cycle >= 38 && cycle < 80 ? (cycle - 38) / 42 : 0;
        const rippleActive = cycle >= 38 && cycle < 80;

        return (
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
            {rippleActive && (
              <>
                <div style={{
                  position: 'absolute', width: w * 0.35, height: w * 0.35, borderRadius: '50%',
                  border: `3px solid ${color}`, transform: `scale(${1 + rippleProgress * 2.5})`,
                  opacity: 1 - rippleProgress,
                  marginTop: -h * 0.25, marginLeft: -w * 0.05, // Shift to fingertip
                }} />
                <div style={{
                  position: 'absolute', width: w * 0.35, height: w * 0.35, borderRadius: '50%',
                  border: `2px solid ${color}`, transform: `scale(${1 + (rippleProgress > 0.15 ? (rippleProgress - 0.15) * 2.5 : 0)})`,
                  opacity: rippleProgress > 0.15 ? 1 - ((rippleProgress - 0.15) / 0.85) : 0,
                  marginTop: -h * 0.25, marginLeft: -w * 0.05, // Shift to fingertip
                }} />
              </>
            )}
            <div style={{
              position: 'absolute', fontSize: Math.min(w, h) * 0.6,
              transform: `translate(${ptrX}px, ${ptrY}px) scale(${ptrScale})`,
              transformOrigin: '45% 15%', // Center on fingertip
              opacity: ptrOpacity,
            }}>
              👆
            </div>
          </div>
        );
      })()}

      {preset === 'voucher-drop' && (
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'visible' }}>
          {Array.from({ length: 6 }).map((_, i) => {
            const icons = ['🎟️', '🏷️', '💰'];
            const emoji = icons[i % 3];
            const speed = 1.2 + (i * 0.25);
            const offset = i * 35;
            const cycle = 140;
            const current = (frame * speed + offset) % cycle;
            const p = current / cycle;
            
            // Y goes from way above top to way below bottom
            const y = - (h * 1.5) + p * (h * 4.5);
            
            const sway = Math.sin(p * Math.PI * 2 + i) * (w * 0.45);
            const baseX = (w * 0.2) + (i * (w * 0.12)); 
            const rot = (frame * 3 + i * 45) % 360;
            
            let op = 1;
            if (p < 0.15) op = p / 0.15;
            if (p > 0.85) op = 1 - (p - 0.85) / 0.15;
            
            return (
              <div
                key={i}
                style={{
                  position: 'absolute', left: baseX + sway, top: y, opacity: op,
                  fontSize: Math.min(w, h) * 0.4, transform: `rotate(${rot}deg)`,
                }}
              >
                {emoji}
              </div>
            );
          })}
        </div>
      )}

      {preset === 'bookmark-save' && (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Subtle golden pin glow */}
          <div
            style={{
              position: 'absolute',
              width: w * 0.75,
              height: h * 0.75,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,215,0,0.35) 0%, transparent 70%)',
              transform: `scale(${1 + Math.sin(frame * 0.3) * 0.2})`,
            }}
          />
          <div
            style={{
              fontSize: Math.min(w, h) * 0.75,
              transform: `translateY(${Math.sin(frame * 0.28) * -6}px) scale(${1 + Math.abs(Math.sin(frame * 0.28)) * 0.12})`,
              textShadow: '0 0 15px rgba(255, 215, 0, 0.7)',
            }}
          >
            🔖
          </div>
        </div>
      )}

      {preset === 'thumb-like' && (
        <div
          style={{
            fontSize: Math.min(w, h) * 0.75,
            transform: `translateY(${Math.sin(frame * 0.3) * -8}px) scale(${1 + Math.sin(frame * 0.3) * 0.1})`,
            textShadow: '0 0 14px rgba(0,212,255,0.7)',
          }}
        >
          👍
        </div>
      )}

      {preset === 'finger-tap' && (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              position: 'absolute',
              width: w * 0.8,
              height: h * 0.8,
              borderRadius: '50%',
              border: `2px solid ${color}`,
              opacity: (1 - ((frame * 2) % 30) / 30),
              transform: `scale(${1 + (((frame * 2) % 30) / 30) * 0.8})`,
            }}
          />
          <div
            style={{
              fontSize: Math.min(w, h) * 0.7,
              transform: `scale(${1 - Math.abs(Math.sin(frame * 0.25)) * 0.15})`,
              textShadow: `0 0 10px ${color}`,
            }}
          >
            👆
          </div>
        </div>
      )}

      {/* ── 2. HYPE & VIRAL ── */}
      {preset === 'fire' && (
        <div
          style={{
            fontSize: Math.min(w, h) * 0.8,
            transform: `scale(${1 + Math.sin(frame * 0.3) * 0.16}) translateY(${Math.cos(frame * 0.3) * -4}px)`,
            textShadow: '0 0 15px rgba(255, 85, 68, 0.8)',
          }}
        >
          🔥
        </div>
      )}

      {preset === 'lightning-bolt' && (
        <div
          style={{
            fontSize: Math.min(w, h) * 0.8,
            transform: `scale(${frame % 6 < 3 ? 1.25 : 1}) rotate(${Math.sin(frame * 0.4) * 8}deg)`,
            textShadow: '0 0 16px rgba(255, 215, 0, 0.8)',
          }}
        >
          ⚡
        </div>
      )}

      {preset === 'sparkle-stars' && (
        <div
          style={{
            fontSize: Math.min(w, h) * 0.75,
            transform: `rotate(${frame * 4}deg) scale(${1 + Math.sin(frame * 0.3) * 0.2})`,
            textShadow: '0 0 14px rgba(190, 255, 1, 0.7)',
          }}
        >
          ✨
        </div>
      )}

      {preset === 'confetti-party' && (
        <div
          style={{
            fontSize: Math.min(w, h) * 0.75,
            transform: `scale(${1 + Math.sin(frame * 0.25) * 0.2}) rotate(${Math.sin(frame * 0.2) * 15}deg)`,
            textShadow: '0 0 12px rgba(0, 255, 136, 0.7)',
          }}
        >
          🎉
        </div>
      )}

      {/* ── 3. TECH & CYBER ── */}
      {preset === 'ai-brain' && (
        <div
          style={{
            fontSize: Math.min(w, h) * 0.75,
            transform: `scale(${1 + Math.cos(frame * 0.25) * 0.12})`,
            textShadow: '0 0 15px rgba(0, 212, 255, 0.7)',
          }}
        >
          🧠
        </div>
      )}

      {preset === 'tech-hud' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: `2px dashed ${color}`,
            transform: `rotate(${frame * 3}deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 16px ${mixColor(color, 27)}`,
          }}
        >
          <div
            style={{
              width: '55%',
              height: '55%',
              borderRadius: '50%',
              border: `1.5px solid #fff`,
              opacity: 0.7,
              transform: `rotate(${-frame * 4}deg)`,
            }}
          />
        </div>
      )}

      {preset === 'globe-network' && (
        <div
          style={{
            fontSize: Math.min(w, h) * 0.75,
            transform: `rotate(${frame * 2}deg) scale(${1 + Math.sin(frame * 0.2) * 0.08})`,
            textShadow: '0 0 14px rgba(0, 255, 136, 0.7)',
          }}
        >
          🌐
        </div>
      )}

      {preset === 'terminal-cursor' && (
        <div
          style={{
            width: '100%',
            height: '80%',
            backgroundColor: 'rgba(10, 16, 28, 0.95)',
            borderRadius: '8px',
            border: '1.5px solid #00D4FF',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            boxShadow: '0 0 15px rgba(0,212,255,0.3)',
          }}
        >
          <span style={{ color: '#BEFF01', fontWeight: 900, fontSize: '13px', marginRight: '6px' }}>&gt;_</span>
          <div
            style={{
              width: '8px',
              height: '14px',
              backgroundColor: frame % 20 < 10 ? '#00D4FF' : 'transparent',
            }}
          />
        </div>
      )}

      {/* ── 4. ARROWS & GUIDES ── */}
      {preset === 'arrow-bounce' && (
        <div
          style={{
            fontSize: Math.min(w, h) * 0.75,
            transform: `translateY(${Math.sin(frame * 0.3) * 10}px)`,
            textShadow: '0 0 14px rgba(255, 184, 0, 0.7)',
          }}
        >
          ⬇️
        </div>
      )}

      {preset === 'arrow-curve' && (
        <div
          style={{
            fontSize: Math.min(w, h) * 0.75,
            transform: `scale(${1 + Math.sin(frame * 0.25) * 0.12}) rotate(${Math.sin(frame * 0.2) * 8}deg)`,
            textShadow: '0 0 14px rgba(190, 255, 1, 0.7)',
          }}
        >
          ⤵️
        </div>
      )}

      {/* ── 5. BADGES & GOALS ── */}
      {preset === 'check' && (
        <div
          style={{
            width: w * 0.85,
            height: h * 0.85,
            borderRadius: '50%',
            backgroundColor: 'rgba(190,255,1,0.18)',
            border: '2px solid #BEFF01',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(190,255,1,0.4)',
            transform: `scale(${1 + Math.sin(frame * 0.2) * 0.08})`,
          }}
        >
          <span style={{ fontSize: w * 0.45, color: '#BEFF01', fontWeight: 900 }}>✓</span>
        </div>
      )}

      {preset === 'trophy-gold' && (
        <div
          style={{
            fontSize: Math.min(w, h) * 0.75,
            transform: `scale(${1 + Math.sin(frame * 0.25) * 0.1}) rotate(${Math.sin(frame * 0.15) * 8}deg)`,
            textShadow: '0 0 16px rgba(255, 215, 0, 0.8)',
          }}
        >
          🏆
        </div>
      )}

      {preset === 'warning-alert' && (
        <div
          style={{
            fontSize: Math.min(w, h) * 0.75,
            transform: `scale(${frame % 10 < 5 ? 1.2 : 1})`,
            textShadow: '0 0 15px rgba(255, 51, 102, 0.8)',
          }}
        >
          ⚠️
        </div>
      )}

      {preset === 'timer-clock' && (
        <div
          style={{
            fontSize: Math.min(w, h) * 0.75,
            transform: `scale(${1 + Math.sin(frame * 0.3) * 0.1})`,
            textShadow: '0 0 14px rgba(0, 212, 255, 0.7)',
          }}
        >
          ⏱️
        </div>
      )}
    </div>
  );
};

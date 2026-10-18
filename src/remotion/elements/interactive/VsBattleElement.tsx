import { RemotionElementWrapper } from '../core/RemotionElementWrapper';
import React from 'react';
import { spring, Easing } from 'remotion';
import { ElementProps } from '../types';
import { renderUniversalIcon } from '../../utils/icons';
import { DEFAULT_VS_ROUNDS, DEFAULT_VS_SUBJECTS } from '@/config/widgetDefaults';
import { mixColor } from '../../utils/rich-text-parser';

export const VsBattleElement: React.FC<ElementProps & { frame: number, fps: number, delayFrames: number, durFrames: number }> = ({ el, computedStyle, positionStyle, frame, fps, delayFrames, durFrames }) => {
  const vsData = el.vsBattle;
  
  // Edge Case Handling: Fallbacks if vsBattle is missing or empty
  const leftSub = vsData?.leftSubject || DEFAULT_VS_SUBJECTS.left;
  const rightSub = vsData?.rightSubject || DEFAULT_VS_SUBJECTS.right;
  
  const rawRounds = vsData?.rounds && vsData.rounds.length > 0 ? vsData.rounds : DEFAULT_VS_ROUNDS;

  const w = el.width || 330;
  const showBg = el.showCardBg !== false;
  
  const localFrame = Math.max(0, frame - delayFrames);

  // Header Animation (Frames 0 -> 12)
  const headerSpr = spring({ fps, frame: localFrame, config: { damping: 12, mass: 0.6 } });
  
  // Divider animation (Frames 12 -> 24)
  const dividerProgress = Math.min(1, Math.max(0, (localFrame - 12) / 12));
  const dividerEase = Easing.out(Easing.cubic)(dividerProgress);

  // Staggered Rounds calculation (Frame step = 15 frames per round)
  const roundStepFrames = Math.max(10, Math.min(18, Math.floor(45 / rawRounds.length)));
  
  // Calculate real-time cumulative scores based on frame
  let leftScore = 0;
  let rightScore = 0;

  rawRounds.forEach((r, idx) => {
    const roundUnlockFrame = 12 + idx * roundStepFrames + 6;
    if (localFrame >= roundUnlockFrame) {
      if (r.winner === 'left') leftScore += 1;
      else if (r.winner === 'right') rightScore += 1;
    }
  });

  // Header score bounce animation when score updates
  // Track which round was most recently unlocked (within last 12 frames) for accurate bump
  const lastUnlockFrame = rawRounds.reduce((latest, _, idx) => {
    const f = 12 + idx * roundStepFrames + 6;
    return localFrame >= f ? Math.max(latest, f) : latest;
  }, -1);
  const framesSinceLastScore = lastUnlockFrame >= 0 ? Math.max(0, localFrame - lastUnlockFrame) : 999;
  const scoreBumpProgress = Math.min(1, framesSinceLastScore / 12);
  const scoreScale = lastUnlockFrame >= 0
    ? 1 + Math.sin(scoreBumpProgress * Math.PI) * 0.18  // overshoot: 1.0 → 1.18 → 1.0
    : 1;

  // Determine overall winner for final banner
  const isAllRoundsFinished = localFrame >= (12 + rawRounds.length * roundStepFrames + 10);
  const overallWinner = leftScore > rightScore ? 'left' : rightScore > leftScore ? 'right' : 'tie';
  const showWinnerBanner = (vsData?.showWinner ?? true) && isAllRoundsFinished;

  const winnerBannerSpr = showWinnerBanner
    ? spring({ fps, frame: localFrame - (12 + rawRounds.length * roundStepFrames + 10), config: { damping: 10, mass: 0.8 } })
    : 0;

  return (
    <RemotionElementWrapper el={el} positionStyle={positionStyle || computedStyle}>
      <div style={{ width: w, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'visible', boxSizing: 'border-box' }}>
        
        {/* ── HEADER: DUAL-GRADIENT + SUBJECTS + LIVE SCORE ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', borderRadius: 14,
          background: showBg ? `linear-gradient(105deg, ${mixColor(leftSub.color || 'var(--accent)', 13)} 0%, var(--card-bg) 40%, var(--card-bg) 60%, ${mixColor(rightSub.color || 'var(--chart-series-1)', 13)} 100%)` : 'transparent',
          border: showBg ? '1px solid var(--border)' : 'none',
          boxShadow: showBg ? `inset 0 0 30px rgba(0,0,0,0.3), 0 0 20px ${mixColor(leftSub.color || 'var(--accent)', 9)}` : 'none',
          transform: `translateY(${(1 - headerSpr) * -30}px)`, opacity: headerSpr
        }}>
          {/* Left Subject */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, overflow: 'hidden' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', filter: `drop-shadow(0 0 8px ${leftSub.color || 'var(--accent)'})` }}>
              {renderUniversalIcon(leftSub.icon || 'bot', leftSub.color || 'var(--accent)', 20)}
            </span>
            <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--text)', fontFamily: el.fontFamily || 'var(--font-sans, inherit)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {leftSub.name}
            </span>
          </div>

          {/* Live Score Counter — neon pill */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            padding: '5px 14px',
            background: 'var(--surface-1)',
            border: `1.5px solid var(--border)`,
            borderRadius: 20,
            transform: `scale(${scoreScale})`,
            boxShadow: `0 0 12px rgba(0,0,0,0.8), 0 0 20px ${scoreScale > 1.05 ? mixColor(leftScore > rightScore ? leftSub.color || 'var(--accent)' : rightSub.color || 'var(--chart-series-1)', 33) : 'transparent'}`
          }}>
            <span style={{
              fontSize: 18, fontWeight: 900, color: 'var(--text)', fontFamily: el.fontFamily || 'var(--font-sans, inherit)',
              textShadow: scoreScale > 1.05 ? `0 0 15px ${mixColor(leftSub.color || 'var(--accent)', 60)}` : 'none'
            }}>{leftScore}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-sub)', margin: '0 2px' }}>VS</span>
            <span style={{
              fontSize: 18, fontWeight: 900, color: 'var(--text)', fontFamily: el.fontFamily || 'var(--font-sans, inherit)',
              textShadow: scoreScale > 1.05 ? `0 0 15px ${mixColor(rightSub.color || 'var(--chart-series-1)', 60)}` : 'none'
            }}>{rightScore}</span>
          </div>

          {/* Right Subject */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flex: 1, overflow: 'hidden' }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--text)', fontFamily: el.fontFamily || 'var(--font-sans, inherit)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>
              {rightSub.name}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', filter: `drop-shadow(0 0 8px ${rightSub.color || 'var(--chart-series-1)'})` }}>
              {renderUniversalIcon(rightSub.icon || 'sparkle', rightSub.color || 'var(--chart-series-1)', 20)}
            </span>
          </div>
        </div>

      {/* ── DIVIDER LINE — expands from center ── */}
      <div style={{ position: 'relative', height: 1, alignSelf: 'stretch', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: 0, left: `${(1 - dividerEase) * 50}%`,
          width: `${dividerEase * 100}%`, height: '100%',
          background: `linear-gradient(90deg, ${mixColor(leftSub.color || 'var(--accent)', 40)}, color-mix(in srgb, var(--text) 30%, transparent), ${mixColor(rightSub.color || 'var(--chart-series-1)', 40)})`,
          boxShadow: `0 0 8px color-mix(in srgb, var(--text) 30%, transparent)`
        }} />
      </div>

      {/* ── ROUND ROWS ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {rawRounds.map((r, i) => {
          const roundStartFrame = 12 + i * roundStepFrames;
          const isRoundVisible = localFrame >= roundStartFrame;
          const roundSpr = isRoundVisible 
            ? spring({ fps, frame: localFrame - roundStartFrame, config: { damping: 11, stiffness: 140 } })
            : 0;

          const isLeftWin = r.winner === 'left';
          const isRightWin = r.winner === 'right';
          const isTie = r.winner === 'tie';

          const iconSpr = isRoundVisible && localFrame >= (roundStartFrame + 6)
            ? spring({ fps, frame: localFrame - (roundStartFrame + 6), config: { damping: 8, stiffness: 180 } })
            : 0;

          // Dynamic colors from subject data
          const lColor = leftSub.color || 'var(--accent)';
          const rColor = rightSub.color || 'var(--chart-series-1)';
          const winnerColor = isLeftWin ? lColor : isRightWin ? rColor : 'var(--chart-warning)';

          return (
            <div 
              key={i}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 11px', borderRadius: 10,
                background: isLeftWin
                  ? `linear-gradient(90deg, ${mixColor(lColor, 8)} 0%, var(--surface-2) 100%)`
                  : isRightWin
                    ? `linear-gradient(90deg, var(--surface-2) 0%, ${mixColor(rColor, 8)} 100%)`
                    : isTie
                      ? mixColor('var(--chart-warning)', 6)
                      : 'var(--surface-1)',
                border: `1px solid ${isLeftWin ? mixColor(lColor, 33) : isRightWin ? mixColor(rColor, 33) : isTie ? mixColor('var(--chart-warning)', 33) : 'var(--border)'}`,
                boxShadow: iconSpr > 0.8 ? `inset 0 0 20px ${mixColor(winnerColor, 4)}` : 'none',
                transform: `translateY(${(1 - roundSpr) * 22}px)`,
                opacity: roundSpr
              }}
            >
              {/* Round Badge */}
              <span style={{
                position: 'absolute',
                fontSize: 8, fontWeight: 900, color: 'var(--text-sub)',
                letterSpacing: 0.5,
                marginLeft: -2
              }}>R{i + 1}</span>

              {/* Left Round Result */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 5, paddingLeft: 12 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  transform: `scale(${iconSpr})`, opacity: iconSpr,
                }}>
                  {renderUniversalIcon(isLeftWin ? 'check' : isRightWin ? 'cross' : 'handshake', isLeftWin ? lColor : 'var(--chart-negative, #FF3366)', 15)}
                </span>
                {r.leftValue && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, fontFamily: el.fontFamily || 'var(--font-sans, inherit)',
                    color: isLeftWin ? 'var(--text)' : 'var(--text-sub)',
                  }}>
                    {r.leftValue}
                  </span>
                )}
              </div>

              {/* Criterion Label */}
              <div style={{ flex: 1.6, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text)', fontFamily: el.fontFamily || 'var(--font-sans, inherit)', lineHeight: 1.2 }}>
                  {r.criterion}
                </span>
              </div>

              {/* Right Round Result */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5, paddingRight: 2 }}>
                {r.rightValue && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, fontFamily: el.fontFamily || 'var(--font-sans, inherit)',
                    color: isRightWin ? 'var(--text)' : 'var(--text-sub)',
                  }}>
                    {r.rightValue}
                  </span>
                )}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  transform: `scale(${iconSpr})`, opacity: iconSpr,
                }}>
                  {renderUniversalIcon(isRightWin ? 'check' : isLeftWin ? 'cross' : 'handshake', isRightWin ? rColor : 'var(--chart-negative, #FF3366)', 15)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── WINNER BANNER (REVEALED AFTER ALL ROUNDS) ── */}
      {showWinnerBanner && (
        <div style={{
          marginTop: 4, padding: '10px 14px', borderRadius: 12,
          backgroundColor: mixColor(overallWinner === 'left'
            ? (leftSub.color || 'var(--accent)')
            : overallWinner === 'right'
              ? (rightSub.color || 'var(--chart-series-1)')
              : 'var(--chart-warning)', 12),
          border: `1.5px solid ${overallWinner === 'left' ? (leftSub.color || 'var(--accent)') : overallWinner === 'right' ? (rightSub.color || 'var(--chart-series-1)') : 'var(--chart-warning)'}`,
          boxShadow: `0 0 20px ${overallWinner === 'left' ? mixColor(leftSub.color || 'var(--accent)', 27) : overallWinner === 'right' ? mixColor(rightSub.color || 'var(--chart-series-1)', 27) : mixColor('var(--chart-warning)', 27)}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transform: `scale(${0.7 + 0.3 * winnerBannerSpr})`, opacity: winnerBannerSpr
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderUniversalIcon(overallWinner === 'tie' ? 'handshake' : 'trophy', 'var(--chart-warning)', 16)}
          </span>
          <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--text)', fontFamily: el.fontFamily || 'var(--font-sans, inherit)', letterSpacing: 0.5 }}>
            {vsData?.winnerLabel || (
              overallWinner === 'left'
                ? `WINNER: ${leftSub.name.toUpperCase()} (${leftScore} - ${rightScore})`
                : overallWinner === 'right'
                  ? `WINNER: ${rightSub.name.toUpperCase()} (${rightScore} - ${leftScore})`
                  : `BẤT PHÂN THẮNG BẠI (${leftScore} - ${rightScore})`
            )}
          </span>
        </div>
      )}

      </div>
    </RemotionElementWrapper>
  );
};

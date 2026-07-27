import { useLayoutEffect, useRef, useState } from 'react';
import { MapPinIcon } from '../icons';

interface RouteLocationListProps {
  /** 経由する集合場所名の一覧（表示順は巡回順を意味しない） */
  locationNames: string[];
}

/**
 * 車カード1行目（車名の右横）に表示する経由地リスト。
 * 表示幅に応じて次の3段階で表示を切り替える。
 * 1. 全場所をアイコン＋名前で表示
 * 2. 収まらない場合、最後の場所だけ名前を省略表示（アイコンは残す）
 * 3. 最後の場所のアイコン自体も収まらない場合、全場所をアイコンのみで表示する
 */
export function RouteLocationList({ locationNames }: RouteLocationListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'text' | 'icons'>('text');

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const evaluate = () => {
      // 「最後の場所はアイコンのみ」という最小構成の自然幅（measure）が
      // 実際にカードで確保できる幅（container）に収まらない場合は、全てアイコンのみ表示に切り替える
      setMode(container.clientWidth < measure.scrollWidth ? 'icons' : 'text');
    };

    evaluate();
    const observer = new ResizeObserver(evaluate);
    observer.observe(container);
    return () => observer.disconnect();
  }, [locationNames]);

  if (locationNames.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexWrap: mode === 'icons' ? 'wrap' : 'nowrap',
        alignItems: 'center',
        flex: '1 1 auto',
        minWidth: 0,
        gap: '4px 8px',
        fontSize: '12px',
        color: 'var(--text)',
        overflow: mode === 'icons' ? 'visible' : 'hidden',
      }}
    >
      {mode === 'icons'
        ? locationNames.map((_, index) => <MapPinIcon key={index} size={12} />)
        : locationNames.map((locationName, index) => {
            const isLast = index === locationNames.length - 1;
            return (
              <span
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  flex: isLast ? '1 1 auto' : '0 0 auto',
                  minWidth: isLast ? 0 : undefined,
                }}
              >
                <MapPinIcon size={12} />
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {locationName}
                </span>
              </span>
            );
          })}

      {/* 表示切替判定専用の非表示計測用要素。「最後の場所はアイコンのみ」の最小幅を計測する */}
      <div
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          visibility: 'hidden',
          pointerEvents: 'none',
          top: '-9999px',
          left: '-9999px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
        }}
      >
        {locationNames.map((locationName, index) => {
          const isLast = index === locationNames.length - 1;
          return (
            <span key={index} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <MapPinIcon size={12} />
              {!isLast && locationName}
            </span>
          );
        })}
      </div>
    </div>
  );
}

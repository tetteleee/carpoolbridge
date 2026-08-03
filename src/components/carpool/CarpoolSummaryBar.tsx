import { memo, useLayoutEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { CarIcon, ChevronDownIcon, FlagIcon, MapPinIcon, SummaryIcon, UserIcon } from '../icons';
import { computeOccupantCount, type CarCardData } from '../../utils/carCard';
import { toCarName } from '../../utils/carName';

/** チップ部分の開閉アニメーションの所要時間（ミリ秒）。CSSのtransitionと値を合わせる */
const TOGGLE_TRANSITION_MS = 200;

interface CarpoolSummaryBarProps {
  /** 選択中タブ（行き／帰り）の車カード一覧。表示順は渡された順のまま利用する */
  carCards: CarCardData[];
  /** 選択中タブ（行き／帰り）の未配車人数 */
  unassignedCount: number;
  /** 選択中タブ（行き／帰り）の配車不要人数 */
  noRideNeededCount: number;
  /** サマリー帯（チップ部分）の開閉状態 */
  expanded: boolean;
  /** 見出し行タップ時に呼び出す、開閉切り替え処理 */
  onToggleExpanded: () => void;
}

const headerButtonStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '7px 12px',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--sans)',
  fontSize: '12px',
  fontWeight: 700,
  color: 'var(--text)',
  textAlign: 'left',
  boxSizing: 'border-box',
};

const chipBaseStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  height: '24px',
  padding: '0 6px',
  borderRadius: '999px',
  fontSize: '11px',
  fontWeight: 700,
  whiteSpace: 'nowrap',
} as const;

/**
 * 配車画面（メイン）のサマリー帯。
 * 未配車人数・各車の乗車率／経由地数をチップで表示し、車の台数が多い場合でも
 * 横スクロールはさせず折り返し表示にすることで、一目で全体を見渡せるようにする。
 * ヘッダー・行き／帰りタブと一体でsticky表示されることを前提に、帯自体の背景は
 * 本文と同じ色とし、チップにのみ薄い背景色をつけて視認性を確保する（浮いて見えないように）。
 *
 * 見出し行（本コンポーネント自体）は常時表示し、タップでチップ部分の開閉を切り替える
 * （回答編集画面の家庭カード開閉と同じ「見出し行＋シェブロン」操作に統一する）。
 *
 * チップ部分の開閉は、CSS Grid（grid-template-rows）のtransitionではなく、
 * JSで実測した高さ（px）をheightのtransitionで動かす方式で実装する。
 * grid-template-rowsのアニメーションはSafariでの最適化が弱くコマ落ちしやすいため採用しない。
 * 開いている間はheight: autoに戻し、車の台数変化などチップの内容が変わっても
 * 素の高さに追従できるようにする。
 */
function CarpoolSummaryBarComponent({
  carCards,
  unassignedCount,
  noRideNeededCount,
  expanded,
  onToggleExpanded,
}: CarpoolSummaryBarProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isFirstRenderRef = useRef(true);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const content = contentRef.current;
    if (!panel || !content) {
      return;
    }

    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      panel.style.height = expanded ? 'auto' : '0px';
      return;
    }

    if (expanded) {
      panel.style.height = `${content.scrollHeight}px`;
    } else {
      // 現在の高さ（開いている間はautoのため実測が必要）を明示指定してから
      // 0にすることで、heightのtransitionを発生させる
      const current = panel.getBoundingClientRect().height;
      panel.style.height = `${current}px`;
      void panel.offsetHeight; // 強制的にレイアウトを確定させる
      panel.style.height = '0px';
    }

    const timer = window.setTimeout(() => {
      if (expanded && panelRef.current) {
        panelRef.current.style.height = 'auto';
      }
    }, TOGGLE_TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [expanded]);

  return (
    <div style={{ background: 'var(--bg)' }}>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls="carpool-summary-bar-chips"
        onClick={onToggleExpanded}
        className="carpool-summary-toggle"
        style={headerButtonStyle}
      >
        <SummaryIcon size={14} />
        <span style={{ flex: 1 }}>サマリー</span>
        <span
          aria-hidden="true"
          style={{
            display: 'flex',
            transform: expanded ? undefined : 'rotate(-90deg)',
            transition: 'transform 0.15s ease',
          }}
        >
          <ChevronDownIcon size={16} />
        </span>
      </button>

      <div
        ref={panelRef}
        style={{
          overflow: 'hidden',
          transition: `height ${TOGGLE_TRANSITION_MS}ms ease`,
        }}
      >
        <div
          ref={contentRef}
          id="carpool-summary-bar-chips"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '4px',
            padding: '0 12px 8px',
            boxSizing: 'border-box',
          }}
        >
          {unassignedCount > 0 && (
            <span
              style={{
                ...chipBaseStyle,
                gap: '3px',
                background: 'var(--panel-bg)',
                border: '1px solid var(--border)',
                color: 'var(--text-h)',
              }}
            >
              <UserIcon size={12} />
              {unassignedCount}
            </span>
          )}

          {carCards.map((car) => {
            const occupantCount = computeOccupantCount(car);
            const isOverCapacity = occupantCount > car.capacity;
            const isFull = !isOverCapacity && occupantCount === car.capacity;
            const accentColor = isOverCapacity
              ? 'var(--negative)'
              : isFull
                ? 'var(--accent)'
                : 'var(--positive)';

            return (
              <span
                key={car.id}
                style={{
                  ...chipBaseStyle,
                  gap: '3px',
                  padding: '0 6px 0 5px',
                  background: isOverCapacity ? 'var(--negative-bg)' : 'var(--panel-bg)',
                  border: `1px solid ${isOverCapacity ? 'var(--negative-border)' : 'var(--border)'}`,
                  color: isOverCapacity ? 'var(--negative)' : 'var(--text-h)',
                }}
              >
                <CarIcon size={10} />
                <span
                  style={{
                    padding: '0 4px',
                    borderLeft: `3px solid ${accentColor}`,
                    lineHeight: 1,
                    color: 'var(--text-h)',
                  }}
                >
                  {toCarName(car.familyName)}
                </span>
                <span>
                  {occupantCount}/{car.capacity}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '1px',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: 'var(--text)',
                  }}
                >
                  <MapPinIcon size={9} />
                  {car.routeLocationNames.length}
                </span>
              </span>
            );
          })}

          {noRideNeededCount > 0 && (
            <span
              style={{
                ...chipBaseStyle,
                gap: '3px',
                fontWeight: 600,
                background: 'var(--panel-bg)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            >
              <FlagIcon size={12} />
              {noRideNeededCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export const CarpoolSummaryBar = memo(CarpoolSummaryBarComponent);

import { CarCard } from '../carpool/CarCard';
import { NoRideNeededArea } from '../carpool/NoRideNeededArea';
import { UnassignedArea } from '../carpool/UnassignedArea';
import { CalendarIcon, MapPinIcon } from '../icons';
import { formatDateWithWeekday } from '../../utils/date';
import type { CarpoolBoardData } from '../../services/carpool/carpoolBoardData';
import type { Direction } from '../../types/event';

interface DirectionSection {
  direction: Direction;
  label: string;
  /** 方向を直感的に示す矢印（進行方向のイメージ） */
  arrow: string;
}

const DIRECTION_SECTIONS: DirectionSection[] = [
  { direction: 'OUTWARD', label: '行き', arrow: '→' },
  { direction: 'RETURN', label: '帰り', arrow: '←' },
];

interface ShareImageLayoutProps {
  /** イベント名 */
  eventName: string;
  /** イベント開催日（"YYYY-MM-DD"形式） */
  eventDate: string;
  /** 目的地名 */
  destinationName: string;
  /** 行き・帰り両方向分の表示用データ */
  boardDataByDirection: Record<Direction, CarpoolBoardData>;
}

/**
 * LINE共有の共有用画像として生成する内容（見出し→行きセクション→帰りセクション）を
 * そのまま表示する、静的な表示専用レイアウト。
 *
 * 車カード・未配車エリア・配車不要エリアは配車画面（メイン、8章）と同じ表示コンポーネントを
 * 流用し、ドラッグハンドルなど操作専用のUI要素のみ非表示にする（04_画面設計.md#9.2）。
 * 車が多い場合でも縦に長くなりすぎないよう、各カードは余白を詰めた表示（dense）にする。
 * ref: docs/04_画面設計.md#9.2 共有用画像の内容
 */
export function ShareImageLayout({
  eventName,
  eventDate,
  destinationName,
  boardDataByDirection,
}: ShareImageLayoutProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        padding: '16px 14px 18px',
        background: 'var(--bg)',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          paddingBottom: '10px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-h)' }}>
          {eventName}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '4px',
            color: 'var(--text)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
            <CalendarIcon size={13} />
            <span style={{ fontSize: '12.5px' }}>{formatDateWithWeekday(eventDate)}</span>
          </span>
          {destinationName && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPinIcon size={13} />
              <span style={{ fontSize: '12.5px' }}>{destinationName}</span>
            </span>
          )}
        </div>
      </div>

      {DIRECTION_SECTIONS.map(({ direction, label, arrow }, index) => {
        const boardData = boardDataByDirection[direction];
        return (
          <div
            key={direction}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingTop: index > 0 ? '6px' : undefined,
              borderTop: index > 0 ? '1px solid var(--border)' : undefined,
            }}
          >
            <h2
              style={{
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.02em',
                color: '#fff',
                background: 'var(--accent)',
                borderRadius: '6px',
              }}
            >
              <span aria-hidden="true">{arrow}</span>
              {label}
            </h2>

            <UnassignedArea people={boardData.unassignedPeople} hideLeadingIcon dense hideWhenEmpty />

            {boardData.carCards.map((car) => (
              <CarCard key={car.id} car={car} hideLeadingIcon dense />
            ))}

            <NoRideNeededArea people={boardData.noRideNeededPeople} dense />
          </div>
        );
      })}
    </div>
  );
}

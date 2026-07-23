import type { Event } from '../types/event';
import { ChevronRightIcon } from './icons';
import { formatDateWithWeekday, getTodayDateString } from '../utils/date';

interface EventListProps {
  /** 表示対象のイベント一覧 */
  events: Event[];
  /** 目的地IDから目的地名を引くためのマップ */
  destinationNameById: Record<string, string>;
  /** イベント行タップ時のコールバック（配車画面への遷移に使用） */
  onEventClick: (eventId: string) => void;
}

/**
 * イベント一覧をホーム画面用に表示するコンポーネント。
 * 1件ずつ角丸カードで表示し、日付順に並び替え、本日のイベントを強調表示、
 * 開催日を過ぎたイベントはグレーアウトして表示する。状態はラベル文字列ではなく
 * 表示スタイル（カードの縁取り・背景・不透明度）で表現する。
 */
export function EventList({
  events,
  destinationNameById,
  onEventClick,
}: EventListProps) {
  if (events.length === 0) {
    return (
      <p
        id="event-list-empty"
        style={{
          margin: 0,
          padding: '32px 16px',
          textAlign: 'center',
          fontSize: '14px',
          color: 'var(--text)',
        }}
      >
        イベントがありません
      </p>
    );
  }

  const today = getTodayDateString();
  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div
      id="event-list"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '0 16px 16px',
        boxSizing: 'border-box',
      }}
    >
      {sortedEvents.map((event) => {
        const isToday = event.date === today;
        const isPast = event.date < today;
        const destinationName = destinationNameById[event.destinationId] ?? '';

        return (
          <button
            key={event.id}
            type="button"
            className="event-card"
            onClick={() => onEventClick(event.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '14px 16px',
              borderRadius: '16px',
              border: isToday
                ? '1px solid var(--accent-border)'
                : '1px solid var(--border)',
              background: isToday ? 'var(--accent-bg)' : 'var(--bg)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
              boxSizing: 'border-box',
              opacity: isPast ? 0.5 : 1,
              textAlign: 'left',
              fontFamily: 'var(--sans)',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                flexShrink: 0,
                fontSize: '14px',
                fontWeight: isToday ? 700 : 500,
                color: isToday ? 'var(--accent)' : 'var(--text-h)',
                whiteSpace: 'nowrap',
              }}
            >
              {formatDateWithWeekday(event.date)}
            </span>

            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                textAlign: 'left',
              }}
            >
              <span
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  fontSize: '15px',
                  fontWeight: 700,
                  lineHeight: 1.35,
                  wordBreak: 'break-word',
                  color: isToday ? 'var(--accent)' : 'var(--text-h)',
                }}
              >
                {event.name}
              </span>
              {destinationName && (
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '13px',
                    color: 'var(--text)',
                  }}
                >
                  {destinationName}
                </span>
              )}
            </div>

            <span style={{ flexShrink: 0, color: 'var(--text)' }}>
              <ChevronRightIcon size={18} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

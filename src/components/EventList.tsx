import type { Event } from '../types/event';
import { formatDateWithWeekday, getTodayDateString } from '../utils/date';

interface EventListProps {
  /** 表示対象のイベント一覧 */
  events: Event[];
  /** 目的地IDから目的地名を引くためのマップ */
  destinationNameById: Record<string, string>;
}

/**
 * イベント一覧をホーム画面用に表示するコンポーネント。
 * 日付順に並び替え、本日のイベントを強調表示、開催日を過ぎたイベントは
 * グレーアウトして表示する。状態はラベル文字列ではなく表示スタイルで表現する。
 */
export function EventList({ events, destinationNameById }: EventListProps) {
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
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      {sortedEvents.map((event) => {
        const isToday = event.date === today;
        const isPast = event.date < today;
        const destinationName = destinationNameById[event.destinationId] ?? '';

        return (
          <div
            key={event.id}
            className="event-list-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
              boxSizing: 'border-box',
              opacity: isPast ? 0.45 : 1,
              background: isToday ? 'var(--accent-bg)' : 'transparent',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: '10px',
                textAlign: 'center',
                color: 'var(--accent)',
                visibility: isToday ? 'visible' : 'hidden',
              }}
            >
              ●
            </span>
            <span
              style={{
                minWidth: '76px',
                fontSize: '14px',
                fontWeight: isToday ? 700 : 400,
                color: isToday ? 'var(--accent)' : 'var(--text-h)',
              }}
            >
              {formatDateWithWeekday(event.date)}
            </span>
            <span
              style={{
                fontSize: '15px',
                fontWeight: isToday ? 700 : 400,
                color: isToday ? 'var(--accent)' : 'var(--text-h)',
                textAlign: 'left',
              }}
            >
              {event.name}
              {destinationName ? ` ${destinationName}` : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}

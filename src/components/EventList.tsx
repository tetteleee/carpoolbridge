import { useState } from 'react';
import type { Event } from '../types/event';
import { Button } from './common/Button';
import { Card } from './common/Card';
import { ChevronDownIcon, ChevronRightIcon, GearIcon } from './icons';
import { formatDateWithWeekday, getTodayDateString } from '../utils/date';

interface EventListProps {
  /** 表示対象のイベント一覧 */
  events: Event[];
  /** 目的地IDから目的地名を引くためのマップ */
  destinationNameById: Record<string, string>;
  /** イベント行タップ時のコールバック（配車画面への遷移に使用） */
  onEventClick: (eventId: string) => void;
  /** 編集アイコンタップ時のコールバック（イベント情報編集画面への遷移に使用） */
  onEditClick: (eventId: string) => void;
}

/**
 * イベント一覧をホーム画面用に表示するコンポーネント。
 * 本日以降のイベントを日付順に表示し、本日のイベントを強調表示する。
 * 開催日を過ぎたイベントは初期状態では折りたたみ、件数表示の行をタップすると
 * グレーアウトした状態で展開される。状態はラベル文字列ではなく
 * 表示スタイル（カードの縁取り・背景・不透明度）で表現する。
 */
export function EventList({
  events,
  destinationNameById,
  onEventClick,
  onEditClick,
}: EventListProps) {
  const [showPast, setShowPast] = useState(false);

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
  const upcomingEvents = sortedEvents.filter((event) => event.date >= today);
  const pastEvents = sortedEvents.filter((event) => event.date < today);

  const renderEventCard = (event: Event, isPast: boolean) => {
    const isToday = event.date === today;
    const destinationName = destinationNameById[event.destinationId] ?? '';

    return (
      <Card
        key={event.id}
        id={`event-card-${event.id}`}
        className="event-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          width: '100%',
          padding: '14px 8px 14px 16px',
          border: isToday ? '1px solid var(--accent-border)' : undefined,
          background: isToday ? 'var(--accent-bg)' : undefined,
          opacity: isPast ? 0.5 : 1,
          fontFamily: 'var(--sans)',
        }}
      >
        <button
          type="button"
          className="event-card-body"
          onClick={() => onEventClick(event.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flex: 1,
            minWidth: 0,
            padding: 0,
            border: 'none',
            background: 'transparent',
            font: 'inherit',
            color: 'inherit',
            textAlign: 'left',
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

          <span
            style={{
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              color: 'var(--text)',
            }}
          >
            <ChevronRightIcon size={18} />
          </span>
        </button>

        <button
          type="button"
          className="event-card-edit"
          aria-label="イベント情報を編集"
          onClick={() => onEditClick(event.id)}
          style={{
            flexShrink: 0,
            marginLeft: '12px',
            minWidth: '36px',
            minHeight: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            borderRadius: '50%',
            background: 'transparent',
            color: 'var(--text)',
            cursor: 'pointer',
          }}
        >
          <GearIcon size={18} />
        </button>
      </Card>
    );
  };

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
      {upcomingEvents.length > 0 ? (
        upcomingEvents.map((event) => renderEventCard(event, false))
      ) : (
        <p
          id="event-list-no-upcoming"
          style={{
            margin: 0,
            padding: '8px 4px',
            fontSize: '14px',
            color: 'var(--text)',
          }}
        >
          今後の予定はありません
        </p>
      )}

      {pastEvents.length > 0 && (
        <>
          <Button
            variant="secondary"
            size="sm"
            id="event-list-past-toggle"
            onClick={() => setShowPast((prev) => !prev)}
            aria-expanded={showPast}
            style={{ justifyContent: 'space-between', width: '100%' }}
          >
            <span>過去のイベント（{pastEvents.length}件）</span>
            <span
              style={{
                display: 'inline-flex',
                transform: showPast ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.15s ease',
              }}
            >
              <ChevronDownIcon size={16} />
            </span>
          </Button>

          {showPast && pastEvents.map((event) => renderEventCard(event, true))}
        </>
      )}
    </div>
  );
}

import type { Event } from '../types/event';
import { Button } from './common/Button';
import { Card } from './common/Card';
import { ChevronDownIcon, ChevronRightIcon, GearIcon, LoadingIndicator } from './icons';
import { formatDateWithWeekday, getTodayDateString } from '../utils/date';

interface EventListProps {
  /** 本日以降のイベント一覧（日付昇順） */
  upcomingEvents: Event[];
  /** 展開・追加取得済みの過去イベント一覧（日付降順＝新しい順） */
  pastEvents: Event[];
  /** 過去のイベントの総件数（「過去のイベント（n件）」表示用。展開前から取得済み） */
  pastEventsCount: number;
  /** 過去のイベントを展開表示中かどうか */
  pastExpanded: boolean;
  /** 過去のイベントにまだ取得していないページが残っているかどうか */
  pastHasMore: boolean;
  /** 過去のイベントのページを取得中かどうか */
  pastLoading: boolean;
  /** 目的地IDから目的地名を引くためのマップ */
  destinationNameById: Record<string, string>;
  /** イベント行タップ時のコールバック（配車画面への遷移に使用） */
  onEventClick: (eventId: string) => void;
  /** 編集アイコンタップ時のコールバック（イベント情報編集画面への遷移に使用） */
  onEditClick: (eventId: string) => void;
  /** 「過去のイベント（n件）」行タップ時のコールバック（展開・折りたたみ切り替え） */
  onTogglePast: () => void;
  /** 「もっと見る」タップ時のコールバック（次ページ取得） */
  onLoadMorePast: () => void;
}

/**
 * イベント一覧をホーム画面用に表示するコンポーネント。
 * 本日以降のイベントを日付順に表示し、本日のイベントを強調表示する。
 * 開催日を過ぎたイベントは初期状態では折りたたみ、件数表示の行をタップすると
 * グレーアウトした状態で展開される。過去のイベントは新しい順に20件ずつ
 * 追加取得する（「もっと見る」）。状態はラベル文字列ではなく
 * 表示スタイル（カードの縁取り・背景・不透明度）で表現する。
 */
export function EventList({
  upcomingEvents,
  pastEvents,
  pastEventsCount,
  pastExpanded,
  pastHasMore,
  pastLoading,
  destinationNameById,
  onEventClick,
  onEditClick,
  onTogglePast,
  onLoadMorePast,
}: EventListProps) {
  if (upcomingEvents.length === 0 && pastEventsCount === 0) {
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

  const renderEventCard = (event: Event, isPast: boolean) => {
    const isToday = event.date === today;
    const destinationName = destinationNameById[event.destinationId] ?? '（削除済み）';

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

      {pastEventsCount > 0 && (
        <>
          <Button
            variant="secondary"
            size="sm"
            id="event-list-past-toggle"
            onClick={onTogglePast}
            aria-expanded={pastExpanded}
            style={{ justifyContent: 'space-between', width: '100%' }}
          >
            <span>過去のイベント（{pastEventsCount}件）</span>
            <span
              style={{
                display: 'inline-flex',
                transform: pastExpanded ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.15s ease',
              }}
            >
              <ChevronDownIcon size={16} />
            </span>
          </Button>

          {pastExpanded && (
            <>
              {pastEvents.map((event) => renderEventCard(event, true))}

              {pastLoading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
                  <LoadingIndicator />
                </div>
              )}

              {!pastLoading && pastHasMore && (
                <Button
                  variant="secondary"
                  size="sm"
                  id="event-list-past-load-more"
                  onClick={onLoadMorePast}
                  style={{ width: '100%' }}
                >
                  もっと見る
                </Button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventList } from '../components/EventList';
import { CarIcon, SettingsIcon } from '../components/icons';
import { getEvents } from '../services/event/eventService';
import { getDestinations } from '../services/master/destinationService';
import type { Event } from '../types/event';

/**
 * ホーム画面（イベント一覧）。
 * イベントを日付順に表示し、本日のイベントを強調・過去のイベントをグレーアウトする。
 * イベント行をタップすると、そのイベントの配車画面（メイン）へ遷移する。
 */
export function HomePage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [destinationNameById, setDestinationNameById] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getEvents(), getDestinations()])
      .then(([eventList, destinations]) => {
        setEvents(eventList);
        setDestinationNameById(
          Object.fromEntries(destinations.map((d) => [d.id, d.name]))
        );
      })
      .catch(() => setError('イベント一覧の取得に失敗しました'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      id="home-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      <div
        id="home-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--bg)',
          padding: '16px 16px 20px',
          borderBottom: '1px solid var(--border)',
          boxSizing: 'border-box',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '999px',
            background: 'var(--accent-bg)',
            color: 'var(--accent)',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          <CarIcon size={14} />
          配車アシスタント
        </span>

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '8px',
            marginTop: '10px',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: '26px',
              fontWeight: 700,
              color: 'var(--text-h)',
            }}
          >
            イベント一覧
          </h1>
          <span
            style={{
              flexShrink: 0,
              fontSize: '13px',
              color: 'var(--text)',
              whiteSpace: 'nowrap',
            }}
          >
            全{events.length}件
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '16px',
          boxSizing: 'border-box',
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/master')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 18px',
            borderRadius: '999px',
            border: 'none',
            background: 'var(--code-bg)',
            color: 'var(--text-h)',
            fontSize: '14px',
            fontFamily: 'var(--sans)',
            cursor: 'pointer',
          }}
        >
          <SettingsIcon size={16} />
          マスタ管理
        </button>
        <button
          type="button"
          onClick={() => navigate('/events/new')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 18px',
            borderRadius: '999px',
            border: 'none',
            background: 'var(--accent-bg)',
            color: 'var(--accent)',
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: 'var(--sans)',
            cursor: 'pointer',
          }}
        >
          + イベント作成
        </button>
      </div>

      {error && (
        <p style={{ margin: 0, padding: '0 16px 16px', fontSize: '13px', color: 'crimson' }}>
          {error}
        </p>
      )}

      {loading ? (
        <p style={{ margin: 0, padding: '0 16px 16px', fontSize: '14px', color: 'var(--text)' }}>
          読み込み中...
        </p>
      ) : (
        <EventList
          events={events}
          destinationNameById={destinationNameById}
          onEventClick={(eventId) => navigate(`/events/${eventId}/carpool`)}
        />
      )}
    </div>
  );
}

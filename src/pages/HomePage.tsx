import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventList } from '../components/EventList';
import { SettingsIcon } from '../components/icons';
import { getEvents } from '../services/event/eventService';
import { getDestinations } from '../services/master/destinationService';
import type { Event } from '../types/event';

/**
 * ホーム画面（イベント一覧）。
 * イベントを日付順に表示し、本日のイベントを強調・過去のイベントをグレーアウトする。
 * イベントタップ時の配車画面への遷移はT38aで実施するため、本画面では行わない。
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
        maxWidth: '480px',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '20px',
            color: 'var(--text-h)',
          }}
        >
          CarpoolBridge
        </h1>
        <button
          type="button"
          onClick={() => navigate('/master')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            background: 'none',
            color: 'var(--text)',
            fontSize: '14px',
            fontFamily: 'var(--sans)',
            cursor: 'pointer',
          }}
        >
          <SettingsIcon size={16} />
          マスタ管理
        </button>
      </div>

      {error && (
        <p style={{ margin: 0, padding: '16px', fontSize: '13px', color: 'crimson' }}>
          {error}
        </p>
      )}

      {loading ? (
        <p style={{ margin: 0, padding: '16px', fontSize: '14px', color: 'var(--text)' }}>
          読み込み中...
        </p>
      ) : (
        <EventList events={events} destinationNameById={destinationNameById} />
      )}
    </div>
  );
}

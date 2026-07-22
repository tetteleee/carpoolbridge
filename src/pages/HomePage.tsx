import { useEffect, useState } from 'react';
import { EventList } from '../components/EventList';
import { getEvents } from '../services/event/eventService';
import { getDestinations } from '../services/master/destinationService';
import type { Event } from '../types/event';

/**
 * ホーム画面（イベント一覧）。
 * イベントを日付順に表示し、本日のイベントを強調・過去のイベントをグレーアウトする。
 * イベントタップ時の配車画面への遷移はT38aで実施するため、本画面では行わない。
 */
export function HomePage() {
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
      <h1
        style={{
          margin: 0,
          padding: '16px',
          fontSize: '20px',
          color: 'var(--text-h)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        CarpoolBridge
      </h1>

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

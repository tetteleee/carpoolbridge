import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventList } from '../components/EventList';
import { Header, HeaderChip } from '../components/Header';
import { Button } from '../components/common/Button';
import { SettingsIcon } from '../components/icons';
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
        <Header
          title="イベント一覧"
          showAppIcon
          trailing={<HeaderChip>全{events.length}件</HeaderChip>}
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '16px',
          boxSizing: 'border-box',
        }}
      >
        <Button
          variant="secondary"
          size="sm"
          icon={<SettingsIcon size={16} />}
          onClick={() => navigate('/master')}
        >
          マスタ管理
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/events/new')}
        >
          + イベント作成
        </Button>
      </div>

      {error && (
        <p style={{ margin: 0, padding: '0 16px 16px', fontSize: '13px', color: 'var(--negative)' }}>
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

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventList } from '../components/EventList';
import { Header } from '../components/Header';
import { TutorialGuideModal } from '../components/TutorialGuideModal';
import { Button } from '../components/common/Button';
import { InfoIcon, LoadingIndicator, SettingsIcon } from '../components/icons';
import { useTutorialGuide } from '../hooks/useTutorialGuide';
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
  const { show: showTutorial, dismiss: dismissTutorial } = useTutorialGuide();
  const [manualTutorialOpen, setManualTutorialOpen] = useState(false);

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
    <>
      <TutorialGuideModal
        open={showTutorial || manualTutorialOpen}
        onClose={() => {
          dismissTutorial();
          setManualTutorialOpen(false);
        }}
      />
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
            background: 'var(--panel-bg)',
            padding: '16px 16px 20px',
            borderBottom: '1px solid var(--border)',
            boxSizing: 'border-box',
          }}
        >
          <Header
            title="イベント一覧"
            showAppIcon
            trailing={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  aria-label="使い方を見る"
                  onClick={() => setManualTutorialOpen(true)}
                  style={{
                    flexShrink: 0,
                    width: '36px',
                    height: '36px',
                    padding: 0,
                    borderRadius: '50%',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text-h)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <InfoIcon size={18} />
                </button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<SettingsIcon size={16} />}
                  onClick={() => navigate('/master')}
                >
                  登録情報
                </Button>
              </div>
            }
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box',
          }}
        >
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
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 16px' }}>
            <LoadingIndicator />
          </div>
        ) : (
          <EventList
            events={events}
            destinationNameById={destinationNameById}
            onEventClick={(eventId) => navigate(`/events/${eventId}/carpool`)}
            onEditClick={(eventId) => navigate(`/events/${eventId}/edit-info`)}
          />
        )}
      </div>
    </>
  );
}

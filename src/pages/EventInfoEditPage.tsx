import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Button } from '../components/common/Button';
import { FlagIcon, LoadingIndicator } from '../components/icons';
import { getEvent, updateEvent } from '../services/event/eventService';
import { getDestinations } from '../services/master/destinationService';
import type { Destination } from '../types/master';

/**
 * イベント情報編集画面。
 * イベント名・日付・場所（目的地）のみを編集する画面であり、
 * 回答内容を編集する「イベント編集 回答入力」画面（EventEditPage）とは別画面（04_画面設計.md#12）。
 */
export function EventInfoEditPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      return;
    }

    Promise.all([getEvent(eventId), getDestinations()])
      .then(([eventData, destinationsData]) => {
        setDestinations(destinationsData);
        if (eventData) {
          setName(eventData.name);
          setDate(eventData.date);
          setDestinationId(eventData.destinationId);
        }
      })
      .catch(() => setError('イベント情報の取得に失敗しました'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const canSave = name.trim() !== '' && date !== '' && destinationId !== '';

  const handleCancel = () => {
    navigate('/');
  };

  const handleSave = async () => {
    if (!eventId || !canSave) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateEvent(eventId, { name: name.trim(), date, destinationId });
      navigate('/');
    } catch {
      setError('イベント情報の保存に失敗しました');
      setSaving(false);
    }
  };

  return (
    <div
      id="event-info-edit-page"
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
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--bg)',
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
          boxSizing: 'border-box',
        }}
      >
        <Header title="イベント情報を編集" backTo="/" />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '16px',
          boxSizing: 'border-box',
        }}
      >
        {error && (
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--negative)' }}>
            {error}
          </p>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <LoadingIndicator />
          </div>
        ) : (
          <>
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '13px',
                color: 'var(--text)',
              }}
            >
              イベント名
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例：練習試合"
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '16px',
                  fontFamily: 'var(--sans)',
                  color: 'var(--text-h)',
                  background: 'transparent',
                  boxSizing: 'border-box',
                }}
              />
            </label>

            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '13px',
                color: 'var(--text)',
              }}
            >
              日付
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '16px',
                  fontFamily: 'var(--sans)',
                  color: 'var(--text-h)',
                  background: 'transparent',
                  boxSizing: 'border-box',
                }}
              />
            </label>

            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '13px',
                color: 'var(--text)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FlagIcon size={14} />
                場所
              </span>
              {destinations.length === 0 ? (
                <span style={{ fontSize: '14px', color: 'var(--text)' }}>
                  登録済みの目的地がありません。先にマスタ管理画面で登録してください
                </span>
              ) : (
                <select
                  value={destinationId}
                  onChange={(e) => setDestinationId(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '16px',
                    fontFamily: 'var(--sans)',
                    color: 'var(--text-h)',
                    background: 'transparent',
                    boxSizing: 'border-box',
                  }}
                >
                  {destinations.map((destination) => (
                    <option key={destination.id} value={destination.id}>
                      {destination.name}
                    </option>
                  ))}
                </select>
              )}
            </label>
          </>
        )}
      </div>

      {!loading && (
        <div
          style={{
            display: 'flex',
            gap: '12px',
            padding: '16px',
            boxSizing: 'border-box',
          }}
        >
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={saving}
            style={{ flex: 1 }}
          >
            キャンセル
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!canSave || saving}
            style={{ flex: 1 }}
          >
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      )}
    </div>
  );
}

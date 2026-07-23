import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { FlagIcon } from '../components/icons';
import { createEvent } from '../services/event/eventService';
import { getDestinations } from '../services/master/destinationService';
import { getTodayDateString } from '../utils/date';
import type { Destination } from '../types/master';

/**
 * イベント作成画面。
 * イベント名・日付・目的地を入力し、保存するとホーム画面へ遷移する。
 * 目的地の新規登録UIは対象設計書間の記載矛盾により本画面の対象外（マスタ管理画面T14で行う）。
 */
export function EventCreatePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [destinationId, setDestinationId] = useState('');
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDestinations()
      .then((data) => {
        setDestinations(data);
        if (data.length > 0) {
          setDestinationId(data[0].id);
        }
      })
      .catch(() => setError('目的地一覧の取得に失敗しました'))
      .finally(() => setLoading(false));
  }, []);

  const canSave = name.trim() !== '' && date !== '' && destinationId !== '';

  const handleSave = async () => {
    if (!canSave) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createEvent({ name: name.trim(), date, destinationId });
      navigate('/');
    } catch {
      setError('イベントの保存に失敗しました');
      setSaving(false);
    }
  };

  return (
    <div
      id="event-create-page"
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
        <Header title="イベント作成" backTo="/" />
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
            目的地
          </span>
          {loading ? (
            <span style={{ fontSize: '14px', color: 'var(--text)' }}>
              読み込み中...
            </span>
          ) : destinations.length === 0 ? (
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
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '16px',
          boxSizing: 'border-box',
        }}
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || saving}
          style={{
            padding: '12px 32px',
            borderRadius: '999px',
            border: 'none',
            background: 'var(--accent)',
            color: 'var(--accent-contrast, #fff)',
            fontSize: '16px',
            fontFamily: 'var(--sans)',
            cursor: !canSave || saving ? 'default' : 'pointer',
            opacity: !canSave || saving ? 'var(--disabled-opacity)' : 1,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
          }}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}

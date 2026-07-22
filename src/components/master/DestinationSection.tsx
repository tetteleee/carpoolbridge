import { useEffect, useState } from 'react';
import {
  createDestination,
  getDestinations,
  updateDestination,
} from '../../services/master/destinationService';
import type { Destination } from '../../types/master';

type EditableField = 'name' | 'latitude' | 'longitude';

/**
 * マスタ管理画面「目的地」セクション。
 * 登録済み目的地の一覧表示・その場編集・新規追加を行う。
 */
export function DestinationSection() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDestinations()
      .then(setDestinations)
      .catch(() => setError('目的地の取得に失敗しました'))
      .finally(() => setLoading(false));
  }, []);

  const handleFieldChange = (
    id: string,
    field: EditableField,
    value: string
  ) => {
    setDestinations((prev) =>
      prev.map((destination) =>
        destination.id === id
          ? {
              ...destination,
              [field]: field === 'name' ? value : Number(value) || 0,
            }
          : destination
      )
    );
  };

  const handleFieldBlur = async (id: string) => {
    const destination = destinations.find((d) => d.id === id);
    if (!destination) return;
    try {
      await updateDestination(id, {
        name: destination.name,
        latitude: destination.latitude,
        longitude: destination.longitude,
      });
    } catch {
      setError('目的地の更新に失敗しました');
    }
  };

  const handleAdd = async () => {
    const newDestination = { name: '', latitude: 0, longitude: 0 };
    try {
      const id = await createDestination(newDestination);
      setDestinations((prev) => [...prev, { id, ...newDestination }]);
    } catch {
      setError('目的地の追加に失敗しました');
    }
  };

  return (
    <section
      id="destination-section"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        🏁 目的地
      </h2>

      {error && (
        <p style={{ margin: 0, fontSize: '13px', color: 'crimson' }}>
          {error}
        </p>
      )}

      {loading ? (
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text)' }}>
          読み込み中...
        </p>
      ) : (
        <div
          id="destination-list"
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          {destinations.map((destination) => (
            <div
              key={destination.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                boxSizing: 'border-box',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '12px',
                  color: 'var(--text)',
                }}
              >
                名称
                <input
                  type="text"
                  value={destination.name}
                  onChange={(e) =>
                    handleFieldChange(destination.id, 'name', e.target.value)
                  }
                  onBlur={() => handleFieldBlur(destination.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    fontSize: '15px',
                    fontFamily: 'var(--sans)',
                    color: 'var(--text-h)',
                    background: 'transparent',
                    boxSizing: 'border-box',
                  }}
                />
              </label>

              <div style={{ display: 'flex', gap: '8px' }}>
                <label
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    fontSize: '12px',
                    color: 'var(--text)',
                  }}
                >
                  緯度
                  <input
                    type="number"
                    step="any"
                    value={destination.latitude}
                    onChange={(e) =>
                      handleFieldChange(
                        destination.id,
                        'latitude',
                        e.target.value
                      )
                    }
                    onBlur={() => handleFieldBlur(destination.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      fontSize: '15px',
                      fontFamily: 'var(--sans)',
                      color: 'var(--text-h)',
                      background: 'transparent',
                      boxSizing: 'border-box',
                      width: '100%',
                    }}
                  />
                </label>

                <label
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    fontSize: '12px',
                    color: 'var(--text)',
                  }}
                >
                  経度
                  <input
                    type="number"
                    step="any"
                    value={destination.longitude}
                    onChange={(e) =>
                      handleFieldChange(
                        destination.id,
                        'longitude',
                        e.target.value
                      )
                    }
                    onBlur={() => handleFieldBlur(destination.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      fontSize: '15px',
                      fontFamily: 'var(--sans)',
                      color: 'var(--text-h)',
                      background: 'transparent',
                      boxSizing: 'border-box',
                      width: '100%',
                    }}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleAdd}
        style={{
          alignSelf: 'flex-end',
          padding: '10px 20px',
          borderRadius: '6px',
          border: '1px solid var(--accent-border)',
          background: 'transparent',
          color: 'var(--accent)',
          fontSize: '14px',
          fontFamily: 'var(--sans)',
          cursor: 'pointer',
        }}
      >
        + 目的地を追加
      </button>
    </section>
  );
}

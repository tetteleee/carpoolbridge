import { useEffect, useImperativeHandle, useState } from 'react';
import {
  createPickupLocation,
  getPickupLocations,
  updatePickupLocation,
} from '../../services/master/pickupLocationService';
import type { PickupLocation } from '../../types/master';

type EditableField = 'name' | 'latitude' | 'longitude';

export interface PickupLocationSectionHandle {
  /** 下書き内容をまとめてFirestoreへ反映する */
  save: () => Promise<void>;
}

interface PickupLocationSectionProps {
  ref?: React.Ref<PickupLocationSectionHandle>;
}

/**
 * マスタ管理画面「集合場所」セクション。
 * 登録済み集合場所の一覧表示・下書き編集・新規追加を行う。
 * Firestoreへの反映は画面共通の保存ボタン押下時にまとめて行う。
 */
export function PickupLocationSection({ ref }: PickupLocationSectionProps) {
  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [savedLocations, setSavedLocations] = useState<PickupLocation[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPickupLocations()
      .then((data) => {
        setLocations(data);
        setSavedLocations(data);
      })
      .catch(() => setError('集合場所の取得に失敗しました'))
      .finally(() => setLoading(false));
  }, []);

  const handleFieldChange = (
    id: string,
    field: EditableField,
    value: string
  ) => {
    setLocations((prev) =>
      prev.map((location) =>
        location.id === id
          ? {
              ...location,
              [field]: field === 'name' ? value : Number(value) || 0,
            }
          : location
      )
    );
  };

  const handleAdd = () => {
    const id = crypto.randomUUID();
    setNewIds((prev) => new Set(prev).add(id));
    setLocations((prev) => [...prev, { id, name: '', latitude: 0, longitude: 0 }]);
  };

  useImperativeHandle(ref, () => ({
    save: async () => {
      try {
        for (const location of locations) {
          if (newIds.has(location.id)) {
            await createPickupLocation({
              name: location.name,
              latitude: location.latitude,
              longitude: location.longitude,
            });
            continue;
          }
          const original = savedLocations.find((l) => l.id === location.id);
          if (
            original &&
            (original.name !== location.name ||
              original.latitude !== location.latitude ||
              original.longitude !== location.longitude)
          ) {
            await updatePickupLocation(location.id, {
              name: location.name,
              latitude: location.latitude,
              longitude: location.longitude,
            });
          }
        }
        const refreshed = await getPickupLocations();
        setLocations(refreshed);
        setSavedLocations(refreshed);
        setNewIds(new Set());
        setError(null);
      } catch {
        setError('集合場所の保存に失敗しました');
        throw new Error('pickup location save failed');
      }
    },
  }));

  return (
    <section
      id="pickup-location-section"
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
        📍 集合場所
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
          id="pickup-location-list"
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          {locations.map((location) => (
            <div
              key={location.id}
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
                  value={location.name}
                  onChange={(e) =>
                    handleFieldChange(location.id, 'name', e.target.value)
                  }
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
                    value={location.latitude}
                    onChange={(e) =>
                      handleFieldChange(
                        location.id,
                        'latitude',
                        e.target.value
                      )
                    }
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
                    value={location.longitude}
                    onChange={(e) =>
                      handleFieldChange(
                        location.id,
                        'longitude',
                        e.target.value
                      )
                    }
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
        + 集合場所を追加
      </button>
    </section>
  );
}

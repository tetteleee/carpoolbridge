import { useEffect, useImperativeHandle, useState } from 'react';
import { Button } from '../common/Button';
import { FlagIcon } from '../icons';
import {
  createDestination,
  getDestinations,
  updateDestination,
} from '../../services/master/destinationService';
import type { Destination } from '../../types/master';

type EditableField = 'name' | 'latitude' | 'longitude';

export interface DestinationSectionHandle {
  /** 下書き内容をまとめてFirestoreへ反映する */
  save: () => Promise<void>;
}

interface DestinationSectionProps {
  ref?: React.Ref<DestinationSectionHandle>;
}

/**
 * マスタ管理画面「目的地」セクション。
 * 登録済み目的地の一覧表示・下書き編集・新規追加を行う。
 * Firestoreへの反映は画面共通の保存ボタン押下時にまとめて行う。
 */
export function DestinationSection({ ref }: DestinationSectionProps) {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [savedDestinations, setSavedDestinations] = useState<Destination[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDestinations()
      .then((data) => {
        setDestinations(data);
        setSavedDestinations(data);
      })
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
              [field]: field === 'name' ? value : value === '' ? null : Number(value),
            }
          : destination
      )
    );
  };

  const handleAdd = () => {
    const id = crypto.randomUUID();
    setNewIds((prev) => new Set(prev).add(id));
    setDestinations((prev) => [
      ...prev,
      { id, name: '', latitude: null, longitude: null },
    ]);
  };

  useImperativeHandle(ref, () => ({
    save: async () => {
      try {
        for (const destination of destinations) {
          if (newIds.has(destination.id)) {
            await createDestination({
              name: destination.name,
              latitude: destination.latitude,
              longitude: destination.longitude,
            });
            continue;
          }
          const original = savedDestinations.find(
            (d) => d.id === destination.id
          );
          if (
            original &&
            (original.name !== destination.name ||
              original.latitude !== destination.latitude ||
              original.longitude !== destination.longitude)
          ) {
            await updateDestination(destination.id, {
              name: destination.name,
              latitude: destination.latitude,
              longitude: destination.longitude,
            });
          }
        }
        const refreshed = await getDestinations();
        setDestinations(refreshed);
        setSavedDestinations(refreshed);
        setNewIds(new Set());
        setError(null);
      } catch {
        setError('目的地の保存に失敗しました');
        throw new Error('destination save failed');
      }
    },
  }));

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
        <FlagIcon size={18} />
        目的地
      </h2>

      {error && (
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--negative)' }}>
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
                borderRadius: '16px',
                border: '1px solid var(--border)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
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
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    fontSize: '16px',
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
                    value={destination.latitude ?? ''}
                    onChange={(e) =>
                      handleFieldChange(
                        destination.id,
                        'latitude',
                        e.target.value
                      )
                    }
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      fontSize: '16px',
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
                    value={destination.longitude ?? ''}
                    onChange={(e) =>
                      handleFieldChange(
                        destination.id,
                        'longitude',
                        e.target.value
                      )
                    }
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      fontSize: '16px',
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

      <Button
        variant="secondary"
        size="sm"
        onClick={handleAdd}
        style={{ alignSelf: 'flex-end' }}
      >
        + 目的地を追加
      </Button>
    </section>
  );
}

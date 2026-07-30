import { useEffect, useImperativeHandle, useState } from 'react';
import type { CSSProperties } from 'react';
import { AddRow } from '../common/AddRow';
import { CollapsibleListRow } from '../common/CollapsibleListRow';
import { FieldRow } from '../common/FieldRow';
import { LoadingIndicator, MapPinIcon } from '../icons';
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
  /** 保存済み内容と比べて未保存の編集・追加があるか */
  hasChanges: () => boolean;
}

interface PickupLocationSectionProps {
  ref?: React.Ref<PickupLocationSectionHandle>;
}

const fieldInputStyle: CSSProperties = {
  width: '100%',
  padding: '7px 9px',
  borderRadius: '7px',
  border: '1px solid var(--border)',
  // iOSはinput/selectのfont-sizeが16px未満だとフォーカス時に自動でズームしてしまうため16px以上にする
  fontSize: '16px',
  fontFamily: 'var(--sans)',
  color: 'var(--text-h)',
  background: 'var(--panel-bg)',
  boxSizing: 'border-box',
};

/**
 * マスタ管理画面「集合場所」セクション。
 * 登録済み集合場所の一覧表示・下書き編集・新規追加を行う。
 * 各行は折りたたみ表示とし、タップした行だけ編集欄を展開する（04_画面設計.md#10.2）。
 * Firestoreへの反映は画面共通の保存ボタン押下時にまとめて行う。
 */
export function PickupLocationSection({ ref }: PickupLocationSectionProps) {
  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [savedLocations, setSavedLocations] = useState<PickupLocation[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
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
              [field]: field === 'name' ? value : value === '' ? null : Number(value),
            }
          : location
      )
    );
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAdd = () => {
    const id = crypto.randomUUID();
    setNewIds((prev) => new Set(prev).add(id));
    setExpandedIds((prev) => new Set(prev).add(id));
    setLocations((prev) => [
      ...prev,
      { id, name: '', latitude: null, longitude: null },
    ]);
  };

  useImperativeHandle(ref, () => ({
    hasChanges: () =>
      newIds.size > 0 ||
      locations.some((location) => {
        const original = savedLocations.find((l) => l.id === location.id);
        return (
          original &&
          (original.name !== location.name ||
            original.latitude !== location.latitude ||
            original.longitude !== location.longitude)
        );
      }),
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
        gap: '12px',
        padding: '12px',
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
        <div
          id="pickup-location-list"
          style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          {locations.map((location) => (
            <CollapsibleListRow
              key={location.id}
              icon={<MapPinIcon size={15} />}
              iconBg="var(--accent-bg)"
              iconColor="var(--accent)"
              title={location.name || '（名称未設定）'}
              meta={`緯度 ${location.latitude ?? '未設定'}・経度 ${location.longitude ?? '未設定'}`}
              expanded={expandedIds.has(location.id)}
              onToggle={() => toggleExpanded(location.id)}
            >
              <FieldRow label="名称">
                <input
                  type="text"
                  value={location.name}
                  onChange={(e) =>
                    handleFieldChange(location.id, 'name', e.target.value)
                  }
                  style={fieldInputStyle}
                />
              </FieldRow>

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <FieldRow label="緯度" labelWidth={40}>
                    <input
                      type="number"
                      step="any"
                      value={location.latitude ?? ''}
                      onChange={(e) =>
                        handleFieldChange(location.id, 'latitude', e.target.value)
                      }
                      style={fieldInputStyle}
                    />
                  </FieldRow>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <FieldRow label="経度" labelWidth={40}>
                    <input
                      type="number"
                      step="any"
                      value={location.longitude ?? ''}
                      onChange={(e) =>
                        handleFieldChange(location.id, 'longitude', e.target.value)
                      }
                      style={fieldInputStyle}
                    />
                  </FieldRow>
                </div>
              </div>
            </CollapsibleListRow>
          ))}
        </div>
        <AddRow onClick={handleAdd}>+ 集合場所を追加</AddRow>
        </>
      )}
    </section>
  );
}

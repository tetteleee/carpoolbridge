import { useEffect, useImperativeHandle, useState } from 'react';
import {
  createFamily,
  getFamilies,
  updateFamily,
} from '../../services/master/familyService';
import { getPickupLocations } from '../../services/master/pickupLocationService';
import type { Family, PickupLocation } from '../../types/master';

type EditableField = 'familyName' | 'coachName' | 'vehicleCapacity';

type FamilyUpdatableFields = Partial<
  Pick<
    Family,
    'familyName' | 'coachName' | 'vehicleCapacity' | 'pickupLocationId' | 'isActive'
  >
>;

export interface FamilySectionHandle {
  /** 下書き内容をまとめてFirestoreへ反映する */
  save: () => Promise<void>;
}

interface FamilySectionProps {
  ref?: React.Ref<FamilySectionHandle>;
}

/**
 * マスタ管理画面「家庭」セクション。
 * 登録済み家庭の一覧表示・下書き編集・新規追加・在籍中トグルを行う。
 * Firestoreへの反映は画面共通の保存ボタン押下時にまとめて行う。
 * 子供の登録・編集UIはT16で実装するため対象外。
 */
export function FamilySection({ ref }: FamilySectionProps) {
  const [families, setFamilies] = useState<Family[]>([]);
  const [savedFamilies, setSavedFamilies] = useState<Family[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getFamilies(), getPickupLocations()])
      .then(([familiesData, pickupLocationsData]) => {
        setFamilies(familiesData);
        setSavedFamilies(familiesData);
        setPickupLocations(pickupLocationsData);
      })
      .catch(() => setError('家庭の取得に失敗しました'))
      .finally(() => setLoading(false));
  }, []);

  const handleFieldChange = (
    id: string,
    field: EditableField,
    value: string
  ) => {
    setFamilies((prev) =>
      prev.map((family) =>
        family.id === id
          ? {
              ...family,
              [field]:
                field === 'vehicleCapacity' ? Number(value) || 0 : value,
            }
          : family
      )
    );
  };

  const handlePickupLocationChange = (id: string, pickupLocationId: string) => {
    setFamilies((prev) =>
      prev.map((family) =>
        family.id === id ? { ...family, pickupLocationId } : family
      )
    );
  };

  const handleActiveToggle = (id: string) => {
    setFamilies((prev) =>
      prev.map((family) =>
        family.id === id ? { ...family, isActive: !family.isActive } : family
      )
    );
  };

  const handleAdd = () => {
    const id = crypto.randomUUID();
    setNewIds((prev) => new Set(prev).add(id));
    setFamilies((prev) => [
      ...prev,
      {
        id,
        familyName: '',
        coachName: null,
        vehicleCapacity: 0,
        pickupLocationId: pickupLocations[0]?.id ?? '',
        isActive: true,
      } as Family,
    ]);
  };

  useImperativeHandle(ref, () => ({
    save: async () => {
      try {
        for (const family of families) {
          const coachName = family.coachName?.trim()
            ? family.coachName.trim()
            : null;

          if (newIds.has(family.id)) {
            await createFamily({
              familyName: family.familyName,
              coachName,
              vehicleCapacity: family.vehicleCapacity,
              pickupLocationId: family.pickupLocationId,
            });
            continue;
          }

          const original = savedFamilies.find((f) => f.id === family.id);
          if (!original) continue;

          const changes: FamilyUpdatableFields = {};
          if (original.familyName !== family.familyName) {
            changes.familyName = family.familyName;
          }
          if (original.coachName !== coachName) {
            changes.coachName = coachName;
          }
          if (original.vehicleCapacity !== family.vehicleCapacity) {
            changes.vehicleCapacity = family.vehicleCapacity;
          }
          if (original.pickupLocationId !== family.pickupLocationId) {
            changes.pickupLocationId = family.pickupLocationId;
          }
          if (original.isActive !== family.isActive) {
            changes.isActive = family.isActive;
          }

          if (Object.keys(changes).length > 0) {
            await updateFamily(family.id, changes);
          }
        }
        const refreshed = await getFamilies();
        setFamilies(refreshed);
        setSavedFamilies(refreshed);
        setNewIds(new Set());
        setError(null);
      } catch {
        setError('家庭の保存に失敗しました');
        throw new Error('family save failed');
      }
    },
  }));

  return (
    <section
      id="family-section"
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
        🏠 家庭
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
          id="family-list"
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          {families.map((family) => (
            <div
              key={family.id}
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
                家庭名
                <input
                  type="text"
                  value={family.familyName}
                  onChange={(e) =>
                    handleFieldChange(family.id, 'familyName', e.target.value)
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

              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '12px',
                  color: 'var(--text)',
                }}
              >
                コーチ名
                <input
                  type="text"
                  value={family.coachName ?? ''}
                  onChange={(e) =>
                    handleFieldChange(family.id, 'coachName', e.target.value)
                  }
                  placeholder="コーチなしの場合は空欄"
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

              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '12px',
                  color: 'var(--text)',
                }}
              >
                通常定員
                <input
                  type="number"
                  min={0}
                  value={family.vehicleCapacity}
                  onChange={(e) =>
                    handleFieldChange(
                      family.id,
                      'vehicleCapacity',
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
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '12px',
                  color: 'var(--text)',
                }}
              >
                基本集合場所
                <select
                  value={family.pickupLocationId}
                  onChange={(e) =>
                    handlePickupLocationChange(family.id, e.target.value)
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
                >
                  <option value="" disabled>
                    選択してください
                  </option>
                  {pickupLocations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </label>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '4px',
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--text)' }}>
                  在籍中
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={family.isActive}
                  onClick={() => handleActiveToggle(family.id)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '999px',
                    border: family.isActive
                      ? '1px solid var(--accent-border)'
                      : '1px solid var(--border)',
                    background: family.isActive
                      ? 'var(--accent-bg)'
                      : 'transparent',
                    color: family.isActive ? 'var(--accent)' : 'var(--text)',
                    fontSize: '13px',
                    fontFamily: 'var(--sans)',
                    cursor: 'pointer',
                  }}
                >
                  {family.isActive ? 'ON' : 'OFF'}
                </button>
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
        + 家庭を追加
      </button>
    </section>
  );
}

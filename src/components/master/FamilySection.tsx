import { useEffect, useState } from 'react';
import {
  createFamily,
  getFamilies,
  updateFamily,
} from '../../services/master/familyService';
import { getPickupLocations } from '../../services/master/pickupLocationService';
import type { Family, PickupLocation } from '../../types/master';

type EditableField = 'familyName' | 'coachName' | 'vehicleCapacity';

/**
 * マスタ管理画面「家庭」セクション。
 * 登録済み家庭の一覧表示・その場編集・新規追加・在籍中トグルを行う。
 * 子供の登録・編集UIはT16で実装するため対象外。
 */
export function FamilySection() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getFamilies(), getPickupLocations()])
      .then(([familiesData, pickupLocationsData]) => {
        setFamilies(familiesData);
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

  const handleFieldBlur = async (id: string) => {
    const family = families.find((f) => f.id === id);
    if (!family) return;
    try {
      await updateFamily(id, {
        familyName: family.familyName,
        coachName: family.coachName?.trim() ? family.coachName.trim() : null,
        vehicleCapacity: family.vehicleCapacity,
      });
    } catch {
      setError('家庭の更新に失敗しました');
    }
  };

  const handlePickupLocationChange = async (
    id: string,
    pickupLocationId: string
  ) => {
    setFamilies((prev) =>
      prev.map((family) =>
        family.id === id ? { ...family, pickupLocationId } : family
      )
    );
    try {
      await updateFamily(id, { pickupLocationId });
    } catch {
      setError('家庭の更新に失敗しました');
    }
  };

  const handleActiveToggle = async (id: string) => {
    const family = families.find((f) => f.id === id);
    if (!family) return;
    const isActive = !family.isActive;
    setFamilies((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isActive } : f))
    );
    try {
      await updateFamily(id, { isActive });
    } catch {
      setError('家庭の更新に失敗しました');
    }
  };

  const handleAdd = async () => {
    const newFamily = {
      familyName: '',
      coachName: null as string | null,
      vehicleCapacity: 0,
      pickupLocationId: pickupLocations[0]?.id ?? '',
    };
    try {
      const id = await createFamily(newFamily);
      setFamilies((prev) => [
        ...prev,
        { id, ...newFamily, isActive: true } as Family,
      ]);
    } catch {
      setError('家庭の追加に失敗しました');
    }
  };

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
                  onBlur={() => handleFieldBlur(family.id)}
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
                  onBlur={() => handleFieldBlur(family.id)}
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
                  onBlur={() => handleFieldBlur(family.id)}
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

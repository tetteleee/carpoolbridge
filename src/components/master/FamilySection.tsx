import { useEffect, useImperativeHandle, useState } from 'react';
import {
  createFamily,
  getFamilies,
  updateFamily,
} from '../../services/master/familyService';
import {
  createChild,
  getChildrenByFamilyId,
  updateChild,
} from '../../services/master/childService';
import { getPickupLocations } from '../../services/master/pickupLocationService';
import type { Child, Family, PickupLocation } from '../../types/master';
import { ChildSection } from './ChildSection';
import { Button } from '../common/Button';
import { getSchoolEntryYearOptions } from '../../utils/schoolGrade';
import { HomeIcon } from '../icons';

type EditableField = 'familyName' | 'coachName' | 'vehicleCapacity';

type FamilyUpdatableFields = Partial<
  Pick<
    Family,
    'familyName' | 'coachName' | 'vehicleCapacity' | 'pickupLocationId' | 'isActive'
  >
>;

type ChildUpdatableFields = Partial<
  Pick<Child, 'name' | 'schoolEntryYear' | 'isActive'>
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
 * 家庭カード内には子供セクション（ChildSection）を組み込み、
 * 子供の一覧表示・下書き編集・新規追加・在籍中トグルも行う。
 * Firestoreへの反映は画面共通の保存ボタン押下時にまとめて行う。
 */
export function FamilySection({ ref }: FamilySectionProps) {
  const [families, setFamilies] = useState<Family[]>([]);
  const [savedFamilies, setSavedFamilies] = useState<Family[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [children, setChildren] = useState<Child[]>([]);
  const [savedChildren, setSavedChildren] = useState<Child[]>([]);
  const [newChildIds, setNewChildIds] = useState<Set<string>>(new Set());
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getFamilies(), getPickupLocations()])
      .then(async ([familiesData, pickupLocationsData]) => {
        setFamilies(familiesData);
        setSavedFamilies(familiesData);
        setPickupLocations(pickupLocationsData);

        const childrenByFamily = await Promise.all(
          familiesData.map((family) => getChildrenByFamilyId(family.id))
        );
        const childrenData = childrenByFamily.flat();
        setChildren(childrenData);
        setSavedChildren(childrenData);
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

  const handleChildNameChange = (childId: string, name: string) => {
    setChildren((prev) =>
      prev.map((child) => (child.id === childId ? { ...child, name } : child))
    );
  };

  const handleChildSchoolEntryYearChange = (
    childId: string,
    schoolEntryYear: number
  ) => {
    setChildren((prev) =>
      prev.map((child) =>
        child.id === childId ? { ...child, schoolEntryYear } : child
      )
    );
  };

  const handleChildActiveToggle = (childId: string) => {
    setChildren((prev) =>
      prev.map((child) =>
        child.id === childId ? { ...child, isActive: !child.isActive } : child
      )
    );
  };

  const handleChildAdd = (familyId: string) => {
    const id = crypto.randomUUID();
    setNewChildIds((prev) => new Set(prev).add(id));
    setChildren((prev) => [
      ...prev,
      {
        id,
        familyId,
        name: '',
        schoolEntryYear: getSchoolEntryYearOptions()[0],
        isActive: true,
      } as Child,
    ]);
  };

  useImperativeHandle(ref, () => ({
    save: async () => {
      try {
        for (const family of families) {
          const coachName = family.coachName?.trim()
            ? family.coachName.trim()
            : null;

          let familyId = family.id;

          if (newIds.has(family.id)) {
            familyId = await createFamily({
              familyName: family.familyName,
              coachName,
              vehicleCapacity: family.vehicleCapacity,
              pickupLocationId: family.pickupLocationId,
            });
          } else {
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

          const familyChildren = children.filter(
            (child) => child.familyId === family.id
          );

          for (const child of familyChildren) {
            if (newChildIds.has(child.id)) {
              await createChild({
                familyId,
                name: child.name,
                schoolEntryYear: child.schoolEntryYear,
              });
              continue;
            }

            const originalChild = savedChildren.find((c) => c.id === child.id);
            if (!originalChild) continue;

            const childChanges: ChildUpdatableFields = {};
            if (originalChild.name !== child.name) {
              childChanges.name = child.name;
            }
            if (originalChild.schoolEntryYear !== child.schoolEntryYear) {
              childChanges.schoolEntryYear = child.schoolEntryYear;
            }
            if (originalChild.isActive !== child.isActive) {
              childChanges.isActive = child.isActive;
            }

            if (Object.keys(childChanges).length > 0) {
              await updateChild(child.id, childChanges);
            }
          }
        }

        const refreshedFamilies = await getFamilies();
        setFamilies(refreshedFamilies);
        setSavedFamilies(refreshedFamilies);
        setNewIds(new Set());

        const refreshedChildrenByFamily = await Promise.all(
          refreshedFamilies.map((family) => getChildrenByFamilyId(family.id))
        );
        const refreshedChildren = refreshedChildrenByFamily.flat();
        setChildren(refreshedChildren);
        setSavedChildren(refreshedChildren);
        setNewChildIds(new Set());

        setError(null);
      } catch {
        setError('家庭・子供の保存に失敗しました');
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
        <HomeIcon size={18} />
        家庭
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
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  fontSize: '12px',
                  color: 'var(--text)',
                }}
              >
                集合場所
                <select
                  value={family.pickupLocationId}
                  onChange={(e) =>
                    handlePickupLocationChange(family.id, e.target.value)
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

              <ChildSection
                childList={children.filter(
                  (child) => child.familyId === family.id
                )}
                onNameChange={handleChildNameChange}
                onSchoolEntryYearChange={handleChildSchoolEntryYearChange}
                onActiveToggle={handleChildActiveToggle}
                onAdd={() => handleChildAdd(family.id)}
              />
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
        + 家庭を追加
      </Button>
    </section>
  );
}

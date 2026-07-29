import { useEffect, useImperativeHandle, useState } from 'react';
import {
  createFamily,
  getFamilies,
  updateFamily,
} from '../../services/master/familyService';
import {
  createPlayer,
  getPlayersByFamilyId,
  updatePlayer,
} from '../../services/master/playerService';
import { getPickupLocations } from '../../services/master/pickupLocationService';
import type { Player, Family, PickupLocation } from '../../types/master';
import { PlayerSection } from './PlayerSection';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { getSchoolEntryYearOptions } from '../../utils/schoolGrade';
import { LoadingIndicator } from '../icons';

type EditableField = 'familyName' | 'coachName' | 'vehicleCapacity';

type FamilyUpdatableFields = Partial<
  Pick<
    Family,
    'familyName' | 'coachName' | 'vehicleCapacity' | 'pickupLocationId' | 'isActive'
  >
>;

type PlayerUpdatableFields = Partial<
  Pick<Player, 'name' | 'schoolEntryYear' | 'isActive'>
>;

export interface FamilySectionHandle {
  /** 下書き内容をまとめてFirestoreへ反映する */
  save: () => Promise<void>;
  /** 保存済み内容と比べて未保存の編集・追加があるか（家庭・選手いずれか） */
  hasChanges: () => boolean;
}

interface FamilySectionProps {
  ref?: React.Ref<FamilySectionHandle>;
}

/**
 * マスタ管理画面「家庭」セクション。
 * 登録済み家庭の一覧表示・下書き編集・新規追加・在籍中トグルを行う。
 * 家庭カード内には選手セクション（PlayerSection）を組み込み、
 * 選手の一覧表示・下書き編集・新規追加・在籍中トグルも行う。
 * Firestoreへの反映は画面共通の保存ボタン押下時にまとめて行う。
 */
export function FamilySection({ ref }: FamilySectionProps) {
  const [families, setFamilies] = useState<Family[]>([]);
  const [savedFamilies, setSavedFamilies] = useState<Family[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [players, setPlayers] = useState<Player[]>([]);
  const [savedPlayers, setSavedPlayers] = useState<Player[]>([]);
  const [newPlayerIds, setNewPlayerIds] = useState<Set<string>>(new Set());
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getFamilies(), getPickupLocations()])
      .then(async ([familiesData, pickupLocationsData]) => {
        setFamilies(familiesData);
        setSavedFamilies(familiesData);
        setPickupLocations(pickupLocationsData);

        const playersByFamily = await Promise.all(
          familiesData.map((family) => getPlayersByFamilyId(family.id))
        );
        const playersData = playersByFamily.flat();
        setPlayers(playersData);
        setSavedPlayers(playersData);
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

  const handlePlayerNameChange = (playerId: string, name: string) => {
    setPlayers((prev) =>
      prev.map((player) => (player.id === playerId ? { ...player, name } : player))
    );
  };

  const handlePlayerSchoolEntryYearChange = (
    playerId: string,
    schoolEntryYear: number
  ) => {
    setPlayers((prev) =>
      prev.map((player) =>
        player.id === playerId ? { ...player, schoolEntryYear } : player
      )
    );
  };

  const handlePlayerActiveToggle = (playerId: string) => {
    setPlayers((prev) =>
      prev.map((player) =>
        player.id === playerId ? { ...player, isActive: !player.isActive } : player
      )
    );
  };

  const handlePlayerAdd = (familyId: string) => {
    const id = crypto.randomUUID();
    setNewPlayerIds((prev) => new Set(prev).add(id));
    setPlayers((prev) => [
      ...prev,
      {
        id,
        familyId,
        name: '',
        schoolEntryYear: getSchoolEntryYearOptions()[0],
        isActive: true,
      } as Player,
    ]);
  };

  useImperativeHandle(ref, () => ({
    hasChanges: () =>
      newIds.size > 0 ||
      newPlayerIds.size > 0 ||
      families.some((family) => {
        const original = savedFamilies.find((f) => f.id === family.id);
        return (
          original &&
          (original.familyName !== family.familyName ||
            original.coachName !== family.coachName ||
            original.vehicleCapacity !== family.vehicleCapacity ||
            original.pickupLocationId !== family.pickupLocationId ||
            original.isActive !== family.isActive)
        );
      }) ||
      players.some((player) => {
        const original = savedPlayers.find((c) => c.id === player.id);
        return (
          original &&
          (original.name !== player.name ||
            original.schoolEntryYear !== player.schoolEntryYear ||
            original.isActive !== player.isActive)
        );
      }),
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

          const familyPlayers = players.filter(
            (player) => player.familyId === family.id
          );

          for (const player of familyPlayers) {
            if (newPlayerIds.has(player.id)) {
              await createPlayer({
                familyId,
                name: player.name,
                schoolEntryYear: player.schoolEntryYear,
              });
              continue;
            }

            const originalPlayer = savedPlayers.find((c) => c.id === player.id);
            if (!originalPlayer) continue;

            const playerChanges: PlayerUpdatableFields = {};
            if (originalPlayer.name !== player.name) {
              playerChanges.name = player.name;
            }
            if (originalPlayer.schoolEntryYear !== player.schoolEntryYear) {
              playerChanges.schoolEntryYear = player.schoolEntryYear;
            }
            if (originalPlayer.isActive !== player.isActive) {
              playerChanges.isActive = player.isActive;
            }

            if (Object.keys(playerChanges).length > 0) {
              await updatePlayer(player.id, playerChanges);
            }
          }
        }

        const refreshedFamilies = await getFamilies();
        setFamilies(refreshedFamilies);
        setSavedFamilies(refreshedFamilies);
        setNewIds(new Set());

        const refreshedPlayersByFamily = await Promise.all(
          refreshedFamilies.map((family) => getPlayersByFamilyId(family.id))
        );
        const refreshedPlayers = refreshedPlayersByFamily.flat();
        setPlayers(refreshedPlayers);
        setSavedPlayers(refreshedPlayers);
        setNewPlayerIds(new Set());

        setError(null);
      } catch {
        setError('家庭・選手の保存に失敗しました');
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
        <div
          id="family-list"
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
          {families.map((family) => (
            <Card
              key={family.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '12px',
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

              <PlayerSection
                playerList={players.filter(
                  (player) => player.familyId === family.id
                )}
                onNameChange={handlePlayerNameChange}
                onSchoolEntryYearChange={handlePlayerSchoolEntryYearChange}
                onActiveToggle={handlePlayerActiveToggle}
                onAdd={() => handlePlayerAdd(family.id)}
              />
            </Card>
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

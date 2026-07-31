import { useEffect, useImperativeHandle, useState } from 'react';
import type { CSSProperties } from 'react';
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
import {
  createFamilyMember,
  getFamilyMembersByFamilyId,
  updateFamilyMember,
} from '../../services/master/familyMemberService';
import { getPickupLocations } from '../../services/master/pickupLocationService';
import type { Player, Family, FamilyMember, PickupLocation } from '../../types/master';
import { PlayerSection } from './PlayerSection';
import { FamilyMemberSection } from './FamilyMemberSection';
import { AddRow } from '../common/AddRow';
import { CollapsibleListRow } from '../common/CollapsibleListRow';
import { FieldRow } from '../common/FieldRow';
import { RoleBox } from '../common/RoleBox';
import { Stepper } from '../common/Stepper';
import { Switch } from '../common/Switch';
import { getFamilyHighestGrade, getSchoolEntryYearOptions } from '../../utils/schoolGrade';
import { HomeIcon, LoadingIndicator, UserIcon } from '../icons';

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

type FamilyMemberUpdatableFields = Partial<Pick<FamilyMember, 'name' | 'isActive'>>;

export interface FamilySectionHandle {
  /** 下書き内容をまとめてFirestoreへ反映する */
  save: () => Promise<void>;
  /** 保存済み内容と比べて未保存の編集・追加があるか（家庭・選手いずれか） */
  hasChanges: () => boolean;
}

interface FamilySectionProps {
  ref?: React.Ref<FamilySectionHandle>;
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

const statusLabelStyle: CSSProperties = {
  fontSize: '12px',
  color: 'var(--text)',
  fontWeight: 600,
};

const coachTagStyle: CSSProperties = {
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '3px',
  fontSize: '10px',
  fontWeight: 800,
  color: '#fff',
  background: 'var(--coach-accent)',
  padding: '2px 6px',
  borderRadius: '5px',
};

const sectionLabelStyle: CSSProperties = {
  fontSize: '11px',
  fontWeight: 800,
  color: 'var(--text)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

/**
 * 家庭カードの並び順（04_画面設計.md#10.4）：
 * 1. 在籍中の家庭を先、休会中の家庭を後にする
 * 2. 家庭内の選手の最高学年を基準に降順（対象学年の選手がいない家庭は末尾）
 * 3. 上記が同じ場合は家庭名順（文字列比較）
 * 画面表示・保存後の再表示のタイミングでのみ並べ替える（編集中は並べ替えない）。
 */
function sortFamilies(familyList: Family[], playerList: Player[]): Family[] {
  return [...familyList].sort((a, b) => {
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1;
    }

    const gradeA = getFamilyHighestGrade(
      playerList.filter((player) => player.familyId === a.id)
    );
    const gradeB = getFamilyHighestGrade(
      playerList.filter((player) => player.familyId === b.id)
    );
    if (gradeA !== gradeB) {
      if (gradeA === null) return 1;
      if (gradeB === null) return -1;
      return gradeB - gradeA;
    }

    return a.familyName.localeCompare(b.familyName, 'ja');
  });
}

/**
 * マスタ管理画面「家庭」セクション。
 * 登録済み家庭の一覧表示・下書き編集・新規追加・在籍中トグルを行う。
 * 各家庭は折りたたみ表示とし、タップした家庭だけ詳細編集欄を展開する（04_画面設計.md#10.4）。
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
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [savedFamilyMembers, setSavedFamilyMembers] = useState<FamilyMember[]>([]);
  const [newFamilyMemberIds, setNewFamilyMemberIds] = useState<Set<string>>(new Set());
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getFamilies(), getPickupLocations()])
      .then(async ([familiesData, pickupLocationsData]) => {
        setPickupLocations(pickupLocationsData);

        const [playersByFamily, familyMembersByFamily] = await Promise.all([
          Promise.all(familiesData.map((family) => getPlayersByFamilyId(family.id))),
          Promise.all(familiesData.map((family) => getFamilyMembersByFamilyId(family.id))),
        ]);
        const playersData = playersByFamily.flat();
        setPlayers(playersData);
        setSavedPlayers(playersData);

        const familyMembersData = familyMembersByFamily.flat();
        setFamilyMembers(familyMembersData);
        setSavedFamilyMembers(familyMembersData);

        const sortedFamilies = sortFamilies(familiesData, playersData);
        setFamilies(sortedFamilies);
        setSavedFamilies(sortedFamilies);
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

  const handleFamilyMemberNameChange = (familyMemberId: string, name: string) => {
    setFamilyMembers((prev) =>
      prev.map((familyMember) =>
        familyMember.id === familyMemberId ? { ...familyMember, name } : familyMember
      )
    );
  };

  const handleFamilyMemberActiveToggle = (familyMemberId: string) => {
    setFamilyMembers((prev) =>
      prev.map((familyMember) =>
        familyMember.id === familyMemberId
          ? { ...familyMember, isActive: !familyMember.isActive }
          : familyMember
      )
    );
  };

  const handleFamilyMemberAdd = (familyId: string) => {
    const id = crypto.randomUUID();
    setNewFamilyMemberIds((prev) => new Set(prev).add(id));
    setFamilyMembers((prev) => [
      ...prev,
      {
        id,
        familyId,
        name: '',
        isActive: true,
      } as FamilyMember,
    ]);
  };

  useImperativeHandle(ref, () => ({
    hasChanges: () =>
      newIds.size > 0 ||
      newPlayerIds.size > 0 ||
      newFamilyMemberIds.size > 0 ||
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
      }) ||
      familyMembers.some((familyMember) => {
        const original = savedFamilyMembers.find((f) => f.id === familyMember.id);
        return (
          original &&
          (original.name !== familyMember.name || original.isActive !== familyMember.isActive)
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

          const familyMemberList = familyMembers.filter(
            (familyMember) => familyMember.familyId === family.id
          );

          for (const familyMember of familyMemberList) {
            if (newFamilyMemberIds.has(familyMember.id)) {
              await createFamilyMember({
                familyId,
                name: familyMember.name,
              });
              continue;
            }

            const originalFamilyMember = savedFamilyMembers.find((f) => f.id === familyMember.id);
            if (!originalFamilyMember) continue;

            const familyMemberChanges: FamilyMemberUpdatableFields = {};
            if (originalFamilyMember.name !== familyMember.name) {
              familyMemberChanges.name = familyMember.name;
            }
            if (originalFamilyMember.isActive !== familyMember.isActive) {
              familyMemberChanges.isActive = familyMember.isActive;
            }

            if (Object.keys(familyMemberChanges).length > 0) {
              await updateFamilyMember(familyMember.id, familyMemberChanges);
            }
          }
        }

        const refreshedFamilies = await getFamilies();
        setNewIds(new Set());

        const [refreshedPlayersByFamily, refreshedFamilyMembersByFamily] = await Promise.all([
          Promise.all(refreshedFamilies.map((family) => getPlayersByFamilyId(family.id))),
          Promise.all(refreshedFamilies.map((family) => getFamilyMembersByFamilyId(family.id))),
        ]);
        const refreshedPlayers = refreshedPlayersByFamily.flat();
        setPlayers(refreshedPlayers);
        setSavedPlayers(refreshedPlayers);
        setNewPlayerIds(new Set());

        const refreshedFamilyMembers = refreshedFamilyMembersByFamily.flat();
        setFamilyMembers(refreshedFamilyMembers);
        setSavedFamilyMembers(refreshedFamilyMembers);
        setNewFamilyMemberIds(new Set());

        const sortedFamilies = sortFamilies(refreshedFamilies, refreshedPlayers);
        setFamilies(sortedFamilies);
        setSavedFamilies(sortedFamilies);

        setError(null);
      } catch {
        setError('家庭・選手・家族の保存に失敗しました');
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
        gap: '8px',
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
          id="family-list"
          style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          {families.map((family) => {
            const familyPlayers = players.filter(
              (player) => player.familyId === family.id
            );
            const familyMemberList = familyMembers.filter(
              (familyMember) => familyMember.familyId === family.id
            );
            const pickupName =
              pickupLocations.find((location) => location.id === family.pickupLocationId)
                ?.name ?? '未設定';
            const dimStyle: CSSProperties = {
              opacity: family.isActive ? 1 : 'var(--disabled-opacity)',
            };

            return (
              <CollapsibleListRow
                key={family.id}
                icon={<HomeIcon size={15} />}
                iconBg="var(--border)"
                iconColor="var(--text-h)"
                title={<span style={dimStyle}>{family.familyName || '（家庭名未設定）'}</span>}
                meta={
                  <span style={dimStyle}>
                    選手{familyPlayers.length}名
                    {familyMemberList.length > 0 ? `・家族${familyMemberList.length}名` : ''}
                    {family.coachName ? '・コーチあり' : ''}・{pickupName}
                  </span>
                }
                expanded={expandedIds.has(family.id)}
                onToggle={() => toggleExpanded(family.id)}
                trailing={
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: '10.5px',
                      fontWeight: 800,
                      padding: '3px 9px',
                      borderRadius: '999px',
                      whiteSpace: 'nowrap',
                      background: family.isActive ? 'var(--positive-bg)' : 'var(--border)',
                      color: family.isActive ? 'var(--positive)' : 'var(--text)',
                    }}
                  >
                    在籍中
                  </span>
                }
              >
                <FieldRow label="家庭名">
                  <input
                    type="text"
                    value={family.familyName}
                    onChange={(e) =>
                      handleFieldChange(family.id, 'familyName', e.target.value)
                    }
                    style={fieldInputStyle}
                  />
                </FieldRow>

                <FieldRow label="集合場所" labelWidth={68}>
                  <select
                    value={family.pickupLocationId}
                    onChange={(e) =>
                      handlePickupLocationChange(family.id, e.target.value)
                    }
                    style={fieldInputStyle}
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
                </FieldRow>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={statusLabelStyle}>通常定員</span>
                  <Stepper
                    value={family.vehicleCapacity}
                    onChange={(next) =>
                      handleFieldChange(family.id, 'vehicleCapacity', String(next))
                    }
                    decrementLabel="通常定員を減らす"
                    incrementLabel="通常定員を増やす"
                    unit="人"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={statusLabelStyle}>在籍中（家庭）</span>
                  <Switch
                    checked={family.isActive}
                    onChange={() => handleActiveToggle(family.id)}
                    ariaLabel={`${family.familyName || '家庭'}の在籍状態`}
                  />
                </div>

                <RoleBox role="coach">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={coachTagStyle}>
                      <UserIcon size={11} />
                      コーチ
                    </span>
                    <input
                      type="text"
                      value={family.coachName ?? ''}
                      onChange={(e) =>
                        handleFieldChange(family.id, 'coachName', e.target.value)
                      }
                      placeholder="コーチなしの場合は空欄"
                      style={{ ...fieldInputStyle, background: 'var(--bg)', fontWeight: 700 }}
                    />
                  </div>
                </RoleBox>

                <div style={sectionLabelStyle}>選手 {familyPlayers.length}名</div>

                <PlayerSection
                  playerList={familyPlayers}
                  onNameChange={handlePlayerNameChange}
                  onSchoolEntryYearChange={handlePlayerSchoolEntryYearChange}
                  onActiveToggle={handlePlayerActiveToggle}
                  onAdd={() => handlePlayerAdd(family.id)}
                />

                <div style={sectionLabelStyle}>家族 {familyMemberList.length}名</div>

                <FamilyMemberSection
                  familyMemberList={familyMemberList}
                  onNameChange={handleFamilyMemberNameChange}
                  onActiveToggle={handleFamilyMemberActiveToggle}
                  onAdd={() => handleFamilyMemberAdd(family.id)}
                />
              </CollapsibleListRow>
            );
          })}
        </div>
        <AddRow onClick={handleAdd}>+ 家庭を追加</AddRow>
        </>
      )}
    </section>
  );
}

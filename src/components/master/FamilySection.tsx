import { useEffect, useImperativeHandle, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  createFamily,
  deleteFamily,
  getFamilies,
  updateFamily,
} from '../../services/master/familyService';
import {
  createPlayer,
  deletePlayer,
  getPlayersByFamilyId,
  updatePlayer,
} from '../../services/master/playerService';
import {
  createCoach,
  deleteCoach,
  getCoachesByFamilyId,
  updateCoach,
} from '../../services/master/coachService';
import {
  createFamilyMember,
  deleteFamilyMember,
  getFamilyMembersByFamilyId,
  updateFamilyMember,
} from '../../services/master/familyMemberService';
import { getPickupLocations } from '../../services/master/pickupLocationService';
import type { Player, Coach, Family, FamilyMember, PickupLocation } from '../../types/master';
import { PlayerSection } from './PlayerSection';
import { CoachSection } from './CoachSection';
import { FamilyMemberSection } from './FamilyMemberSection';
import { MasterDeleteDialog } from './MasterDeleteDialog';
import { AddRow } from '../common/AddRow';
import { Button } from '../common/Button';
import { CollapsibleListRow } from '../common/CollapsibleListRow';
import { FieldRow } from '../common/FieldRow';
import { Stepper } from '../common/Stepper';
import { Switch } from '../common/Switch';
import { getFamilyHighestGrade, getSchoolEntryYearOptions } from '../../utils/schoolGrade';
import { HomeIcon, LoadingIndicator, WarningIcon } from '../icons';

/** 削除確認ダイアログの対象 */
interface DeleteTarget {
  type: 'family' | 'player' | 'coach' | 'familyMember';
  id: string;
  name: string;
}

type EditableField = 'familyName' | 'vehicleCapacity';

type FamilyUpdatableFields = Partial<
  Pick<Family, 'familyName' | 'vehicleCapacity' | 'pickupLocationId' | 'isActive'>
>;

type PlayerUpdatableFields = Partial<
  Pick<Player, 'name' | 'schoolEntryYear' | 'isActive'>
>;

type CoachUpdatableFields = Partial<Pick<Coach, 'name' | 'isActive'>>;

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
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [savedCoaches, setSavedCoaches] = useState<Coach[]>([]);
  const [newCoachIds, setNewCoachIds] = useState<Set<string>>(new Set());
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [savedFamilyMembers, setSavedFamilyMembers] = useState<FamilyMember[]>([]);
  const [newFamilyMemberIds, setNewFamilyMemberIds] = useState<Set<string>>(new Set());
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([getFamilies(), getPickupLocations()])
      .then(async ([familiesData, pickupLocationsData]) => {
        setPickupLocations(pickupLocationsData);

        const [playersByFamily, coachesByFamily, familyMembersByFamily] = await Promise.all([
          Promise.all(familiesData.map((family) => getPlayersByFamilyId(family.id))),
          Promise.all(familiesData.map((family) => getCoachesByFamilyId(family.id))),
          Promise.all(familiesData.map((family) => getFamilyMembersByFamilyId(family.id))),
        ]);
        const playersData = playersByFamily.flat();
        setPlayers(playersData);
        setSavedPlayers(playersData);

        const coachesData = coachesByFamily.flat();
        setCoaches(coachesData);
        setSavedCoaches(coachesData);

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

  const handleCoachNameChange = (coachId: string, name: string) => {
    setCoaches((prev) =>
      prev.map((coach) => (coach.id === coachId ? { ...coach, name } : coach))
    );
  };

  const handleCoachActiveToggle = (coachId: string) => {
    setCoaches((prev) =>
      prev.map((coach) =>
        coach.id === coachId ? { ...coach, isActive: !coach.isActive } : coach
      )
    );
  };

  const handleCoachAdd = (familyId: string) => {
    const id = crypto.randomUUID();
    setNewCoachIds((prev) => new Set(prev).add(id));
    setCoaches((prev) => [
      ...prev,
      {
        id,
        familyId,
        name: '',
        isActive: true,
      } as Coach,
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

  const openFamilyDelete = (family: Family) => {
    setDeleteTarget({ type: 'family', id: family.id, name: family.familyName || '（家庭名未設定）' });
  };

  const openPlayerDelete = (playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    setDeleteTarget({ type: 'player', id: playerId, name: player?.name || '（名前未設定）' });
  };

  const openCoachDelete = (coachId: string) => {
    const coach = coaches.find((c) => c.id === coachId);
    setDeleteTarget({ type: 'coach', id: coachId, name: coach?.name || '（名前未設定）' });
  };

  const openFamilyMemberDelete = (familyMemberId: string) => {
    const familyMember = familyMembers.find((f) => f.id === familyMemberId);
    setDeleteTarget({
      type: 'familyMember',
      id: familyMemberId,
      name: familyMember?.name || '（名前未設定）',
    });
  };

  const closeDeleteDialog = () => setDeleteTarget(null);

  const removeIdFromSet = (set: Set<string>, id: string): Set<string> => {
    const next = new Set(set);
    next.delete(id);
    return next;
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) {
      return;
    }
    const { type, id } = deleteTarget;

    if (type === 'player') {
      if (newPlayerIds.has(id)) {
        setPlayers((prev) => prev.filter((player) => player.id !== id));
        setNewPlayerIds((prev) => removeIdFromSet(prev, id));
        setDeleteTarget(null);
        return;
      }
      setDeleting(true);
      try {
        await deletePlayer(id);
        setPlayers((prev) => prev.filter((player) => player.id !== id));
        setSavedPlayers((prev) => prev.filter((player) => player.id !== id));
        setError(null);
        setDeleteTarget(null);
      } catch {
        setError('選手の削除に失敗しました');
      } finally {
        setDeleting(false);
      }
      return;
    }

    if (type === 'coach') {
      if (newCoachIds.has(id)) {
        setCoaches((prev) => prev.filter((coach) => coach.id !== id));
        setNewCoachIds((prev) => removeIdFromSet(prev, id));
        setDeleteTarget(null);
        return;
      }
      setDeleting(true);
      try {
        await deleteCoach(id);
        setCoaches((prev) => prev.filter((coach) => coach.id !== id));
        setSavedCoaches((prev) => prev.filter((coach) => coach.id !== id));
        setError(null);
        setDeleteTarget(null);
      } catch {
        setError('コーチの削除に失敗しました');
      } finally {
        setDeleting(false);
      }
      return;
    }

    if (type === 'familyMember') {
      if (newFamilyMemberIds.has(id)) {
        setFamilyMembers((prev) => prev.filter((familyMember) => familyMember.id !== id));
        setNewFamilyMemberIds((prev) => removeIdFromSet(prev, id));
        setDeleteTarget(null);
        return;
      }
      setDeleting(true);
      try {
        await deleteFamilyMember(id);
        setFamilyMembers((prev) => prev.filter((familyMember) => familyMember.id !== id));
        setSavedFamilyMembers((prev) => prev.filter((familyMember) => familyMember.id !== id));
        setError(null);
        setDeleteTarget(null);
      } catch {
        setError('家族の削除に失敗しました');
      } finally {
        setDeleting(false);
      }
      return;
    }

    // 家庭の削除（所属する選手・コーチ・家族も道連れで削除する）
    if (newIds.has(id)) {
      const removedPlayerIds = players.filter((player) => player.familyId === id).map((p) => p.id);
      const removedCoachIds = coaches.filter((coach) => coach.familyId === id).map((c) => c.id);
      const removedFamilyMemberIds = familyMembers
        .filter((familyMember) => familyMember.familyId === id)
        .map((f) => f.id);

      setPlayers((prev) => prev.filter((player) => player.familyId !== id));
      setCoaches((prev) => prev.filter((coach) => coach.familyId !== id));
      setFamilyMembers((prev) => prev.filter((familyMember) => familyMember.familyId !== id));
      setNewPlayerIds((prev) => {
        let next = prev;
        removedPlayerIds.forEach((playerId) => {
          next = removeIdFromSet(next, playerId);
        });
        return next;
      });
      setNewCoachIds((prev) => {
        let next = prev;
        removedCoachIds.forEach((coachId) => {
          next = removeIdFromSet(next, coachId);
        });
        return next;
      });
      setNewFamilyMemberIds((prev) => {
        let next = prev;
        removedFamilyMemberIds.forEach((familyMemberId) => {
          next = removeIdFromSet(next, familyMemberId);
        });
        return next;
      });
      setFamilies((prev) => prev.filter((family) => family.id !== id));
      setNewIds((prev) => removeIdFromSet(prev, id));
      setDeleteTarget(null);
      return;
    }

    setDeleting(true);
    try {
      await deleteFamily(id);
      setFamilies((prev) => prev.filter((family) => family.id !== id));
      setSavedFamilies((prev) => prev.filter((family) => family.id !== id));
      setPlayers((prev) => prev.filter((player) => player.familyId !== id));
      setSavedPlayers((prev) => prev.filter((player) => player.familyId !== id));
      setCoaches((prev) => prev.filter((coach) => coach.familyId !== id));
      setSavedCoaches((prev) => prev.filter((coach) => coach.familyId !== id));
      setFamilyMembers((prev) => prev.filter((familyMember) => familyMember.familyId !== id));
      setSavedFamilyMembers((prev) => prev.filter((familyMember) => familyMember.familyId !== id));
      setExpandedIds((prev) => removeIdFromSet(prev, id));
      setError(null);
      setDeleteTarget(null);
    } catch {
      setError('家庭の削除に失敗しました');
    } finally {
      setDeleting(false);
    }
  };

  useImperativeHandle(ref, () => ({
    hasChanges: () =>
      newIds.size > 0 ||
      newPlayerIds.size > 0 ||
      newCoachIds.size > 0 ||
      newFamilyMemberIds.size > 0 ||
      families.some((family) => {
        const original = savedFamilies.find((f) => f.id === family.id);
        return (
          original &&
          (original.familyName !== family.familyName ||
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
      coaches.some((coach) => {
        const original = savedCoaches.find((c) => c.id === coach.id);
        return (
          original &&
          (original.name !== coach.name || original.isActive !== coach.isActive)
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
      let failedLabel: string | null = null;
      try {
        for (const family of families) {
          let familyId = family.id;

          if (newIds.has(family.id)) {
            failedLabel = `家庭「${family.familyName || '（家庭名未設定）'}」`;
            const oldFamilyId = family.id;
            familyId = await createFamily({
              familyName: family.familyName,
              vehicleCapacity: family.vehicleCapacity,
              pickupLocationId: family.pickupLocationId,
            });
            // 作成成功分は即座に下書きへ反映する（失敗時に再保存しても重複作成されないようにするため）
            setFamilies((prev) =>
              prev.map((f) => (f.id === oldFamilyId ? { ...f, id: familyId } : f))
            );
            setSavedFamilies((prev) => [...prev, { ...family, id: familyId }]);
            setPlayers((prev) =>
              prev.map((p) => (p.familyId === oldFamilyId ? { ...p, familyId } : p))
            );
            setCoaches((prev) =>
              prev.map((c) => (c.familyId === oldFamilyId ? { ...c, familyId } : c))
            );
            setFamilyMembers((prev) =>
              prev.map((m) => (m.familyId === oldFamilyId ? { ...m, familyId } : m))
            );
            setNewIds((prev) => removeIdFromSet(prev, oldFamilyId));
          } else {
            const original = savedFamilies.find((f) => f.id === family.id);
            if (!original) continue;

            const changes: FamilyUpdatableFields = {};
            if (original.familyName !== family.familyName) {
              changes.familyName = family.familyName;
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
              failedLabel = `家庭「${family.familyName || '（家庭名未設定）'}」`;
              await updateFamily(family.id, changes);
              setSavedFamilies((prev) =>
                prev.map((f) => (f.id === family.id ? { ...f, ...changes } : f))
              );
            }
          }

          const familyPlayers = players.filter(
            (player) => player.familyId === family.id
          );

          for (const player of familyPlayers) {
            if (newPlayerIds.has(player.id)) {
              failedLabel = `選手「${player.name || '（名前未設定）'}」`;
              const oldPlayerId = player.id;
              const newPlayerId = await createPlayer({
                familyId,
                name: player.name,
                schoolEntryYear: player.schoolEntryYear,
              });
              setPlayers((prev) =>
                prev.map((p) =>
                  p.id === oldPlayerId ? { ...p, id: newPlayerId, familyId } : p
                )
              );
              setSavedPlayers((prev) => [
                ...prev,
                { ...player, id: newPlayerId, familyId },
              ]);
              setNewPlayerIds((prev) => removeIdFromSet(prev, oldPlayerId));
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
              failedLabel = `選手「${player.name || '（名前未設定）'}」`;
              await updatePlayer(player.id, playerChanges);
              setSavedPlayers((prev) =>
                prev.map((p) => (p.id === player.id ? { ...p, ...playerChanges } : p))
              );
            }
          }

          const familyCoaches = coaches.filter((coach) => coach.familyId === family.id);

          for (const coach of familyCoaches) {
            if (newCoachIds.has(coach.id)) {
              failedLabel = `コーチ「${coach.name || '（名前未設定）'}」`;
              const oldCoachId = coach.id;
              const newCoachId = await createCoach({
                familyId,
                name: coach.name,
              });
              setCoaches((prev) =>
                prev.map((c) =>
                  c.id === oldCoachId ? { ...c, id: newCoachId, familyId } : c
                )
              );
              setSavedCoaches((prev) => [
                ...prev,
                { ...coach, id: newCoachId, familyId },
              ]);
              setNewCoachIds((prev) => removeIdFromSet(prev, oldCoachId));
              continue;
            }

            const originalCoach = savedCoaches.find((c) => c.id === coach.id);
            if (!originalCoach) continue;

            const coachChanges: CoachUpdatableFields = {};
            if (originalCoach.name !== coach.name) {
              coachChanges.name = coach.name;
            }
            if (originalCoach.isActive !== coach.isActive) {
              coachChanges.isActive = coach.isActive;
            }

            if (Object.keys(coachChanges).length > 0) {
              failedLabel = `コーチ「${coach.name || '（名前未設定）'}」`;
              await updateCoach(coach.id, coachChanges);
              setSavedCoaches((prev) =>
                prev.map((c) => (c.id === coach.id ? { ...c, ...coachChanges } : c))
              );
            }
          }

          const familyMemberList = familyMembers.filter(
            (familyMember) => familyMember.familyId === family.id
          );

          for (const familyMember of familyMemberList) {
            if (newFamilyMemberIds.has(familyMember.id)) {
              failedLabel = `家族「${familyMember.name || '（名前未設定）'}」`;
              const oldFamilyMemberId = familyMember.id;
              const newFamilyMemberId = await createFamilyMember({
                familyId,
                name: familyMember.name,
              });
              setFamilyMembers((prev) =>
                prev.map((m) =>
                  m.id === oldFamilyMemberId
                    ? { ...m, id: newFamilyMemberId, familyId }
                    : m
                )
              );
              setSavedFamilyMembers((prev) => [
                ...prev,
                { ...familyMember, id: newFamilyMemberId, familyId },
              ]);
              setNewFamilyMemberIds((prev) => removeIdFromSet(prev, oldFamilyMemberId));
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
              failedLabel = `家族「${familyMember.name || '（名前未設定）'}」`;
              await updateFamilyMember(familyMember.id, familyMemberChanges);
              setSavedFamilyMembers((prev) =>
                prev.map((m) =>
                  m.id === familyMember.id ? { ...m, ...familyMemberChanges } : m
                )
              );
            }
          }
        }

        const refreshedFamilies = await getFamilies();
        setNewIds(new Set());

        const [refreshedPlayersByFamily, refreshedCoachesByFamily, refreshedFamilyMembersByFamily] =
          await Promise.all([
            Promise.all(refreshedFamilies.map((family) => getPlayersByFamilyId(family.id))),
            Promise.all(refreshedFamilies.map((family) => getCoachesByFamilyId(family.id))),
            Promise.all(refreshedFamilies.map((family) => getFamilyMembersByFamilyId(family.id))),
          ]);
        const refreshedPlayers = refreshedPlayersByFamily.flat();
        setPlayers(refreshedPlayers);
        setSavedPlayers(refreshedPlayers);
        setNewPlayerIds(new Set());

        const refreshedCoaches = refreshedCoachesByFamily.flat();
        setCoaches(refreshedCoaches);
        setSavedCoaches(refreshedCoaches);
        setNewCoachIds(new Set());

        const refreshedFamilyMembers = refreshedFamilyMembersByFamily.flat();
        setFamilyMembers(refreshedFamilyMembers);
        setSavedFamilyMembers(refreshedFamilyMembers);
        setNewFamilyMemberIds(new Set());

        const sortedFamilies = sortFamilies(refreshedFamilies, refreshedPlayers);
        setFamilies(sortedFamilies);
        setSavedFamilies(sortedFamilies);

        setError(null);
      } catch {
        setError(
          failedLabel
            ? `${failedLabel}の保存に失敗しました。それより前の変更は保存済みです。もう一度保存してください。`
            : '家庭・選手・コーチ・家族の保存に失敗しました'
        );
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
            const familyCoaches = coaches.filter((coach) => coach.familyId === family.id);
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
                    {familyCoaches.length > 0 ? `・コーチ${familyCoaches.length}名` : ''}
                    {familyMemberList.length > 0 ? `・家族${familyMemberList.length}名` : ''}
                    ・{pickupName}
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

                <div style={sectionLabelStyle}>選手 {familyPlayers.length}名</div>

                <PlayerSection
                  playerList={familyPlayers}
                  onNameChange={handlePlayerNameChange}
                  onSchoolEntryYearChange={handlePlayerSchoolEntryYearChange}
                  onActiveToggle={handlePlayerActiveToggle}
                  onAdd={() => handlePlayerAdd(family.id)}
                  onDelete={openPlayerDelete}
                />

                <div style={sectionLabelStyle}>コーチ {familyCoaches.length}名</div>

                <CoachSection
                  coachList={familyCoaches}
                  onNameChange={handleCoachNameChange}
                  onActiveToggle={handleCoachActiveToggle}
                  onAdd={() => handleCoachAdd(family.id)}
                  onDelete={openCoachDelete}
                />

                <div style={sectionLabelStyle}>家族 {familyMemberList.length}名</div>

                <FamilyMemberSection
                  familyMemberList={familyMemberList}
                  onNameChange={handleFamilyMemberNameChange}
                  onActiveToggle={handleFamilyMemberActiveToggle}
                  onAdd={() => handleFamilyMemberAdd(family.id)}
                  onDelete={openFamilyMemberDelete}
                />

                <div
                  style={{
                    marginTop: '6px',
                    paddingTop: '12px',
                    borderTop: '1px dashed var(--negative-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      alignItems: 'flex-start',
                      fontSize: '11.5px',
                      lineHeight: 1.6,
                      color: 'var(--negative)',
                    }}
                  >
                    <WarningIcon size={14} />
                    <span>家庭を削除すると、所属する選手・コーチ・家族もすべて削除されます。</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => openFamilyDelete(family)}
                    >
                      家庭を削除
                    </Button>
                  </div>
                </div>
              </CollapsibleListRow>
            );
          })}
        </div>
        <AddRow onClick={handleAdd}>+ 家庭を追加</AddRow>
        </>
      )}

      <MasterDeleteDialog
        open={deleteTarget !== null}
        targetType={deleteTarget?.type ?? 'family'}
        targetName={deleteTarget?.name ?? ''}
        processing={deleting}
        onCancel={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
      />
    </section>
  );
}

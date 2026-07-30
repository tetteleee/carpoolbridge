import type { CSSProperties, ReactNode } from 'react';
import type { ResponsePlayer } from '../../types/event';
import type { Player } from '../../types/master';
import type { ResponseStatus } from '../../utils/responseStatus';
import { CarIcon, UserIcon } from '../icons';

interface FamilyStatusChipsProps {
  /** 家庭全体の回答状況 */
  status: ResponseStatus;
  driverOutward: boolean | null;
  driverReturn: boolean | null;
  playerList: Player[];
  responsePlayers: ResponsePlayer[];
  hasCoach: boolean;
  coachParticipating: boolean | null;
}

type ChipVariant = 'positive' | 'negative' | 'accent' | 'pending' | 'neutral' | 'player' | 'coach' | 'unanswered';

interface ChipDef {
  icon?: ReactNode;
  label: string;
  variant: ChipVariant;
}

const chipBaseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '3px',
  fontSize: '11.5px',
  fontWeight: 700,
  padding: '3px 8px',
  borderRadius: '999px',
  whiteSpace: 'nowrap',
};

const chipVariantStyle: Record<ChipVariant, CSSProperties> = {
  positive: { color: 'var(--positive)', background: 'var(--positive-bg)' },
  negative: { color: 'var(--negative)', background: 'var(--negative-bg)' },
  accent: { color: 'var(--accent)', background: 'var(--accent-bg)' },
  pending: { color: 'var(--warning)', background: 'var(--warning-bg)' },
  neutral: { color: 'var(--text)', background: 'var(--border)', fontWeight: 600 },
  // 選手カードの役割色（背景＋枠線＋アクセント）に揃える
  player: {
    color: 'var(--player-accent)',
    background: 'var(--player-bg)',
    border: '1px solid var(--player-border)',
  },
  // コーチカードの役割色（背景＋枠線＋アクセント）に揃える
  coach: {
    color: 'var(--coach-accent)',
    background: 'var(--coach-bg)',
    border: '1px solid var(--coach-border)',
  },
  unanswered: {
    color: 'var(--text)',
    background: 'transparent',
    border: '1px dashed var(--border)',
    fontWeight: 600,
  },
};

/** 車出し（driverOutward・driverReturn）の状態をチップ定義へ変換する */
function resolveDriverChip(driverOutward: boolean | null, driverReturn: boolean | null): ChipDef {
  const icon = <CarIcon size={12} />;
  if (driverOutward === true && driverReturn === true) {
    return { icon, label: '可', variant: 'positive' };
  }
  if (driverOutward === false && driverReturn === false) {
    return { icon, label: '不可', variant: 'negative' };
  }
  if (driverOutward === true && driverReturn === false) {
    return { icon, label: '行きのみ', variant: 'accent' };
  }
  if (driverOutward === false && driverReturn === true) {
    return { icon, label: '帰りのみ', variant: 'accent' };
  }
  return { icon, label: '未回答', variant: 'pending' };
}

/**
 * 選手全員の参加状況をチップ定義へ変換する。
 * 選手・コーチかどうかは色（役割色）で示すため、「選手」の文言は表示しない。
 * 誰も参加しない場合のみ灰色（neutral）にし、それ以外（全員参加・一部参加）は選手カードの役割色にする。
 */
function resolvePlayersChip(playerList: Player[], responsePlayers: ResponsePlayer[]): ChipDef {
  const icon = <UserIcon size={11} />;
  const participations = playerList.map(
    (player) => responsePlayers.find((p) => p.playerId === player.id)?.isParticipating
  );

  if (participations.some((isParticipating) => isParticipating === undefined || isParticipating === null)) {
    return { icon, label: '未回答', variant: 'player' };
  }

  const total = playerList.length;
  const participatingCount = participations.filter((isParticipating) => isParticipating === true).length;

  if (participatingCount === 0) {
    return { icon, label: `${participatingCount}/${total}`, variant: 'neutral' };
  }
  return { icon, label: `${participatingCount}/${total}`, variant: 'player' };
}

/**
 * コーチの参加状況をチップ定義へ変換する。
 * 不参加の場合のみ灰色（neutral）にし、それ以外（参加・未回答）はコーチカードの役割色にする。
 */
function resolveCoachChip(coachParticipating: boolean | null): ChipDef {
  const icon = <UserIcon size={11} />;
  if (coachParticipating === true) {
    return { icon, label: '○', variant: 'coach' };
  }
  if (coachParticipating === false) {
    return { icon, label: '✕', variant: 'neutral' };
  }
  return { icon, label: '未回答', variant: 'coach' };
}

function Chip({ icon, label, variant }: ChipDef) {
  return (
    <span style={{ ...chipBaseStyle, ...chipVariantStyle[variant] }}>
      {icon}
      {label}
    </span>
  );
}

/**
 * 家庭カードのヘッダー行に表示する状態チップ（車出し・選手参加・コーチ参加）。
 * 折りたたんでいても状況が一目で分かるようにする（04_画面設計.md#7参照）。
 * 家庭が全項目未回答の場合は、個別チップの代わりに「未回答」の1チップのみ表示する。
 * 残り幅いっぱいに広がり、ヘッダー右端の開閉アイコンを押し出す。
 */
export function FamilyStatusChips({
  status,
  driverOutward,
  driverReturn,
  playerList,
  responsePlayers,
  hasCoach,
  coachParticipating,
}: FamilyStatusChipsProps) {
  if (status === 'unanswered') {
    return (
      <span style={{ display: 'flex', flex: 1, minWidth: '40px', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
        <Chip label="未回答" variant="unanswered" />
      </span>
    );
  }

  const driverChip = resolveDriverChip(driverOutward, driverReturn);
  const playersChip = resolvePlayersChip(playerList, responsePlayers);
  const coachChip = hasCoach ? resolveCoachChip(coachParticipating) : null;

  return (
    <span style={{ display: 'flex', flex: 1, minWidth: '40px', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
      <Chip {...driverChip} />
      <Chip {...playersChip} />
      {coachChip && <Chip {...coachChip} />}
    </span>
  );
}

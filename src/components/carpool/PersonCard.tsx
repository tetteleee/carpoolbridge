import type { PointerEvent as ReactPointerEvent } from 'react';
import { DragHandleIcon, MapPinIcon } from '../icons';
import type { CarpoolMember } from '../../types/event';

/**
 * 人カード1件分のデータ。
 * 未配車エリア・車カードのいずれの文脈でも同じ形で表示する。
 */
export interface PersonCardData {
  /** 人カードの一意なキー（子供IDまたは家庭ID） */
  id: string;
  /** 表示名（子供名、または「〇〇父」などのコーチ表記） */
  name: string;
  /** 学年表記（例：「小4」）。学年を持たない人物（コーチなど）はnull */
  grade: string | null;
  /** 集合場所名 */
  pickupLocationName: string;
  /** 元の乗車メンバー情報（ドラッグ＆ドロップによる移動時に、配車結果データを特定するために使用） */
  member: CarpoolMember;
}

interface PersonCardProps {
  person: PersonCardData;
  /** カードの長押しドラッグ開始を検知するためのポインター押下ハンドラー（T43） */
  onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
  /** このカードがドラッグ中かどうか（T43。ドラッグ中は薄く表示する） */
  isDragging?: boolean;
}

/**
 * 配車画面（メイン）の人カード。
 * 未配車エリア・車カードのどちらの中でも同じ見た目・情報構成で表示する。
 * 学年の有無で子供・コーチを判定し、色分けで区別する。
 * カード全体が長押しドラッグの起点となる（ドラッグハンドル部分に限定しない）。
 */
export function PersonCard({ person, onPointerDown, isDragging = false }: PersonCardProps) {
  const isCoach = person.grade === null;

  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 12px',
        fontSize: '14px',
        color: 'var(--text)',
        background: isCoach ? 'var(--coach-bg)' : 'var(--code-bg)',
        border: isCoach ? '1px solid var(--coach-border)' : 'none',
        opacity: isDragging ? 0.4 : 1,
        touchAction: onPointerDown ? 'none' : undefined,
        userSelect: onPointerDown ? 'none' : undefined,
        WebkitUserSelect: onPointerDown ? 'none' : undefined,
        cursor: onPointerDown ? 'grab' : undefined,
      }}
    >
      <span
        aria-label="ドラッグハンドル"
        style={{ display: 'flex', flexShrink: 0, color: 'var(--text)' }}
      >
        <DragHandleIcon size={16} />
      </span>
      <span style={{ fontWeight: 700, color: 'var(--text-h)' }}>
        {person.name}
        {person.grade && `(${person.grade})`}
      </span>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          fontSize: '12px',
          color: 'var(--text)',
        }}
      >
        <MapPinIcon size={14} />
        {person.pickupLocationName}
      </span>
    </div>
  );
}

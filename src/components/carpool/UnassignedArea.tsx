import type { PointerEvent as ReactPointerEvent } from 'react';
import { PersonCard, type PersonCardData } from './PersonCard';
import { UNASSIGNED_ZONE_ID } from '../../services/carpool/carpoolMember';

/** 未配車エリアに表示する人カード1件分のデータ */
export type UnassignedPerson = PersonCardData;

interface UnassignedAreaProps {
  /** 選択中タブ（行き／帰り）に応じた未配車の人一覧 */
  people: UnassignedPerson[];
  /** ドラッグ中の人カードのID（自身のエリア内であれば薄く表示するために使用。T43） */
  draggingPersonId?: string | null;
  /** 人カードのonPointerDownハンドラーを生成する（T43。長押しドラッグ開始の検知に使用） */
  onPersonPointerDown?: (
    person: PersonCardData
  ) => (event: ReactPointerEvent<HTMLDivElement>) => void;
}

/**
 * 配車画面（メイン）の未配車エリア。
 * 未配車人数が0人の場合はエリア自体を非表示にする。
 */
export function UnassignedArea({
  people,
  draggingPersonId = null,
  onPersonPointerDown,
}: UnassignedAreaProps) {
  if (people.length === 0) {
    return null;
  }

  return (
    <section
      data-drop-zone-id={UNASSIGNED_ZONE_ID}
      style={{
        border: '1px dashed var(--border)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <h2
        style={{
          margin: 0,
          padding: '10px 12px',
          fontSize: '14px',
          fontWeight: 700,
          color: 'var(--text-h)',
          borderBottom: '1px dashed var(--border)',
        }}
      >
        {'未配車　' + people.length + '名'}
      </h2>

      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {people.map((person) => (
          <li key={person.id} style={{ borderTop: '1px solid var(--border)' }}>
            <PersonCard
              person={person}
              onPointerDown={onPersonPointerDown?.(person)}
              isDragging={person.id === draggingPersonId}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

import { DragHandleIcon, MapPinIcon } from '../icons';

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
}

interface PersonCardProps {
  person: PersonCardData;
}

/**
 * 配車画面（メイン）の人カード。
 * 未配車エリア・車カードのどちらの中でも同じ見た目・情報構成で表示する。
 * 学年の有無で子供・コーチを判定し、色分けで区別する。
 */
export function PersonCard({ person }: PersonCardProps) {
  const isCoach = person.grade === null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 12px',
        fontSize: '14px',
        color: 'var(--text)',
        background: isCoach ? 'var(--coach-bg)' : 'var(--code-bg)',
        border: isCoach ? '1px solid var(--coach-border)' : 'none',
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

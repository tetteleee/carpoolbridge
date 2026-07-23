import { DragHandleIcon, MapPinIcon } from '../icons';

/**
 * 未配車エリアに表示する人カード1件分のデータ。
 * 未配車データの取得・算出処理自体はT40の対象外のため、
 * このデータは呼び出し元から渡される前提とする。
 */
export interface UnassignedPerson {
  /** 人カードの一意なキー（子供IDまたは家庭ID） */
  id: string;
  /** 表示名（子供名、または「〇〇父」などのコーチ表記） */
  name: string;
  /** 学年表記（例：「小4」）。学年を持たない人物（コーチなど）はnull */
  grade: string | null;
  /** 集合場所名 */
  pickupLocationName: string;
}

interface UnassignedAreaProps {
  /** 選択中タブ（行き／帰り）に応じた未配車の人一覧 */
  people: UnassignedPerson[];
}

/**
 * 配車画面（メイン）の未配車エリア。
 * 未配車人数が0人の場合はエリア自体を非表示にする。
 * 人カードの詳細表示・色分けはT42、ドラッグ＆ドロップ動作はT43で実施する。
 */
export function UnassignedArea({ people }: UnassignedAreaProps) {
  if (people.length === 0) {
    return null;
  }

  return (
    <section
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
          <li
            key={person.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderTop: '1px solid var(--border)',
              fontSize: '14px',
              color: 'var(--text)',
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
          </li>
        ))}
      </ul>
    </section>
  );
}

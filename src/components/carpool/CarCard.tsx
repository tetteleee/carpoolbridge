import { CarIcon, DragHandleIcon, MapPinIcon } from '../icons';

/**
 * 車カードに表示する乗車メンバー1件分のデータ。
 * メンバー自体の詳細表示・色分けはT42で実施するため、
 * 本タスクでは名前・学年・集合場所名の表示にとどめる。
 */
export interface CarCardMember {
  /** 人カードの一意なキー（子供IDまたは家庭ID） */
  id: string;
  /** 表示名（子供名、または「〇〇父」などのコーチ表記） */
  name: string;
  /** 学年表記（例：「小4」）。学年を持たない人物（コーチなど）はnull */
  grade: string | null;
  /** 集合場所名 */
  pickupLocationName: string;
}

/**
 * 車カード1台分のデータ。
 * 車カードデータの取得・算出処理自体は対象設計書に取得元の規定がないため対象外とし、
 * このデータは呼び出し元から渡される前提とする。
 */
export interface CarCardData {
  /** 配車ID */
  id: string;
  /** 家庭名（例：「山田家」）。カード上は「家」を除き「号」を付与した車名として表示する */
  familyName: string;
  /** 運転者本人を含む総定員 */
  capacity: number;
  /** 巡回する集合場所名（巡回順） */
  routeLocationNames: string[];
  /** 乗車メンバー（運転者は含めない） */
  members: CarCardMember[];
}

interface CarCardProps {
  car: CarCardData;
}

/**
 * 家庭名から車名を算出する（例：山田家→山田号）。
 */
function toCarName(familyName: string): string {
  return `${familyName.replace(/家$/, '')}号`;
}

/**
 * 配車画面（メイン）の車カード。
 * 乗車率・巡回する集合場所を表示し、乗車人数（運転者を含む）が
 * 定員を超過している場合はカード枠を赤色で表示する。
 * 乗車メンバー自体の詳細表示・色分けはT42、ドラッグ＆ドロップ動作はT43で実施する。
 */
export function CarCard({ car }: CarCardProps) {
  const occupantCount = car.members.length + 1;
  const isOverCapacity = occupantCount > car.capacity;

  return (
    <section
      style={{
        border: `1px solid ${isOverCapacity ? 'crimson' : 'var(--border)'}`,
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--text-h)',
            }}
          >
            <CarIcon size={18} />
            {toCarName(car.familyName)}
          </span>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: isOverCapacity ? 'crimson' : 'var(--text-h)',
            }}
          >
            {occupantCount}/{car.capacity}
          </span>
        </div>

        <div
          style={{
            marginTop: '4px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: 'var(--text)',
          }}
        >
          {car.routeLocationNames.map((locationName, index) => (
            <span
              key={index}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {index > 0 && <span>→</span>}
              <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <MapPinIcon size={12} />
                {locationName}
              </span>
            </span>
          ))}
        </div>
      </div>

      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {car.members.map((member) => (
          <li
            key={member.id}
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
              {member.name}
              {member.grade && `(${member.grade})`}
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
              {member.pickupLocationName}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

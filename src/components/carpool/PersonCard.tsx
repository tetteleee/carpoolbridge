import type { PointerEvent as ReactPointerEvent } from 'react';
import { DragHandleIcon, FlagIcon, MapPinIcon } from '../icons';
import type { CarpoolMember } from '../../types/event';

/**
 * 人カード1件分のデータ。
 * 未配車エリア・車カードのいずれの文脈でも同じ形で表示する。
 */
export interface PersonCardData {
  /** 人カードの一意なキー（選手IDまたは家庭ID） */
  id: string;
  /** 表示名（選手名、または「〇〇父」などのコーチ表記） */
  name: string;
  /** 学年表記（例：「小4」）。学年を持たない人物（コーチなど）はnull */
  grade: string | null;
  /** 集合場所ID（マスタのID。集合場所グルーピングの判定に使用する） */
  pickupLocationId: string;
  /** 集合場所名 */
  pickupLocationName: string;
  /** 元の乗車メンバー情報（ドラッグ＆ドロップによる移動時に、配車結果データを特定するために使用） */
  member: CarpoolMember;
}

interface PersonCardProps {
  person: PersonCardData;
  /** カードの長押しドラッグ開始を検知するためのポインター押下ハンドラー（T43） */
  onPointerDown?: (event: ReactPointerEvent<Element>) => void;
  /** このカードがドラッグ中かどうか（T43。ドラッグ中は薄く表示する） */
  isDragging?: boolean;
  /**
   * ドラッグ＆ドロップの対象かどうか（T62）。falseの場合、ドラッグハンドル（≡）の代わりに
   * 旗アイコンを表示し、そもそも移動できないカードであることを見た目でも示す
   * （配車不要エリア等、ドラッグ＆ドロップ対象外の一覧で使用する）。
   */
  draggable?: boolean;
  /**
   * チップ表示（未配車エリア・車カード内、集合場所グルーピングの一覧）かどうか。
   * trueの場合、集合場所ラベルを表示せず、横並びで折り返せるコンパクトな見た目にする
   * （集合場所は代わりにグループ見出しに表示される。04_画面設計.md#集合場所グルーピング）。
   * 省略時はfalse＝既存の1行フルカード（配車不要エリアで使用）。
   */
  compact?: boolean;
  /**
   * 左端の先頭アイコン（ドラッグハンドル／旗）自体を表示しないかどうか。
   * LINE共有の共有用画像（静的な表示専用）で、操作専用のUI要素であるドラッグハンドルを
   * 除くために使用する（04_画面設計.md#9.2）。省略時はfalse＝既存どおりアイコンを表示する。
   */
  hideLeadingIcon?: boolean;
}

/**
 * 配車画面（メイン）の人カード。
 * 未配車エリア・車カードのどちらの中でも同じ見た目・情報構成で表示する。
 * 乗車メンバー種別（member.type）で選手・コーチ・家族を判定し、色分けで区別する。
 *
 * ドラッグ起点はデバイスにより異なる（ref: docs/04_画面設計.md#ドラッグ＆ドロップ）。
 * マウスはカード全体、タッチ／ペンはドラッグハンドル（≡）部分のみとする。
 * これはtouch-action: pan-yをカード全体に指定すると、ネイティブの縦スクロールに
 * ジェスチャーの制御が渡ってしまい長押しドラッグへ移行できなくなるための対応。
 * ハンドル部分のみtouch-action: noneとすることで、カード本体からは縦スクロールでき、
 * ハンドルからは確実に長押しドラッグを開始できるようにしている。
 */
export function PersonCard({
  person,
  onPointerDown,
  isDragging = false,
  draggable = true,
  compact = false,
  hideLeadingIcon = false,
}: PersonCardProps) {
  // 学年（person.grade）は対象学年外の選手もnullになりうるため、コーチ・家族の判定には使わない（04_画面設計.md#色分けルール）
  const isCoach = person.member.type === 'coach';
  const isFamily = person.member.type === 'family';

  const handleCardPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!onPointerDown || event.pointerType !== 'mouse') {
      return;
    }
    onPointerDown(event);
  };

  const handleHandlePointerDown = (event: ReactPointerEvent<Element>) => {
    if (!onPointerDown || event.pointerType === 'mouse') {
      return;
    }
    onPointerDown(event);
  };

  return (
    <div
      onPointerDown={handleCardPointerDown}
      style={{
        display: compact ? 'inline-flex' : 'flex',
        alignItems: 'center',
        gap: compact ? '6px' : '8px',
        padding: compact ? '6px 10px' : '10px 12px',
        borderRadius: compact ? '6px' : undefined,
        fontSize: '14px',
        color: 'var(--text)',
        background: isCoach ? 'var(--coach-bg)' : isFamily ? 'var(--parent-bg)' : 'var(--player-bg)',
        border: isCoach
          ? '1px solid var(--coach-border)'
          : isFamily
            ? '1px solid var(--parent-border)'
            : '1px solid var(--player-border)',
        borderLeft: isCoach
          ? '5px solid var(--coach-accent)'
          : isFamily
            ? '5px solid var(--parent-accent)'
            : '5px solid var(--player-accent)',
        opacity: isDragging ? 'var(--drag-ghost-opacity)' : 1,
        userSelect: onPointerDown ? 'none' : undefined,
        WebkitUserSelect: onPointerDown ? 'none' : undefined,
        cursor: onPointerDown ? 'grab' : undefined,
      }}
    >
      {!hideLeadingIcon && (
        <span
          aria-label={draggable ? 'ドラッグハンドル' : '配車不要'}
          onPointerDown={draggable ? handleHandlePointerDown : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: 'var(--text)',
            position: 'relative',
            zIndex: 1,
            // タッチ操作の当たり判定を広げるため、見た目を変えずにmargin/paddingで
            // タップ領域のみ拡大する。三本線は左端にあり指が届きにくいため、右方向だけ
            // さらに広く取る（非対称）。右側の拡大分は隣の名前テキストの領域と重なるが、
            // z-indexで手前に出しているため、その範囲を触ってもドラッグハンドルとして反応する。
            // コンパクト表示（チップ）は隣のチップとの間隔が狭いため、隣のチップを覆わない
            // 範囲で全方向に均等拡大する（チップ間の余白はLocationGroupedList側で確保している）。
            margin: compact ? '-8px' : '-10px -34px -10px -10px',
            padding: compact ? '8px' : '10px 34px 10px 10px',
            touchAction: draggable && onPointerDown ? 'none' : undefined,
            opacity: draggable ? 1 : 0.55,
          }}
        >
          {draggable ? <DragHandleIcon size={compact ? 14 : 16} /> : <FlagIcon size={compact ? 14 : 16} />}
        </span>
      )}
      <span style={{ fontWeight: 700, color: 'var(--text-h)' }}>
        {person.name}
        {person.grade && (
          <span style={{ fontWeight: 400, fontSize: '12px', color: 'var(--text)' }}>
            {' '}({person.grade})
          </span>
        )}
      </span>
      {!compact && (
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
      )}
    </div>
  );
}

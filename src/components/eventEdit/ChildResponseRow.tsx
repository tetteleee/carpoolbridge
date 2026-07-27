import type { CSSProperties } from 'react';

interface ChildResponseRowProps {
  /** 対象子供ID（DOM要素のid付与に使用） */
  childId: string;
  /** イベントに参加するかどうか。未選択=null */
  isParticipating: boolean | null;
  /** 行きの配車が不要かどうか */
  noOutwardRide: boolean;
  /** 帰りの配車が不要かどうか */
  noReturnRide: boolean;
  /** 参加有無の変更 */
  onChangeIsParticipating: (value: boolean) => void;
  /** 行きの配車不要チェックの変更 */
  onChangeNoOutwardRide: (value: boolean) => void;
  /** 帰りの配車不要チェックの変更 */
  onChangeNoReturnRide: (value: boolean) => void;
}

const choiceButtonBaseStyle: CSSProperties = {
  minHeight: '44px',
  padding: '0 10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '6px',
  fontSize: '13px',
  fontFamily: 'var(--sans)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
};

/** 「行き不要／帰り不要」用の縮小ボタン（参加ボタンより一回り小さくし、1行に収まりやすくする） */
const rideOptionButtonStyle: CSSProperties = {
  minHeight: '36px',
  padding: '0 8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '6px',
  fontSize: '12px',
  fontFamily: 'var(--sans)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
};

/** 折り返す場合に単位が崩れないよう、ボタン群をひとまとまりにするグループコンテナ */
const buttonGroupStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const choicePositiveSelectedStyle: CSSProperties = {
  border: '1px solid var(--positive-border)',
  background: 'var(--positive-bg)',
  color: 'var(--positive)',
  fontWeight: 700,
};

const choiceNegativeSelectedStyle: CSSProperties = {
  border: '1px solid var(--negative-border)',
  background: 'var(--negative-bg)',
  color: 'var(--negative)',
  fontWeight: 700,
};

const choiceUnselectedStyle: CSSProperties = {
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--text)',
  fontWeight: 400,
};

const dividerStyle: CSSProperties = {
  width: '1px',
  height: '28px',
  background: 'var(--border)',
  flexShrink: 0,
};

const unansweredDotStyle: CSSProperties = {
  display: 'inline-block',
  width: '8px',
  height: '8px',
  borderRadius: '999px',
  background: 'var(--warning)',
  flexShrink: 0,
};

/**
 * イベント編集（回答入力）画面・家庭カード内の
 * 子供ごとの参加（3状態）・行き／帰りの配車不要ボタンを1行にまとめて表示する。
 * 「行き不要」「帰り不要」は参加が○のときだけ表示する（参加ボタンの右側に区切り線を挟んで並べる）。
 * 参加が○以外になっても noOutwardRide・noReturnRide の値自体は保持し、○に戻すと表示が復元される。
 * 値は呼び出し側（FamilyResponseCard）が保持し、変更の都度Firestoreへ自動保存される（T29）。
 */
export function ChildResponseRow({
  childId,
  isParticipating,
  noOutwardRide,
  noReturnRide,
  onChangeIsParticipating,
  onChangeNoOutwardRide,
  onChangeNoReturnRide,
}: ChildResponseRowProps) {
  const showRideOptions = isParticipating === true;

  return (
    <div
      id={`child-response-frame-${childId}`}
      style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}
    >
      {isParticipating === null && (
        <span
          id={`child-participating-unanswered-dot-${childId}`}
          aria-hidden="true"
          style={unansweredDotStyle}
        />
      )}
      <div style={buttonGroupStyle}>
        <button
          id={`child-participating-yes-${childId}`}
          type="button"
          aria-pressed={isParticipating === true}
          onClick={() => onChangeIsParticipating(true)}
          style={{
            ...choiceButtonBaseStyle,
            ...(isParticipating === true ? choicePositiveSelectedStyle : choiceUnselectedStyle),
          }}
        >
          ○参加
        </button>
        <button
          id={`child-participating-no-${childId}`}
          type="button"
          aria-pressed={isParticipating === false}
          onClick={() => onChangeIsParticipating(false)}
          style={{
            ...choiceButtonBaseStyle,
            ...(isParticipating === false ? choiceNegativeSelectedStyle : choiceUnselectedStyle),
          }}
        >
          ✕不参加
        </button>
      </div>

      {showRideOptions && (
        <div style={buttonGroupStyle}>
          <span aria-hidden="true" style={dividerStyle} />
          <button
            id={`no-outward-ride-${childId}`}
            type="button"
            aria-pressed={noOutwardRide}
            onClick={() => onChangeNoOutwardRide(!noOutwardRide)}
            style={{
              ...rideOptionButtonStyle,
              ...(noOutwardRide ? choicePositiveSelectedStyle : choiceUnselectedStyle),
            }}
          >
            行き不要
          </button>
          <button
            id={`no-return-ride-${childId}`}
            type="button"
            aria-pressed={noReturnRide}
            onClick={() => onChangeNoReturnRide(!noReturnRide)}
            style={{
              ...rideOptionButtonStyle,
              ...(noReturnRide ? choicePositiveSelectedStyle : choiceUnselectedStyle),
            }}
          >
            帰り不要
          </button>
        </div>
      )}
    </div>
  );
}

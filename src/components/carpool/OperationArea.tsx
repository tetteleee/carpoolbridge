import { EditIcon, ShareIcon } from '../icons';
import type { Direction } from '../../types/event';

interface OperationAreaProps {
  /** 選択中タブ（行き／帰り）。共有ボタン押下時に共有対象として渡す */
  direction: Direction;
  /** 「回答編集」ボタン押下時に呼び出す、イベント編集画面への遷移処理 */
  onEditAnswers: () => void;
  /** 「共有」ボタン押下時に呼び出す、LINE共有画面への遷移処理 */
  onShare: (direction: Direction) => void;
}

/**
 * 配車画面（メイン）の操作エリア。
 * 「回答編集」「共有」ボタンを表示する。
 * ボタンの遷移先接続自体はT39a（回答編集）・T46a（共有）で行うため、
 * ここでは呼び出し元から渡された遷移処理を呼び出すところまでを担う。
 */
export function OperationArea({
  direction,
  onEditAnswers,
  onShare,
}: OperationAreaProps) {
  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-h)',
    fontSize: '14px',
    fontWeight: 700,
    fontFamily: 'var(--sans)',
    cursor: 'pointer',
  } as const;

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
      <button type="button" onClick={onEditAnswers} style={buttonStyle}>
        <EditIcon size={16} />
        回答編集
      </button>
      <button
        type="button"
        onClick={() => onShare(direction)}
        style={buttonStyle}
      >
        <ShareIcon size={16} />
        共有
      </button>
    </div>
  );
}

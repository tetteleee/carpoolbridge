import { Button } from '../common/Button';
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
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
      <Button
        variant="secondary"
        size="sm"
        icon={<EditIcon size={16} />}
        onClick={onEditAnswers}
      >
        回答編集
      </Button>
      <Button
        variant="secondary"
        size="sm"
        icon={<ShareIcon size={16} />}
        onClick={() => onShare(direction)}
      >
        共有
      </Button>
    </div>
  );
}

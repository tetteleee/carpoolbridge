import type { CSSProperties } from 'react';
import { Button } from '../common/Button';
import { EditIcon, ShareIcon } from '../icons';

interface OperationAreaProps {
  /** 「回答編集」ボタン押下時に呼び出す、イベント編集画面への遷移処理 */
  onEditAnswers: () => void;
  /** 「共有」ボタン押下時に呼び出す、共有モーダルを開く処理 */
  onShare: () => void;
}

/** 回答編集・共有ボタン共通の見た目（グレー枠のアイコンのみボタン） */
const iconButtonStyle: CSSProperties = {
  width: '34px',
  height: '34px',
  padding: 0,
  minHeight: 0,
  borderColor: '#D1D5DB',
  color: '#6B7280',
};

/**
 * 配車画面（メイン）の操作エリア。
 * 「回答編集」「共有」ボタンを表示する。
 * 共有対象は選択中タブに関わらず常に行き・帰り両方向のため、共有ボタンは方向を渡さない
 * （04_画面設計.md#8 操作エリア）。
 * ボタンの遷移先・開閉先接続自体はT39a（回答編集）・T46a（共有）で行うため、
 * ここでは呼び出し元から渡された処理を呼び出すところまでを担う。
 */
export function OperationArea({ onEditAnswers, onShare }: OperationAreaProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
      <Button
        variant="secondary"
        size="sm"
        aria-label="回答編集"
        onClick={onEditAnswers}
        style={iconButtonStyle}
      >
        <EditIcon size={16} />
      </Button>
      <Button
        variant="secondary"
        size="sm"
        aria-label="共有"
        onClick={onShare}
        style={iconButtonStyle}
      >
        <ShareIcon size={16} />
      </Button>
    </div>
  );
}

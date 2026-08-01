import { Button } from '../common/Button';
import type { Direction } from '../../types/event';

const DIRECTION_LABEL: Record<Direction, string> = {
  OUTWARD: '行き',
  RETURN: '帰り',
};

interface CarpoolCopyDialogProps {
  /** コピー元の方向。nullの場合はダイアログを非表示にする */
  sourceDirection: Direction | null;
  /** 「コピー」実行中かどうか（true の間はボタンを操作不可にする） */
  processing: boolean;
  /** 「キャンセル」選択時 */
  onCancel: () => void;
  /** 「コピー」選択時 */
  onConfirm: () => void;
}

/**
 * 行き⇔帰りコピーの確認ダイアログ。
 * ヘッダーの「⋮」メニューからコピー項目が選択された場合にのみ表示する。
 * ref: docs/04_画面設計.md#8 行き⇔帰りコピー
 */
export function CarpoolCopyDialog({
  sourceDirection,
  processing,
  onCancel,
  onConfirm,
}: CarpoolCopyDialogProps) {
  if (!sourceDirection) {
    return null;
  }

  const targetDirection: Direction = sourceDirection === 'OUTWARD' ? 'RETURN' : 'OUTWARD';
  const sourceLabel = DIRECTION_LABEL[sourceDirection];
  const targetLabel = DIRECTION_LABEL[targetDirection];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="carpool-copy-dialog-title"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.4)',
        padding: '16px',
        boxSizing: 'border-box',
        zIndex: 100,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '20px',
          borderRadius: '10px',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          boxSizing: 'border-box',
        }}
      >
        <h3
          id="carpool-copy-dialog-title"
          style={{ margin: 0, fontSize: '16px', color: 'var(--text-h)', textAlign: 'center' }}
        >
          {sourceLabel}を{targetLabel}にコピー
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            color: 'var(--text)',
            lineHeight: 1.6,
            textAlign: 'center',
          }}
        >
          現在の{targetLabel}の配車結果は削除されます。
          <br />
          <br />
          {sourceLabel}の配車内容をコピーしますか？
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={processing}>
            キャンセル
          </Button>
          <Button variant="primary" size="sm" onClick={onConfirm} disabled={processing}>
            {processing ? 'コピー中...' : 'コピー'}
          </Button>
        </div>
      </div>
    </div>
  );
}

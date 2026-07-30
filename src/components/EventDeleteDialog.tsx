import { Button } from './common/Button';

interface EventDeleteDialogProps {
  /** ダイアログの表示・非表示 */
  open: boolean;
  /** 「削除」実行中かどうか（true の間はボタンを操作不可にする） */
  processing: boolean;
  /** 「キャンセル」選択時 */
  onCancel: () => void;
  /** 「削除」選択時 */
  onConfirm: () => void;
}

/**
 * イベント削除の確認ダイアログ。
 * イベント情報編集画面の「イベントを削除」ボタン押下時にのみ表示する。
 * ref: docs/04_画面設計.md#12 イベント情報編集
 */
export function EventDeleteDialog({
  open,
  processing,
  onCancel,
  onConfirm,
}: EventDeleteDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-delete-dialog-title"
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
          id="event-delete-dialog-title"
          style={{ margin: 0, fontSize: '16px', color: 'var(--text-h)', textAlign: 'center' }}
        >
          イベントを削除
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
          本当に削除しますか？
          <br />
          回答・配車結果も削除されます。
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={processing}
          >
            キャンセル
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={onConfirm}
            disabled={processing}
          >
            {processing ? '削除中...' : '削除'}
          </Button>
        </div>
      </div>
    </div>
  );
}

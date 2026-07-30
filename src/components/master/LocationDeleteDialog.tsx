import { Button } from '../common/Button';

interface LocationDeleteDialogProps {
  /** ダイアログの表示・非表示 */
  open: boolean;
  /** 削除対象の種別名（「集合場所」または「目的地」。タイトルに使用する） */
  label: string;
  /** 「削除」実行中かどうか（true の間はボタンを操作不可にする） */
  processing: boolean;
  /** 「キャンセル」選択時 */
  onCancel: () => void;
  /** 「削除」選択時 */
  onConfirm: () => void;
}

/**
 * 集合場所・目的地の削除確認ダイアログ（共通）。
 * 各編集画面の行の「削除」ボタン押下時にのみ表示する。
 * ref: docs/04_画面設計.md#10.2 集合場所編集画面（削除確認ダイアログ）
 */
export function LocationDeleteDialog({
  open,
  label,
  processing,
  onCancel,
  onConfirm,
}: LocationDeleteDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-delete-dialog-title"
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
          id="location-delete-dialog-title"
          style={{ margin: 0, fontSize: '16px', color: 'var(--text-h)', textAlign: 'center' }}
        >
          {label}を削除
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

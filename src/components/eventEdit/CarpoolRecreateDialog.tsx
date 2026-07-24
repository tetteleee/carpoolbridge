import { Button } from '../common/Button';

interface CarpoolRecreateDialogProps {
  /** ダイアログの表示・非表示 */
  open: boolean;
  /** 「再作成」実行中かどうか（true の間はボタンを操作不可にする） */
  processing: boolean;
  /** 「キャンセル」選択時 */
  onCancel: () => void;
  /** 「再作成」選択時 */
  onConfirm: () => void;
}

/**
 * 配車再作成の確認ダイアログ。
 * 既存の配車結果が存在する状態で「配車作成」が押された場合にのみ表示する。
 * ref: docs/04_画面設計.md#7 配車再作成
 */
export function CarpoolRecreateDialog({
  open,
  processing,
  onCancel,
  onConfirm,
}: CarpoolRecreateDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="carpool-recreate-dialog-title"
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
          id="carpool-recreate-dialog-title"
          style={{ margin: 0, fontSize: '16px', color: 'var(--text-h)' }}
        >
          配車を再作成
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            color: 'var(--text)',
            lineHeight: 1.6,
          }}
        >
          現在の配車結果は削除されます。
          <br />
          <br />
          回答内容を反映して
          <br />
          配車を再作成しますか？
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
            variant="primary"
            size="sm"
            onClick={onConfirm}
            disabled={processing}
          >
            {processing ? '再作成中...' : '再作成'}
          </Button>
        </div>
      </div>
    </div>
  );
}

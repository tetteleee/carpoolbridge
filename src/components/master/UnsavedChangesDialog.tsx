import { Button } from '../common/Button';

interface UnsavedChangesDialogProps {
  /** ダイアログの表示・非表示 */
  open: boolean;
  /** 「編集を続ける」選択時 */
  onCancel: () => void;
  /** 「このまま戻る」選択時 */
  onConfirm: () => void;
}

/**
 * マスタ管理画面の未保存確認ダイアログ。
 * 未保存の編集・追加がある状態で「戻る」が押された場合にのみ表示する。
 * ref: docs/04_画面設計.md#10 マスタ管理
 */
export function UnsavedChangesDialog({
  open,
  onCancel,
  onConfirm,
}: UnsavedChangesDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-changes-dialog-title"
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
          id="unsaved-changes-dialog-title"
          style={{ margin: 0, fontSize: '16px', color: 'var(--text-h)' }}
        >
          保存されていません
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            color: 'var(--text)',
            lineHeight: 1.6,
          }}
        >
          編集内容は保存されていません。
          <br />
          このまま戻ると内容は破棄されます。
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" size="sm" onClick={onCancel}>
            編集を続ける
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm}>
            このまま戻る
          </Button>
        </div>
      </div>
    </div>
  );
}

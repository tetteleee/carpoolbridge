import { Button } from '../common/Button';

interface BackupImportConfirmDialogProps {
  /** ダイアログの表示・非表示 */
  open: boolean;
  /** 選択されたファイル名（案内表示用） */
  fileName: string;
  /** 公開版（端末内保存）かどうか。falseの場合は自チーム版向けの文言を表示する */
  isPublicBuild: boolean;
  /** 「読み込む」実行中かどうか（true の間はボタンを操作不可にする） */
  processing: boolean;
  /** 「キャンセル」選択時 */
  onCancel: () => void;
  /** 「読み込む」選択時 */
  onConfirm: () => void;
}

/**
 * バックアップ読み込みの確認ダイアログ。
 * 「ファイルを選択」で形式の正しいファイルが選ばれた場合にのみ表示する。
 * ref: docs/04_画面設計.md#10.5 データのバックアップ画面（読み込み確認ダイアログ）
 */
export function BackupImportConfirmDialog({
  open,
  fileName,
  isPublicBuild,
  processing,
  onCancel,
  onConfirm,
}: BackupImportConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-import-confirm-dialog-title"
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
          id="backup-import-confirm-dialog-title"
          style={{ margin: 0, fontSize: '16px', color: 'var(--text-h)', textAlign: 'center' }}
        >
          バックアップを読み込みますか？
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: '13px',
            color: 'var(--text)',
            lineHeight: 1.7,
          }}
        >
          {isPublicBuild
            ? '現在この端末に保存されているすべてのデータ（集合場所・目的地・家庭・選手・コーチ・家族・イベント・回答・配車結果）が削除され、選択したファイルの内容に置き換わります。'
            : '現在チームで共有されているすべてのデータ（集合場所・目的地・家庭・選手・コーチ・家族・イベント・回答・配車結果）が削除され、選択したファイルの内容に置き換わります。'}
          <br />
          この操作は取り消せません。
        </p>
        {!isPublicBuild && (
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--negative)',
              lineHeight: 1.6,
            }}
          >
            ⚠ この操作はチーム全員のデータに反映されます。
          </p>
        )}
        <div
          style={{
            fontSize: '11.5px',
            color: 'var(--text)',
            background: 'var(--code-bg)',
            borderRadius: '8px',
            padding: '8px 10px',
            wordBreak: 'break-all',
          }}
        >
          {fileName}
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={processing}>
            キャンセル
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm} disabled={processing}>
            {processing ? '読み込み中...' : '読み込む'}
          </Button>
        </div>
      </div>
    </div>
  );
}

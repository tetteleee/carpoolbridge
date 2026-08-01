import { Button } from '../common/Button';

type MasterDeleteTargetType = 'player' | 'coach' | 'familyMember' | 'family';

interface MasterDeleteDialogProps {
  /** ダイアログの表示・非表示 */
  open: boolean;
  /** 削除対象の種別（タイトル・メッセージの文言を出し分ける） */
  targetType: MasterDeleteTargetType;
  /** 削除対象の名前（メッセージに埋め込む） */
  targetName: string;
  /** 「削除」実行中かどうか（true の間はボタンを操作不可にする） */
  processing: boolean;
  /** 「キャンセル」選択時 */
  onCancel: () => void;
  /** 「削除」選択時 */
  onConfirm: () => void;
}

const targetLabel: Record<MasterDeleteTargetType, string> = {
  player: '選手',
  coach: 'コーチ',
  familyMember: '家族',
  family: '家庭',
};

/**
 * 家庭・選手・コーチ・家族の削除確認ダイアログ（共通）。
 * 各編集画面の「削除」ボタン押下時にのみ表示する。物理削除であることの重大さを伝えるため、
 * 対象名・取り消し不可の注記を含める（家庭を削除する場合のみ選手・コーチ・家族の道連れ削除も明記する）。
 * ref: docs/04_画面設計.md#10.4 家庭編集画面（削除確認ダイアログ）
 */
export function MasterDeleteDialog({
  open,
  targetType,
  targetName,
  processing,
  onCancel,
  onConfirm,
}: MasterDeleteDialogProps) {
  if (!open) {
    return null;
  }

  const label = targetLabel[targetType];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="master-delete-dialog-title"
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
          id="master-delete-dialog-title"
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
          「{targetName}」を削除しますか？
          {targetType === 'family' && (
            <>
              <br />
              所属する選手・コーチ・家族もすべて削除されます。
            </>
          )}
          <br />
          この操作は取り消せません。
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

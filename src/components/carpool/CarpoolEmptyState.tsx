import { Button } from '../common/Button';
import { CarIcon, EditIcon } from '../icons';

interface CarpoolEmptyStateProps {
  /** 「回答を入力する」ボタン押下時に呼び出す、イベント編集画面への遷移処理 */
  onEditAnswers: () => void;
}

/**
 * 配車画面（メイン）で、選択中タブ（行き／帰り）の回答が1件もない場合に表示する空状態。
 * 一部の家庭のみ未回答（配車自体は存在する）場合は対象外。
 */
export function CarpoolEmptyState({ onEditAnswers }: CarpoolEmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '36px 20px 28px',
        background: 'linear-gradient(180deg, var(--accent-bg), rgba(37, 99, 235, 0.02))',
        border: '1px dashed var(--accent-border)',
        borderRadius: '18px',
      }}
    >
      <div style={{ position: 'relative', width: '92px', height: '92px', marginBottom: '18px' }}>
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '42% 58% 55% 45% / 48% 45% 55% 52%',
            background: 'var(--accent-bg)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '22px',
            left: '18px',
            color: 'var(--accent)',
          }}
        >
          <CarIcon size={52} />
        </div>
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: '-2px',
            bottom: '4px',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 3px 8px rgba(37, 99, 235, 0.35), 0 0 0 3px var(--bg)',
            color: '#fff',
          }}
        >
          <EditIcon size={14} />
        </div>
      </div>

      <p style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 700, color: 'var(--text-h)' }}>
        まだ回答がありません
      </p>
      <p
        style={{
          margin: '0 0 20px',
          fontSize: '13px',
          lineHeight: 1.65,
          color: 'var(--text)',
          maxWidth: '240px',
        }}
      >
        参加人数や車出しの可否を入力すると、配車を作成できます。
      </p>

      <Button
        variant="primary"
        icon={<EditIcon size={16} />}
        onClick={onEditAnswers}
        style={{ width: '100%', maxWidth: '260px', boxShadow: '0 6px 16px rgba(37, 99, 235, 0.28)' }}
      >
        回答を入力する
      </Button>
    </div>
  );
}

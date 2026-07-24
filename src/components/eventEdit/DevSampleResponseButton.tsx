import { useState } from 'react';
import { generateSampleResponses } from '../../services/dev/seedSampleResponses';
import { Button } from '../common/Button';
import { CodeIcon } from '../icons';

interface DevSampleResponseButtonProps {
  /** 対象イベントID */
  eventId: string;
  /** サンプル回答生成完了後に呼び出される（画面表示の再取得に使用） */
  onGenerated?: () => void;
}

/**
 * イベント編集（回答入力）画面 開発用機能「サンプル回答生成」ボタン。
 * 開発環境（`import.meta.env.DEV`）でのみ表示する（04_画面設計.md#7 開発用機能）。
 * 押下時に確認ダイアログを表示し、実行が選択された場合のみ
 * 対象イベントの既存回答を削除したうえでランダムな回答を生成・登録する。
 */
export function DevSampleResponseButton({
  eventId,
  onGenerated,
}: DevSampleResponseButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(
    null
  );

  if (!import.meta.env.DEV) {
    return null;
  }

  const handleOpen = () => {
    setMessage(null);
    setDialogOpen(true);
  };

  const handleCancel = () => {
    setDialogOpen(false);
  };

  const handleExecute = async () => {
    setRunning(true);
    try {
      await generateSampleResponses(eventId);
      setMessage({ text: 'サンプル回答を生成しました', isError: false });
      onGenerated?.();
    } catch {
      setMessage({
        text: 'サンプル回答の生成に失敗しました',
        isError: true,
      });
    } finally {
      setDialogOpen(false);
      setRunning(false);
    }
  };

  return (
    <section
      id="dev-sample-response-section"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: '14px',
          color: 'var(--text)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <CodeIcon size={15} />
        開発用機能
      </h2>

      {message && (
        <p
          style={{
            margin: 0,
            fontSize: '13px',
            color: message.isError ? 'var(--negative)' : 'var(--text)',
          }}
        >
          {message.text}
        </p>
      )}

      <Button variant="danger" size="sm" onClick={handleOpen}>
        サンプル回答生成
      </Button>

      {dialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dev-sample-response-dialog-title"
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
              id="dev-sample-response-dialog-title"
              style={{ margin: 0, fontSize: '16px', color: 'var(--text-h)' }}
            >
              サンプル回答を生成
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                color: 'var(--text)',
                lineHeight: 1.6,
              }}
            >
              対象イベントの既存回答は削除されます。
              <br />
              サンプル回答を生成しますか？
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancel}
                disabled={running}
              >
                キャンセル
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleExecute}
                disabled={running}
              >
                {running ? '実行中...' : '実行'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

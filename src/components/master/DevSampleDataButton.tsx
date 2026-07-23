import { useState } from 'react';
import { seedSampleData } from '../../services/dev/seedSampleData';
import { CodeIcon } from '../icons';

interface DevSampleDataButtonProps {
  /** サンプルデータ投入完了後に呼び出される（画面表示の再取得に使用） */
  onSeeded?: () => void;
}

/**
 * マスタ管理画面 開発用機能「サンプルデータ投入」ボタン。
 * 開発環境（`import.meta.env.DEV`）でのみ表示する。
 * 押下時に確認ダイアログを表示し、実行が選択された場合のみ
 * 既存の集合場所・目的地・家庭・子供を全削除しサンプルデータを登録する。
 */
export function DevSampleDataButton({ onSeeded }: DevSampleDataButtonProps) {
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
      await seedSampleData();
      setMessage({ text: 'サンプルデータを投入しました', isError: false });
      onSeeded?.();
    } catch {
      setMessage({
        text: 'サンプルデータの投入に失敗しました',
        isError: true,
      });
    } finally {
      setDialogOpen(false);
      setRunning(false);
    }
  };

  return (
    <section
      id="dev-sample-data-section"
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

      <button
        type="button"
        onClick={handleOpen}
        style={{
          padding: '10px 20px',
          borderRadius: '6px',
          border: '1px solid var(--negative-border)',
          background: 'transparent',
          color: 'var(--negative)',
          fontSize: '14px',
          fontFamily: 'var(--sans)',
          cursor: 'pointer',
        }}
      >
        サンプルデータ投入
      </button>

      {dialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dev-sample-data-dialog-title"
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
              id="dev-sample-data-dialog-title"
              style={{ margin: 0, fontSize: '16px', color: 'var(--text-h)' }}
            >
              サンプルデータを投入
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                color: 'var(--text)',
                lineHeight: 1.6,
              }}
            >
              既存のデータはすべて削除されます。
              <br />
              サンプルデータを投入しますか？
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleCancel}
                disabled={running}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-h)',
                  fontSize: '14px',
                  fontFamily: 'var(--sans)',
                  cursor: running ? 'default' : 'pointer',
                  opacity: running ? 'var(--disabled-opacity)' : 1,
                }}
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleExecute}
                disabled={running}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--negative)',
                  color: '#fff',
                  fontSize: '14px',
                  fontFamily: 'var(--sans)',
                  cursor: running ? 'default' : 'pointer',
                  opacity: running ? 'var(--disabled-opacity)' : 1,
                }}
              >
                {running ? '実行中...' : '実行'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

import { useEffect, useState } from 'react';
import { CloseIcon, InfoIcon } from '../icons';

/** 自動整合トーストを自動的に消すまでの表示時間（ミリ秒） */
const AUTO_DISMISS_MS = 6000;

interface CarpoolReconcileToastProps {
  /** 表示する通知メッセージ。nullの場合は非表示 */
  message: string | null;
}

/**
 * 配車画面（メイン）の自動整合結果トースト。
 * ref: docs/04_画面設計.md#8 整合結果の通知（トースト）
 *
 * 画面を開いた際の自動整合（reconcileCarpools）が1件以上のCarpoolを
 * 作成・更新・削除した場合にのみ表示する。定員超過等の警告バナー
 * （CarpoolWarningPopup）とは異なり「対応が必要な問題」ではなく一時的な通知のため、
 * 一定時間で自動的に消える。閉じるボタンでも即座に非表示にできる。
 * メッセージ変化時の再表示は、呼び出し元がmessageをkeyに渡して再マウントさせることで実現する。
 */
export function CarpoolReconcileToast({ message }: CarpoolReconcileToastProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!message) {
      return;
    }
    const timer = setTimeout(() => setDismissed(true), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message || dismissed) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 12px',
        background: 'var(--bg)',
        border: '1px solid var(--accent-border)',
        borderLeft: '4px solid var(--accent)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow)',
        boxSizing: 'border-box',
        color: 'var(--accent)',
        pointerEvents: 'auto',
      }}
    >
      <InfoIcon size={14} />
      <p
        role="status"
        style={{
          margin: 0,
          flex: 1,
          fontSize: '13px',
          fontWeight: 700,
          lineHeight: 1.45,
          fontFamily: 'var(--sans)',
          color: 'var(--text-h)',
          whiteSpace: 'pre-line',
        }}
      >
        {message}
      </p>
      <button
        type="button"
        aria-label="閉じる"
        onClick={() => setDismissed(true)}
        style={{
          flexShrink: 0,
          width: '22px',
          height: '22px',
          padding: 0,
          border: 'none',
          background: 'transparent',
          color: 'var(--text)',
          opacity: 0.7,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '999px',
        }}
      >
        <CloseIcon size={14} />
      </button>
    </div>
  );
}

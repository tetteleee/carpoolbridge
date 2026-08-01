import { useState } from 'react';
import { CloseIcon, WarningIcon } from '../icons';

interface CarpoolWarningPopupProps {
  /** 表示する警告メッセージ。nullの場合は非表示 */
  message: string | null;
}

/**
 * 配車画面（メイン）の定員超過・未配車の警告表示。
 * ヘッダーには置かず、画面最下部に固定表示する（スクロール位置に関わらず追従しない）。
 * 閉じるボタンで一時的に非表示にできるが、メッセージが変わると再度表示される。
 * メッセージ変化時の再表示は、呼び出し元がmessageをkeyに渡して再マウントさせることで実現する。
 */
export function CarpoolWarningPopup({ message }: CarpoolWarningPopupProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!message || dismissed) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: '16px',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '480px',
        padding: '0 16px',
        boxSizing: 'border-box',
        zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 12px',
          background: 'var(--bg)',
          border: '1px solid var(--negative-border)',
          borderLeft: '4px solid var(--negative)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow)',
          boxSizing: 'border-box',
          color: 'var(--negative)',
          pointerEvents: 'auto',
        }}
      >
        <WarningIcon size={14} />
        <p
          role="alert"
          style={{
            margin: 0,
            flex: 1,
            fontSize: '13px',
            fontWeight: 700,
            lineHeight: 1.45,
            fontFamily: 'var(--sans)',
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
            color: 'var(--negative)',
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
    </div>
  );
}

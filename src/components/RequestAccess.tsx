import { useState } from 'react';
import { Button } from './common/Button';

interface RequestAccessProps {
  uid: string;
}

/**
 * 未登録ユーザー向けの利用申請画面コンポーネント。
 * UIDを表示し、コピーボタンでクリップボードへコピーできる。
 * Firestoreへのアクセスは行わない。
 */
export function RequestAccess({ uid }: RequestAccessProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // クリップボードAPIが使えない環境への fallback
      const textarea = document.createElement('textarea');
      textarea.value = uid;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      id="request-access-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100svh',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <div
        id="request-access-card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          width: '100%',
          maxWidth: '480px',
          padding: '40px 32px',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
          boxSizing: 'border-box',
        }}
      >
        <p
          id="request-access-app-name"
          style={{
            margin: 0,
            fontSize: '14px',
            color: 'var(--text)',
            letterSpacing: '0.05em',
          }}
        >
          配車アシスタント
        </p>

        <h1
          id="request-access-title"
          style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: 500,
            color: 'var(--text-h)',
            letterSpacing: '-0.5px',
          }}
        >
          利用申請
        </h1>

        <div
          id="request-access-uid-block"
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <p
            id="request-access-uid-label"
            style={{
              margin: 0,
              fontSize: '12px',
              color: 'var(--text)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            UID
          </p>
          <code
            id="request-access-uid-value"
            style={{
              display: 'block',
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'var(--code-bg)',
              fontSize: '13px',
              lineHeight: '1.5',
              color: 'var(--text-h)',
              wordBreak: 'break-all',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          >
            {uid}
          </code>
        </div>

        <Button
          id="request-access-copy-button"
          variant="primary"
          onClick={handleCopy}
          style={{ minWidth: '120px' }}
        >
          {copied ? 'コピーしました' : 'コピー'}
        </Button>
      </div>
    </div>
  );
}

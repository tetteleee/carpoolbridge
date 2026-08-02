import { useState } from 'react';
import { Button } from './common/Button';
import { Card } from './common/Card';
import { AppIcon, CheckIcon, CopyIcon } from './icons';

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
      <Card
        id="request-access-card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          width: '100%',
          maxWidth: '480px',
          padding: '40px 28px',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '999px',
            background: 'rgba(61, 90, 128, 0.08)',
          }}
        >
          <AppIcon size={34} />
        </span>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <p
            id="request-access-app-name"
            style={{
              margin: 0,
              fontSize: '13px',
              fontWeight: 600,
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
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--text-h)',
              letterSpacing: '0.01em',
            }}
          >
            利用申請
          </h1>
        </div>

        <p
          id="request-access-lead"
          style={{
            margin: 0,
            fontSize: '13.5px',
            lineHeight: '1.7',
            color: 'var(--text)',
            textAlign: 'center',
          }}
        >
          はじめてのご利用ですね。
          <br />
          下のコードを管理者に送ると、利用できるようになります。
        </p>

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
              fontWeight: 600,
              color: 'var(--text)',
              letterSpacing: '0.08em',
            }}
          >
            あなたの利用コード（UID）
          </p>
          <code
            id="request-access-uid-value"
            style={{
              display: 'block',
              width: '100%',
              padding: '14px 16px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
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
          icon={copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
          onClick={handleCopy}
          style={{ width: '100%' }}
        >
          {copied ? 'コピーしました' : 'コードをコピー'}
        </Button>

        <p
          id="request-access-guidance"
          style={{
            margin: 0,
            fontSize: '12.5px',
            lineHeight: '1.7',
            color: 'var(--text)',
            textAlign: 'center',
          }}
        >
          コピーしたコードをLINEなどで管理者に送ってください。
          <br />
          登録が完了したら、このページを開き直すと利用できます。
        </p>
      </Card>
    </div>
  );
}

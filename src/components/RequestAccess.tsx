import { useState, type CSSProperties } from 'react';
import { Button } from './common/Button';
import { AppIcon, CheckIcon, CopyIcon } from './icons';

interface RequestAccessProps {
  uid: string;
}

/** 案内の手順番号（丸数字）の共通スタイル */
const stepNumberStyle: CSSProperties = {
  flexShrink: 0,
  width: '18px',
  height: '18px',
  marginTop: '1px',
  borderRadius: '999px',
  background: 'var(--code-bg)',
  color: 'var(--text-h)',
  fontSize: '11px',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

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
        minHeight: '100svh',
        padding: '48px 24px 32px',
        boxSizing: 'border-box',
        background: 'var(--bg)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
        <span
          aria-hidden="true"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'var(--accent-bg)',
            flexShrink: 0,
          }}
        >
          <AppIcon size={20} />
        </span>
        <p
          id="request-access-app-name"
          style={{
            margin: 0,
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text)',
            letterSpacing: '0.04em',
          }}
        >
          配車アシスタント
        </p>
      </div>

      <h1
        id="request-access-title"
        style={{
          margin: '0 0 32px',
          fontSize: '28px',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          lineHeight: 1.25,
          color: 'var(--text-h)',
        }}
      >
        利用申請
      </h1>

      <div id="request-access-uid-block" style={{ width: '100%' }}>
        <p
          id="request-access-uid-label"
          style={{
            margin: '0 0 8px',
            fontSize: '11px',
            fontWeight: 700,
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
            padding: '16px',
            borderRadius: '14px',
            border: '1px solid var(--border)',
            background: 'var(--code-bg)',
            fontSize: '13px',
            lineHeight: '1.5',
            color: 'var(--text-h)',
            wordBreak: 'break-all',
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
        style={{ width: '100%', marginTop: '20px' }}
      >
        {copied ? 'コピーしました' : 'コピー'}
      </Button>

      <ol
        id="request-access-guidance"
        style={{
          listStyle: 'none',
          margin: 'auto 0 0',
          padding: '28px 0 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <li style={{ display: 'flex', gap: '10px', fontSize: '13px', lineHeight: 1.6, color: 'var(--text)' }}>
          <span style={stepNumberStyle}>1</span>
          コピーしたコードをLINEなどで管理者に送ってください
        </li>
        <li style={{ display: 'flex', gap: '10px', fontSize: '13px', lineHeight: 1.6, color: 'var(--text)' }}>
          <span style={stepNumberStyle}>2</span>
          登録が完了したら、このページを再読み込みしてください
        </li>
      </ol>
    </div>
  );
}

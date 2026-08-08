import { Header } from '../components/Header';

/**
 * プライバシーポリシー画面。
 * 公開版（Dexie/IndexedDB版）のGoogle Playストア掲載に必要な静的ページ。
 * データ取得・認証は行わない。
 * ref: docs/13_TWA・Google Play公開設計.md#6
 */
export function PrivacyPolicyPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--panel-bg)',
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
          boxSizing: 'border-box',
        }}
      >
        <Header title="プライバシーポリシー" backTo="/" />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          padding: '16px',
          boxSizing: 'border-box',
          fontSize: '14px',
          lineHeight: 1.7,
          color: 'var(--text)',
        }}
      >
        <p style={{ margin: 0 }}>
          本アプリ（配車アシスタント 公開版）における個人情報の取り扱いについて、以下のとおりお知らせします。
        </p>

        <section>
          <h2 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--text-h)' }}>
            取得する情報
          </h2>
          <p style={{ margin: 0 }}>
            取得する情報はありません。入力したデータ（選手・家庭・集合場所・配車結果など）は
            すべてお使いの端末のブラウザ内（IndexedDB）にのみ保存され、外部のサーバーへ
            送信されることはありません。
          </p>
        </section>

        <section>
          <h2 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--text-h)' }}>
            Cookie・アクセス解析
          </h2>
          <p style={{ margin: 0 }}>Cookieやアクセス解析ツールなどのトラッキングは使用していません。</p>
        </section>

        <section>
          <h2 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--text-h)' }}>
            第三者への提供
          </h2>
          <p style={{ margin: 0 }}>本アプリのデータを第三者へ提供することはありません。</p>
        </section>

        <section>
          <h2 style={{ margin: '0 0 8px', fontSize: '15px', color: 'var(--text-h)' }}>
            お問い合わせ
          </h2>
          <p style={{ margin: 0 }}>
            本アプリに関するお問い合わせは、
            <a
              href="https://github.com/tetteleee/carpoolbridge/issues"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)' }}
            >
              GitHubリポジトリのIssueページ
            </a>
            までお願いします。
          </p>
        </section>
      </div>
    </div>
  );
}

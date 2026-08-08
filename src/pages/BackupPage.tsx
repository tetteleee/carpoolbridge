import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { BackupImportConfirmDialog } from '../components/master/BackupImportConfirmDialog';
import { BackupIcon } from '../components/icons';
import { exportAllData, importAllData } from '../services/backup/backupService';
import { BACKUP_SCHEMA_VERSION, type BackupData } from '../types/backup';

/**
 * 公開版（端末内保存のみ）ビルドかどうか。
 * vite.config.tsの規約に合わせ、"public"で始まるmode名（本番のpublic・
 * 公開版E2Eのpublic-e2eを含む）をすべて公開版として扱う。
 * ref: docs/10_DexieRepository実装設計.md#2, #8
 */
const IS_PUBLIC_BUILD = import.meta.env.MODE.startsWith('public');

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** ダウンロードファイル名・画面表示用に "YYYYMMDD_HHmm" 形式の文字列を作る */
function formatTimestampForFileName(date: Date): string {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(
    date.getHours()
  )}${pad(date.getMinutes())}`;
}

/** 画面表示用に "YYYY-MM-DD HH:mm" 形式の文字列を作る */
function formatTimestampForDisplay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

/**
 * データのバックアップ画面。データの書き出し・読み込みを行う。
 * 公開版・自チーム版いずれにも表示する（`IS_PUBLIC_BUILD`で案内文・警告文を出し分ける）。
 * ref: docs/04_画面設計.md#10.5 データのバックアップ画面
 */
export function BackupPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);
  const [lastExportedAt, setLastExportedAt] = useState<Date | null>(null);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const [pendingImport, setPendingImport] = useState<{
    data: BackupData;
    fileName: string;
  } | null>(null);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    setMessage(null);
    try {
      const data = await exportAllData();
      const now = new Date();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `carpoolbridge_backup_${formatTimestampForFileName(now)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setLastExportedAt(now);
      setMessage({ text: 'バックアップを書き出しました', isError: false });
    } catch {
      setMessage({ text: '書き出しに失敗しました。もう一度お試しください。', isError: true });
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelected = async (file: File) => {
    setMessage(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as BackupData;
      if (parsed.schemaVersion !== BACKUP_SCHEMA_VERSION) {
        throw new Error('unsupported schemaVersion');
      }
      setPendingImport({ data: parsed, fileName: file.name });
    } catch {
      setMessage({
        text: 'このファイルは読み込めません（形式が正しくありません）',
        isError: true,
      });
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingImport) {
      return;
    }
    setImporting(true);
    try {
      await importAllData(pendingImport.data);
      navigate('/', { state: { message: 'データを読み込みました' } });
    } catch {
      setImporting(false);
      setPendingImport(null);
      setMessage({ text: '読み込みに失敗しました。もう一度お試しください。', isError: true });
    }
  };

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
        <Header title="データのバックアップ" backTo="/master" />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          padding: '16px',
          boxSizing: 'border-box',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '12.5px',
            lineHeight: 1.7,
            color: 'var(--text)',
            background: 'var(--accent-bg)',
            border: '1px solid var(--accent)',
            borderRadius: '12px',
            padding: '12px 14px',
          }}
        >
          {IS_PUBLIC_BUILD ? (
            <>
              このアプリのデータは<b>この端末にのみ</b>保存されています。機種変更・配車担当の交代・
              ブラウザのデータ消去に備えて、定期的なバックアップをおすすめします。
            </>
          ) : (
            <>
              このデータは<b>チーム全員で共有</b>されています。書き出したファイルは端末に保存されるだけで、
              チームのデータには影響しません。
            </>
          )}
        </p>

        {message && (
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              textAlign: 'center',
              color: message.isError ? 'var(--negative)' : 'var(--text-h)',
            }}
          >
            {message.text}
          </p>
        )}

        <Card style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: 'var(--text-h)' }}>
            📤 バックアップを書き出す
          </p>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text)', lineHeight: 1.65 }}>
            集合場所・目的地・家庭・選手・コーチ・家族・イベント・回答・配車結果など、すべてのデータを1つの
            ファイルに書き出します。
          </p>
          <Button
            variant="primary"
            icon={<BackupIcon size={16} />}
            onClick={handleExport}
            disabled={exporting}
            style={{ width: '100%' }}
          >
            {exporting ? '書き出し中...' : 'バックアップを書き出す'}
          </Button>
          <p style={{ margin: 0, fontSize: '11.5px', textAlign: 'center', color: 'var(--text)' }}>
            最終書き出し: {lastExportedAt ? formatTimestampForDisplay(lastExportedAt) : 'まだありません'}
          </p>
        </Card>

        <Card style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: 'var(--text-h)' }}>
            📥 バックアップを読み込む
            {!IS_PUBLIC_BUILD && (
              <span
                style={{
                  marginLeft: '6px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: 'var(--negative)',
                  background: 'var(--negative-bg)',
                  borderRadius: '6px',
                  padding: '2px 7px',
                  verticalAlign: 'middle',
                }}
              >
                要注意：チーム共有
              </span>
            )}
          </p>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text)', lineHeight: 1.65 }}>
            書き出したファイルから、データを復元します。
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) {
                void handleFileSelected(file);
              }
            }}
          />
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            style={{ width: '100%' }}
          >
            ファイルを選択
          </Button>
          <p
            style={{
              margin: 0,
              fontSize: '12px',
              lineHeight: 1.6,
              color: 'var(--negative)',
              background: 'var(--negative-bg, rgba(193, 57, 43, 0.06))',
              borderRadius: '8px',
              padding: '8px 10px',
            }}
          >
            {IS_PUBLIC_BUILD
              ? '⚠ 読み込むと、この端末に保存されている現在のデータがすべて削除され、ファイルの内容に置き換わります。'
              : '⚠ 読み込むと、チームの現在のデータがすべて削除され、ファイルの内容に置き換わります。他の利用者にも影響します。'}
          </p>
        </Card>
      </div>

      <BackupImportConfirmDialog
        open={pendingImport !== null}
        fileName={pendingImport?.fileName ?? ''}
        isPublicBuild={IS_PUBLIC_BUILD}
        processing={importing}
        onCancel={() => setPendingImport(null)}
        onConfirm={handleConfirmImport}
      />
    </div>
  );
}

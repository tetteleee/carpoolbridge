import { useRef, useState } from 'react';
import type { ReactNode, Ref } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../Header';
import { Button } from '../common/Button';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';

/**
 * 集合場所・目的地・家庭の各セクションが共通で実装するハンドル。
 * 実際の型（PickupLocationSectionHandle等）は構造的に一致するためそのまま渡せる。
 */
export interface MasterSectionHandle {
  /** 下書き内容をまとめてFirestoreへ反映する */
  save: () => Promise<void>;
  /** 保存済み内容と比べて未保存の編集・追加があるか */
  hasChanges: () => boolean;
}

interface MasterEditPageLayoutProps<Handle extends MasterSectionHandle> {
  /** ヘッダーに表示する画面タイトル（例: 「集合場所」） */
  title: string;
  /** 対象セクションコンポーネントを描画する。refは呼び出し側でsave/hasChangesの呼び出しに使う */
  renderSection: (props: { ref: Ref<Handle> }) => ReactNode;
}

/**
 * 集合場所・目的地・家庭の各編集画面で共通のページ構成。
 * ヘッダー（戻る・タイトル・保存ボタン）、保存後に同じ画面へ留まり最新データを再表示する挙動、
 * 未保存確認ダイアログをここに集約する。
 * ref: docs/04_画面設計.md#10 マスタ管理 共通仕様（集合場所・目的地・家庭編集画面）
 */
export function MasterEditPageLayout<Handle extends MasterSectionHandle>({
  title,
  renderSection,
}: MasterEditPageLayoutProps<Handle>) {
  const navigate = useNavigate();
  const sectionRef = useRef<Handle>(null);
  const [saving, setSaving] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const handleBackClick = () => {
    if (sectionRef.current?.hasChanges()) {
      setShowUnsavedDialog(true);
      return;
    }
    navigate('/master');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await sectionRef.current?.save();
      // 保存成功時はハブ画面へ遷移せず、最新データで再マウントして同じ画面に留まる
      setDataVersion((v) => v + 1);
    } catch {
      // 失敗時のエラーメッセージは各セクションコンポーネント内で表示済み
    } finally {
      setSaving(false);
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
        <Header
          title={title}
          backTo="/master"
          onBackClick={handleBackClick}
          trailing={
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          }
        />
      </div>

      <div key={dataVersion} style={{ display: 'contents' }}>
        {renderSection({ ref: sectionRef })}
      </div>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onCancel={() => setShowUnsavedDialog(false)}
        onConfirm={() => navigate('/master')}
      />
    </div>
  );
}

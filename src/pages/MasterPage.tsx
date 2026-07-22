import { useRef, useState } from 'react';
import {
  PickupLocationSection,
  type PickupLocationSectionHandle,
} from '../components/master/PickupLocationSection';
import {
  DestinationSection,
  type DestinationSectionHandle,
} from '../components/master/DestinationSection';
import {
  FamilySection,
  type FamilySectionHandle,
} from '../components/master/FamilySection';

/**
 * マスタ管理画面。
 * 集合場所・目的地・家庭の各セクションを縦積みで表示する。
 * 各セクションの編集・追加内容は下書きにとどめ、画面共通の保存ボタン押下時に
 * まとめてFirestoreへ反映する。保存前に画面を離脱すれば下書きは破棄される。
 */
export function MasterPage() {
  const pickupLocationRef = useRef<PickupLocationSectionHandle>(null);
  const destinationRef = useRef<DestinationSectionHandle>(null);
  const familyRef = useRef<FamilySectionHandle>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    const results = await Promise.allSettled([
      pickupLocationRef.current?.save(),
      destinationRef.current?.save(),
      familyRef.current?.save(),
    ]);
    setSaving(false);
    if (results.some((result) => result.status === 'rejected')) {
      setSaveError('一部の保存に失敗しました。内容を確認してください');
    }
  };

  return (
    <div
      id="master-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '480px',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      <h1
        style={{
          margin: 0,
          padding: '16px',
          fontSize: '20px',
          color: 'var(--text-h)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        マスタ管理
      </h1>

      <PickupLocationSection ref={pickupLocationRef} />
      <hr
        style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }}
      />
      <DestinationSection ref={destinationRef} />
      <hr
        style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }}
      />
      <FamilySection ref={familyRef} />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          padding: '16px',
        }}
      >
        {saveError && (
          <p style={{ margin: 0, fontSize: '13px', color: 'crimson' }}>
            {saveError}
          </p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 32px',
            borderRadius: '6px',
            border: 'none',
            background: 'var(--accent)',
            color: 'var(--accent-contrast, #fff)',
            fontSize: '16px',
            fontFamily: 'var(--sans)',
            cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}

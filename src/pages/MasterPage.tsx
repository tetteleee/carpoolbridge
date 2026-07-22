import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { DevSampleDataButton } from '../components/master/DevSampleDataButton';

/**
 * マスタ管理画面。
 * 集合場所・目的地・家庭の各セクションを縦積みで表示する。
 * 各セクションの編集・追加内容は下書きにとどめ、画面共通の保存ボタン押下時に
 * まとめてFirestoreへ反映する。保存前に画面を離脱すれば下書きは破棄される。
 */
export function MasterPage() {
  const navigate = useNavigate();
  const pickupLocationRef = useRef<PickupLocationSectionHandle>(null);
  const destinationRef = useRef<DestinationSectionHandle>(null);
  const familyRef = useRef<FamilySectionHandle>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState(0);

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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            background: 'none',
            color: 'var(--text)',
            fontSize: '14px',
            fontFamily: 'var(--sans)',
            cursor: 'pointer',
          }}
        >
          ← 戻る
        </button>
        <h1
          style={{
            margin: 0,
            fontSize: '20px',
            color: 'var(--text-h)',
          }}
        >
          マスタ管理
        </h1>
        <span style={{ width: '72px' }} />
      </div>

      <PickupLocationSection key={`pickup-${dataVersion}`} ref={pickupLocationRef} />
      <hr
        style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }}
      />
      <DestinationSection key={`destination-${dataVersion}`} ref={destinationRef} />
      <hr
        style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }}
      />
      <FamilySection key={`family-${dataVersion}`} ref={familyRef} />

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

      <hr
        style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }}
      />
      <DevSampleDataButton onSeeded={() => setDataVersion((v) => v + 1)} />
    </div>
  );
}

import { PickupLocationSection } from '../components/master/PickupLocationSection';
import { DestinationSection } from '../components/master/DestinationSection';
import { FamilySection } from '../components/master/FamilySection';

/**
 * マスタ管理画面。
 * 集合場所・目的地・家庭の各セクションを縦積みで表示する。
 */
export function MasterPage() {
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

      <PickupLocationSection />
      <hr
        style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }}
      />
      <DestinationSection />
      <hr
        style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }}
      />
      <FamilySection />
    </div>
  );
}

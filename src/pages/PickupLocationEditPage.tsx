import { MasterEditPageLayout } from '../components/master/MasterEditPageLayout';
import {
  PickupLocationSection,
  type PickupLocationSectionHandle,
} from '../components/master/PickupLocationSection';

/**
 * 集合場所編集画面。
 * ref: docs/04_画面設計.md#10 登録情報 10.2 集合場所編集画面
 */
export function PickupLocationEditPage() {
  return (
    <MasterEditPageLayout<PickupLocationSectionHandle>
      title="集合場所"
      renderSection={({ ref }) => <PickupLocationSection ref={ref} />}
    />
  );
}

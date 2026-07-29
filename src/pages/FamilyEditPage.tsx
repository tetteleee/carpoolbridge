import { MasterEditPageLayout } from '../components/master/MasterEditPageLayout';
import {
  FamilySection,
  type FamilySectionHandle,
} from '../components/master/FamilySection';

/**
 * 家庭編集画面（所属する選手を含む）。
 * ref: docs/04_画面設計.md#10 マスタ管理 10.4 家庭編集画面
 */
export function FamilyEditPage() {
  return (
    <MasterEditPageLayout<FamilySectionHandle>
      title="家庭"
      renderSection={({ ref }) => <FamilySection ref={ref} />}
    />
  );
}

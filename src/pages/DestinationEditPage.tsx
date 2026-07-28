import { MasterEditPageLayout } from '../components/master/MasterEditPageLayout';
import {
  DestinationSection,
  type DestinationSectionHandle,
} from '../components/master/DestinationSection';

/**
 * 目的地編集画面。
 * ref: docs/04_画面設計.md#10 マスタ管理 10.3 目的地編集画面
 */
export function DestinationEditPage() {
  return (
    <MasterEditPageLayout<DestinationSectionHandle>
      title="目的地"
      renderSection={({ ref }) => <DestinationSection ref={ref} />}
    />
  );
}

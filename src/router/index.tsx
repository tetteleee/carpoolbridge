import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadingIndicator } from '../components/icons';

const HomePage = lazy(() => import('../pages/HomePage').then((m) => ({ default: m.HomePage })));
const MasterPage = lazy(() =>
  import('../pages/MasterPage').then((m) => ({ default: m.MasterPage }))
);
const PickupLocationEditPage = lazy(() =>
  import('../pages/PickupLocationEditPage').then((m) => ({ default: m.PickupLocationEditPage }))
);
const DestinationEditPage = lazy(() =>
  import('../pages/DestinationEditPage').then((m) => ({ default: m.DestinationEditPage }))
);
const FamilyEditPage = lazy(() =>
  import('../pages/FamilyEditPage').then((m) => ({ default: m.FamilyEditPage }))
);
const BackupPage = lazy(() =>
  import('../pages/BackupPage').then((m) => ({ default: m.BackupPage }))
);
const EventCreatePage = lazy(() =>
  import('../pages/EventCreatePage').then((m) => ({ default: m.EventCreatePage }))
);
const EventEditPage = lazy(() =>
  import('../pages/EventEditPage').then((m) => ({ default: m.EventEditPage }))
);
const EventInfoEditPage = lazy(() =>
  import('../pages/EventInfoEditPage').then((m) => ({ default: m.EventInfoEditPage }))
);
const CarpoolPage = lazy(() =>
  import('../pages/CarpoolPage').then((m) => ({ default: m.CarpoolPage }))
);

/** ページ単位のコード分割チャンク読み込み中に表示するフォールバック（App.tsxの起動時ローディングと同じ見た目） */
function RouteLoadingFallback() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100svh',
        flexDirection: 'column',
      }}
    >
      <LoadingIndicator size={8} />
    </div>
  );
}

/**
 * 登録済みユーザー向けのルート定義。
 * AuthGuardの内側でレンダリングされるため、未登録ユーザーはここへ到達しない。
 *
 * 各画面はReact.lazyでページ単位のチャンクに分割する。スマホ専用・屋外利用が前提のアプリで、
 * 初回アクセス時に他画面分のコードまで読み込まないようにするため（全画面を1つの
 * バンドルにまとめると本番ビルドで約950KBになり、初期表示が遅くなる）。
 */
export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/master" element={<MasterPage />} />
        <Route path="/master/pickup-locations" element={<PickupLocationEditPage />} />
        <Route path="/master/destinations" element={<DestinationEditPage />} />
        <Route path="/master/families" element={<FamilyEditPage />} />
        <Route path="/master/backup" element={<BackupPage />} />
        <Route path="/events/new" element={<EventCreatePage />} />
        <Route path="/events/:eventId/edit" element={<EventEditPage />} />
        <Route path="/events/:eventId/edit-info" element={<EventInfoEditPage />} />
        <Route path="/events/:eventId/carpool" element={<CarpoolPage />} />
      </Routes>
    </Suspense>
  );
}

import { Routes, Route } from 'react-router-dom';
import { MasterPage } from '../pages/MasterPage';

/**
 * ホーム画面のプレースホルダー。
 * ホーム画面自体はT21で実装するため、それまでの仮表示とする。
 */
function HomePlaceholder() {
  return (
    <div
      id="home-placeholder"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100svh',
        flexDirection: 'column',
      }}
    >
      <p>ホーム画面</p>
    </div>
  );
}

/**
 * 登録済みユーザー向けのルート定義。
 * AuthGuardの内側でレンダリングされるため、未登録ユーザーはここへ到達しない。
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePlaceholder />} />
      <Route path="/master" element={<MasterPage />} />
    </Routes>
  );
}

import { Routes, Route } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { MasterPage } from '../pages/MasterPage';
import { EventCreatePage } from '../pages/EventCreatePage';

/**
 * 登録済みユーザー向けのルート定義。
 * AuthGuardの内側でレンダリングされるため、未登録ユーザーはここへ到達しない。
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/master" element={<MasterPage />} />
      <Route path="/events/new" element={<EventCreatePage />} />
    </Routes>
  );
}

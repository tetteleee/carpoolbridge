import { Routes, Route } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { MasterPage } from '../pages/MasterPage';
import { PickupLocationEditPage } from '../pages/PickupLocationEditPage';
import { DestinationEditPage } from '../pages/DestinationEditPage';
import { FamilyEditPage } from '../pages/FamilyEditPage';
import { EventCreatePage } from '../pages/EventCreatePage';
import { EventEditPage } from '../pages/EventEditPage';
import { EventInfoEditPage } from '../pages/EventInfoEditPage';
import { CarpoolPage } from '../pages/CarpoolPage';

/**
 * 登録済みユーザー向けのルート定義。
 * AuthGuardの内側でレンダリングされるため、未登録ユーザーはここへ到達しない。
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/master" element={<MasterPage />} />
      <Route path="/master/pickup-locations" element={<PickupLocationEditPage />} />
      <Route path="/master/destinations" element={<DestinationEditPage />} />
      <Route path="/master/families" element={<FamilyEditPage />} />
      <Route path="/events/new" element={<EventCreatePage />} />
      <Route path="/events/:eventId/edit" element={<EventEditPage />} />
      <Route path="/events/:eventId/edit-info" element={<EventInfoEditPage />} />
      <Route path="/events/:eventId/carpool" element={<CarpoolPage />} />
    </Routes>
  );
}

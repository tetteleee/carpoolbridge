import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CreateEventPage from "./pages/CreateEventPage";
import EventEditPage from "./pages/EventEditPage";
import DispatchPage from "./pages/DispatchPage";
import MasterPage from "./pages/MasterPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/events/new" element={<CreateEventPage />} />
        <Route path="/events/:id/edit" element={<EventEditPage />} />
        <Route path="/events/:id/carpool" element={<DispatchPage />} />
        <Route path="/master" element={<MasterPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

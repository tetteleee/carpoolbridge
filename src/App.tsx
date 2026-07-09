import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import EventEditPage from "./pages/EventEditPage";
import DispatchPage from "./pages/DispatchPage";
import MasterPage from "./pages/MasterPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/event/:id" element={<EventEditPage />} />
        <Route path="/event/:id/dispatch" element={<DispatchPage />} />
        <Route path="/master" element={<MasterPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

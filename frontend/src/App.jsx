import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { DemoBanner } from "./components/DemoBanner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { supabaseConfigured } from "./lib/supabase";
import Home        from "./pages/Home";
import Quest       from "./pages/Quest";
import Leaderboard from "./pages/Leaderboard";
import MapPage     from "./pages/Map";
import Upload      from "./pages/Upload";
import Impact      from "./pages/Impact";
import About       from "./pages/About";
import Admin       from "./pages/Admin";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      {!supabaseConfigured && <DemoBanner />}
      <ErrorBoundary>
      <main>
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/quest"       element={<Quest />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/map"         element={<MapPage />} />
          <Route path="/upload"      element={<Upload />} />
          <Route path="/impact"      element={<Impact />} />
          <Route path="/about"       element={<About />} />
          <Route path="/admin"       element={<Admin />} />
        </Routes>
      </main>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

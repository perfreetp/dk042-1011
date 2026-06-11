import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import Camp from '@/pages/Camp';
import Hut from '@/pages/Hut';
import MapPage from '@/pages/MapPage';
import Workshop from '@/pages/Workshop';
import Battle from '@/pages/Battle';
import Collection from '@/pages/Collection';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Navigate to="/camp" replace />} />
      <Route path="/camp" element={<Camp />} />
      <Route path="/hut" element={<Hut />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/workshop" element={<Workshop />} />
      <Route path="/battle" element={<Battle />} />
      <Route path="/collection" element={<Collection />} />
      <Route path="*" element={<Navigate to="/camp" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <div className="relative z-10 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <AnimatedRoutes />
        </main>
      </div>
    </Router>
  );
}

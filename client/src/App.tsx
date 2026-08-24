import { Routes, Route } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import ProjectDetail from './pages/ProjectDetail';
import Intake from './pages/Intake';
import Support from './pages/Support';
import MyWork from './pages/MyWork';
import Admin from './pages/Admin';
import ChangeBoard from './pages/ChangeBoard';
import ChangeDetail from './pages/ChangeDetail';
import ChangeCalendar from './pages/ChangeCalendar';

export default function App() {
  const { mode, toggle, paletteStyle } = useTheme();

  return (
    <div className="app" style={paletteStyle}>
      <AppLayout mode={mode} onToggleTheme={toggle}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/requests/new" element={<Intake />} />
          <Route path="/support" element={<Support />} />
          <Route path="/my-work" element={<MyWork />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/change" element={<ChangeBoard />} />
          <Route path="/change/:id" element={<ChangeDetail />} />
          <Route path="/change/calendar" element={<ChangeCalendar />} />
        </Routes>
      </AppLayout>
    </div>
  );
}

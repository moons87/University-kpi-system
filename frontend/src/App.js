import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import ProtectedRoute    from './components/ProtectedRoute';
import Layout            from './components/Layout';
import LoginPage         from './pages/LoginPage';
import DashboardPage     from './pages/DashboardPage';
import TeachersPage      from './pages/TeachersPage';
import TeacherProfilePage from './pages/TeacherProfilePage';
import TeachingLoadPage  from './pages/TeachingLoadPage';
import PublicationsPage  from './pages/PublicationsPage';
import PatentsPage       from './pages/PatentsPage';
import AchievementsPage  from './pages/AchievementsPage';
import ProjectsPage      from './pages/ProjectsPage';
import KPIPage           from './pages/KPIPage';
import ReportsPage       from './pages/ReportsPage';

const theme = createTheme({ palette: { primary: { main: '#1565c0' } } });

function AppLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/"                element={<AppLayout><DashboardPage /></AppLayout>} />
          <Route path="/teachers"        element={<AppLayout><TeachersPage /></AppLayout>} />
          <Route path="/teachers/:id"    element={<AppLayout><TeacherProfilePage /></AppLayout>} />
          <Route path="/teaching-load"   element={<AppLayout><TeachingLoadPage /></AppLayout>} />
          <Route path="/publications"    element={<AppLayout><PublicationsPage /></AppLayout>} />
          <Route path="/patents"         element={<AppLayout><PatentsPage /></AppLayout>} />
          <Route path="/achievements"    element={<AppLayout><AchievementsPage /></AppLayout>} />
          <Route path="/projects"        element={<AppLayout><ProjectsPage /></AppLayout>} />
          <Route path="/kpi"             element={<AppLayout><KPIPage /></AppLayout>} />
          <Route path="/reports"         element={<AppLayout><ReportsPage /></AppLayout>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

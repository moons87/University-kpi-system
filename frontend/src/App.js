import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import ProtectedRoute     from './components/ProtectedRoute';
import Layout             from './components/Layout';
import LoginPage          from './pages/LoginPage';
import DashboardPage      from './pages/DashboardPage';
import TeachersPage       from './pages/TeachersPage';
import TeacherProfilePage from './pages/TeacherProfilePage';
import TeachingLoadPage   from './pages/TeachingLoadPage';
import PublicationsPage   from './pages/PublicationsPage';
import PatentsPage        from './pages/PatentsPage';
import AchievementsPage   from './pages/AchievementsPage';
import ProjectsPage       from './pages/ProjectsPage';
import KPIPage            from './pages/KPIPage';
import ReportsPage        from './pages/ReportsPage';
import SettingsPage       from './pages/SettingsPage';
import StudentsPage       from './pages/StudentsPage';

const GOLD   = '#b07d2a';
const BORDER = '#e2e8f2';
const TEXT   = '#1a2540';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary:    { main: GOLD, contrastText: '#ffffff' },
    secondary:  { main: '#3b82f6' },
    background: { default: '#f4f6fb', paper: '#ffffff' },
    text:       { primary: TEXT, secondary: '#64748b' },
    divider:    BORDER,
    success:    { main: '#16a34a' },
    warning:    { main: '#d97706' },
    error:      { main: '#dc2626' },
    info:       { main: '#2563eb' },
  },
  typography: {
    fontFamily: '"Outfit", sans-serif',
    h5: { fontWeight: 600, letterSpacing: '0.01em', color: TEXT },
    h6: { fontWeight: 600, letterSpacing: '0.01em', color: TEXT },
    body1: { fontSize: '0.9rem' },
    body2: { fontSize: '0.8rem' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#f4f6fb' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderBottom: `1px solid ${BORDER}`,
          boxShadow: 'none',
          color: TEXT,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: `1px solid ${BORDER}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          border: `1px solid ${BORDER}`,
          boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        elevation1: { boxShadow: '0 1px 6px rgba(0,0,0,0.06)' },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          backgroundColor: GOLD,
          color: '#ffffff',
          fontWeight: 600,
          letterSpacing: '0.03em',
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: '#9a6d22',
            boxShadow: '0 2px 10px rgba(176,125,42,0.3)',
          },
          '&.Mui-disabled': { opacity: 0.5 },
        },
        outlined: {
          borderColor: BORDER,
          color: '#4a5878',
          '&:hover': { borderColor: GOLD, color: GOLD, backgroundColor: 'rgba(176,125,42,0.05)' },
        },
        text: {
          color: '#64748b',
          '&:hover': { color: TEXT, backgroundColor: 'rgba(0,0,0,0.04)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset':             { borderColor: BORDER },
            '&:hover fieldset':       { borderColor: '#b0bccc' },
            '&.Mui-focused fieldset': { borderColor: GOLD },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: GOLD },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: { color: '#94a3b8' },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { '&.Mui-focused': { color: GOLD } },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& fieldset':             { borderColor: BORDER },
          '&:hover fieldset':       { borderColor: '#b0bccc' },
          '&.Mui-focused fieldset': { borderColor: GOLD },
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: `1px solid ${BORDER}`,
          fontFamily: '"Outfit", sans-serif',
          fontSize: '0.875rem',
          backgroundColor: '#ffffff',
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontSize: '0.7rem',
            color: '#94a3b8',
          },
          '& .MuiDataGrid-columnHeaders':    { backgroundColor: '#f8fafc', borderBottom: `1px solid ${BORDER}` },
          '& .MuiDataGrid-row:hover':        { backgroundColor: '#faf9f5' },
          '& .MuiDataGrid-cell':             { borderColor: BORDER },
          '& .MuiDataGrid-footerContainer':  { borderColor: BORDER, backgroundColor: '#f8fafc' },
          '& .MuiDataGrid-selectedRowCount': { color: '#94a3b8' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontFamily: '"Outfit", sans-serif', fontSize: '0.75rem' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { fontFamily: '"Outfit", sans-serif', fontSize: '0.875rem' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          border: `1px solid ${BORDER}`,
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontFamily: '"Outfit", sans-serif', fontWeight: 600, color: TEXT },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root:      { borderBottom: `1px solid ${BORDER}` },
        indicator: { backgroundColor: GOLD, height: 2 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: '"Outfit", sans-serif',
          fontWeight: 500,
          textTransform: 'none',
          letterSpacing: '0.02em',
          color: '#94a3b8',
          '&.Mui-selected': { color: GOLD },
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: { padding: 0 },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: { borderRadius: 6 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontFamily: '"Outfit", sans-serif',
          fontSize: '0.78rem',
          backgroundColor: TEXT,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: BORDER },
      },
    },
  },
});

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
          <Route path="/login"            element={<LoginPage />} />
          <Route path="/"                 element={<AppLayout><DashboardPage /></AppLayout>} />
          <Route path="/teachers"         element={<AppLayout><TeachersPage /></AppLayout>} />
          <Route path="/teachers/:id"     element={<AppLayout><TeacherProfilePage /></AppLayout>} />
          <Route path="/students"         element={<AppLayout><StudentsPage /></AppLayout>} />
          <Route path="/teaching-load"    element={<AppLayout><TeachingLoadPage /></AppLayout>} />
          <Route path="/publications"     element={<AppLayout><PublicationsPage /></AppLayout>} />
          <Route path="/patents"          element={<AppLayout><PatentsPage /></AppLayout>} />
          <Route path="/achievements"     element={<AppLayout><AchievementsPage /></AppLayout>} />
          <Route path="/projects"         element={<AppLayout><ProjectsPage /></AppLayout>} />
          <Route path="/kpi"              element={<AppLayout><KPIPage /></AppLayout>} />
          <Route path="/reports"          element={<AppLayout><ReportsPage /></AppLayout>} />
          <Route path="/settings"         element={<AppLayout><SettingsPage /></AppLayout>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

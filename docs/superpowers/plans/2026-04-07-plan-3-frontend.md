# Frontend Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully working React + MUI dashboard that authenticates via JWT and displays all teacher data, activities, and KPI analytics.

**Architecture:** Create React App with MUI v5. Axios handles API calls with a JWT interceptor. Zustand manages global state. React Router v6 handles navigation. MUI X Charts renders KPI bar charts. Each page is a self-contained component; reusable UI elements live in `components/`.

**Tech Stack:** React 18, MUI v5, MUI X Charts, React Router v6, Axios, Zustand, Create React App

**Prerequisite:** Plan 2 complete — backend running at `http://localhost:8000`.

---

## File Map

```
frontend/
  package.json
  src/
    index.js                      — React entry point
    App.js                        — Router setup, protected routes
    api/
      client.js                   — Axios instance with JWT interceptor
      auth.js                     — login()
      teachers.js                 — getTeachers(), getTeacher(), createTeacher(), updateTeacher()
      departments.js              — getDepartments()
      teachingLoad.js             — getTeachingLoad(), createTeachingLoad(), deleteTeachingLoad()
      publications.js             — getPublications(), createPublication(), deletePublication()
      patents.js                  — getPatents(), createPatent(), deletePatent()
      achievements.js             — getAchievements(), createAchievement(), deleteAchievement()
      projects.js                 — getProjects(), createProject(), deleteProject()
      kpi.js                      — getKPIScores(), getKPISummary(), calculateKPI()
      timeDim.js                  — getTimeDim()
    store/
      authStore.js                — JWT token, user info, login/logout actions
      filterStore.js              — global period filter (year, semester, time_id)
    components/
      Layout.jsx                  — Sidebar + top bar wrapper
      Sidebar.jsx                 — Navigation drawer
      StatCard.jsx                — Metric card (label + number)
      KPIChart.jsx                — MUI X Charts bar chart
      PeriodSelector.jsx          — year/semester dropdown
      ProtectedRoute.jsx          — redirects to /login if not authenticated
    pages/
      LoginPage.jsx               — login form
      DashboardPage.jsx           — stat cards + KPI bar chart
      TeachersPage.jsx            — MUI DataGrid of teachers
      TeacherProfilePage.jsx      — teacher detail with tabs
      TeachingLoadPage.jsx        — teaching load table + add form
      PublicationsPage.jsx        — publications table + add form
      PatentsPage.jsx             — patents table + add form
      AchievementsPage.jsx        — achievements table + add form
      ProjectsPage.jsx            — projects table + add form
      KPIPage.jsx                 — KPI scores table + recalculate button
      ReportsPage.jsx             — export buttons (CSV download)
```

---

### Task 1: Create React app and install dependencies

**Files:**
- Create: `frontend/` (via CRA)

- [ ] **Step 1: Create the React app**

```bash
cd "c:/Users/Arlan Alimbay/Documents/univer kpi pj"
npx create-react-app frontend
cd frontend
```
Expected: React app scaffolded.

- [ ] **Step 2: Install dependencies**

```bash
npm install \
  @mui/material @mui/icons-material @emotion/react @emotion/styled \
  @mui/x-data-grid @mui/x-charts \
  react-router-dom axios zustand
```
Expected: packages installed, no peer dependency errors.

- [ ] **Step 3: Verify app runs**

```bash
npm start
```
Expected: browser opens `http://localhost:3000` with React logo.

- [ ] **Step 4: Remove CRA boilerplate**

Delete: `src/App.css`, `src/App.test.js`, `src/logo.svg`, `src/reportWebVitals.js`, `src/setupTests.js`

Replace `src/index.js`:
```js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
```

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): create React app and install dependencies"
```

---

### Task 2: Axios API client and auth store

**Files:**
- Create: `frontend/src/api/client.js`
- Create: `frontend/src/api/auth.js`
- Create: `frontend/src/store/authStore.js`

- [ ] **Step 1: Create src/api/client.js**

```js
import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:8000',
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
```

- [ ] **Step 2: Create src/api/auth.js**

```js
import client from './client';

export const login = (email, password) =>
  client.post('/auth/login', { email, password }).then((r) => r.data);
```

- [ ] **Step 3: Create src/store/authStore.js**

```js
import { create } from 'zustand';

const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  login: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null });
  },
}));

export default useAuthStore;
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/api/ frontend/src/store/
git commit -m "feat(frontend): add Axios client and auth store"
```

---

### Task 3: All API modules

**Files:**
- Create: `frontend/src/api/teachers.js`
- Create: `frontend/src/api/departments.js`
- Create: `frontend/src/api/teachingLoad.js`
- Create: `frontend/src/api/publications.js`
- Create: `frontend/src/api/patents.js`
- Create: `frontend/src/api/achievements.js`
- Create: `frontend/src/api/projects.js`
- Create: `frontend/src/api/kpi.js`
- Create: `frontend/src/api/timeDim.js`

- [ ] **Step 1: Create src/api/teachers.js**

```js
import client from './client';

export const getTeachers   = (params) => client.get('/teachers/', { params }).then(r => r.data);
export const getTeacher    = (id)     => client.get(`/teachers/${id}`).then(r => r.data);
export const createTeacher = (data)   => client.post('/teachers/', data).then(r => r.data);
export const updateTeacher = (id, data) => client.put(`/teachers/${id}`, data).then(r => r.data);
```

- [ ] **Step 2: Create src/api/departments.js**

```js
import client from './client';

export const getDepartments = () => client.get('/departments/').then(r => r.data);
```

- [ ] **Step 3: Create src/api/teachingLoad.js**

```js
import client from './client';

export const getTeachingLoad    = (params) => client.get('/teaching-load/', { params }).then(r => r.data);
export const createTeachingLoad = (data)   => client.post('/teaching-load/', data).then(r => r.data);
export const deleteTeachingLoad = (id)     => client.delete(`/teaching-load/${id}`);
```

- [ ] **Step 4: Create src/api/publications.js**

```js
import client from './client';

export const getPublications    = (params) => client.get('/publications/', { params }).then(r => r.data);
export const createPublication  = (data)   => client.post('/publications/', data).then(r => r.data);
export const deletePublication  = (id)     => client.delete(`/publications/${id}`);
```

- [ ] **Step 5: Create src/api/patents.js**

```js
import client from './client';

export const getPatents    = (params) => client.get('/patents/', { params }).then(r => r.data);
export const createPatent  = (data)   => client.post('/patents/', data).then(r => r.data);
export const deletePatent  = (id)     => client.delete(`/patents/${id}`);
```

- [ ] **Step 6: Create src/api/achievements.js**

```js
import client from './client';

export const getAchievements    = (params) => client.get('/achievements/', { params }).then(r => r.data);
export const createAchievement  = (data)   => client.post('/achievements/', data).then(r => r.data);
export const deleteAchievement  = (id)     => client.delete(`/achievements/${id}`);
```

- [ ] **Step 7: Create src/api/projects.js**

```js
import client from './client';

export const getProjects    = (params) => client.get('/projects/', { params }).then(r => r.data);
export const createProject  = (data)   => client.post('/projects/', data).then(r => r.data);
export const deleteProject  = (id)     => client.delete(`/projects/${id}`);
```

- [ ] **Step 8: Create src/api/kpi.js**

```js
import client from './client';

export const getKPIScores  = (params)          => client.get('/kpi/scores', { params }).then(r => r.data);
export const getKPISummary = (time_id)         => client.get('/kpi/summary', { params: { time_id } }).then(r => r.data);
export const calculateKPI  = (year, semester)  => client.post('/kpi/calculate', null, { params: { year, semester } }).then(r => r.data);
```

- [ ] **Step 9: Create src/api/timeDim.js**

```js
import client from './client';

export const getTimeDim = () => client.get('/time-dim/').then(r => r.data);
```

- [ ] **Step 10: Commit**

```bash
git add frontend/src/api/
git commit -m "feat(frontend): add all API modules"
```

---

### Task 4: Zustand filter store and layout components

**Files:**
- Create: `frontend/src/store/filterStore.js`
- Create: `frontend/src/components/ProtectedRoute.jsx`
- Create: `frontend/src/components/Sidebar.jsx`
- Create: `frontend/src/components/Layout.jsx`
- Create: `frontend/src/components/PeriodSelector.jsx`
- Create: `frontend/src/components/StatCard.jsx`

- [ ] **Step 1: Create src/store/filterStore.js**

```js
import { create } from 'zustand';

const useFilterStore = create((set) => ({
  timeId:   null,
  year:     2024,
  semester: 1,
  setFilter: (timeId, year, semester) => set({ timeId, year, semester }),
}));

export default useFilterStore;
```

- [ ] **Step 2: Create src/components/ProtectedRoute.jsx**

```jsx
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
}
```

- [ ] **Step 3: Create src/components/Sidebar.jsx**

```jsx
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import DashboardIcon    from '@mui/icons-material/Dashboard';
import PeopleIcon       from '@mui/icons-material/People';
import SchoolIcon       from '@mui/icons-material/School';
import ArticleIcon      from '@mui/icons-material/Article';
import EmojiEventsIcon  from '@mui/icons-material/EmojiEvents';
import BuildIcon        from '@mui/icons-material/Build';
import AssignmentIcon   from '@mui/icons-material/Assignment';
import BarChartIcon     from '@mui/icons-material/BarChart';
import DownloadIcon     from '@mui/icons-material/Download';
import { useNavigate }  from 'react-router-dom';

const DRAWER_WIDTH = 220;

const NAV = [
  { label: 'Dashboard',     icon: <DashboardIcon />,   path: '/' },
  { label: 'Teachers',      icon: <PeopleIcon />,      path: '/teachers' },
  { label: 'Teaching Load', icon: <SchoolIcon />,      path: '/teaching-load' },
  { label: 'Publications',  icon: <ArticleIcon />,     path: '/publications' },
  { label: 'Patents',       icon: <BuildIcon />,       path: '/patents' },
  { label: 'Achievements',  icon: <EmojiEventsIcon />, path: '/achievements' },
  { label: 'Projects',      icon: <AssignmentIcon />,  path: '/projects' },
  { label: 'KPI',           icon: <BarChartIcon />,    path: '/kpi' },
  { label: 'Reports',       icon: <DownloadIcon />,    path: '/reports' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  return (
    <Drawer variant="permanent" sx={{ width: DRAWER_WIDTH, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}>
      <Toolbar />
      <List>
        {NAV.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton onClick={() => navigate(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
```

- [ ] **Step 4: Create src/components/Layout.jsx**

```jsx
import { Box, AppBar, Toolbar, Typography, Button } from '@mui/material';
import Sidebar from './Sidebar';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function Layout({ children }) {
  const logout   = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6">University Analytics</Typography>
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {children}
      </Box>
    </Box>
  );
}
```

- [ ] **Step 5: Create src/components/PeriodSelector.jsx**

```jsx
import { FormControl, InputLabel, Select, MenuItem, Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import { getTimeDim } from '../api/timeDim';
import useFilterStore from '../store/filterStore';

export default function PeriodSelector() {
  const [periods, setPeriods] = useState([]);
  const { timeId, setFilter } = useFilterStore();

  useEffect(() => {
    getTimeDim().then(setPeriods).catch(console.error);
  }, []);

  const handleChange = (e) => {
    const selected = periods.find((p) => p.id === e.target.value);
    if (selected) setFilter(selected.id, selected.year, selected.semester);
  };

  return (
    <FormControl size="small" sx={{ minWidth: 200 }}>
      <InputLabel>Period</InputLabel>
      <Select value={timeId || ''} label="Period" onChange={handleChange}>
        {periods.map((p) => (
          <MenuItem key={p.id} value={p.id}>
            {p.year} — Semester {p.semester}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
```

- [ ] **Step 6: Create src/components/StatCard.jsx**

```jsx
import { Card, CardContent, Typography } from '@mui/material';

export default function StatCard({ label, value, color = 'primary.main' }) {
  return (
    <Card sx={{ minWidth: 160 }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h4" color={color} sx={{ mt: 1 }}>{value}</Typography>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/store/ frontend/src/components/
git commit -m "feat(frontend): add layout components and filter store"
```

---

### Task 5: Login page and App router

**Files:**
- Create: `frontend/src/pages/LoginPage.jsx`
- Create: `frontend/src/App.js`

- [ ] **Step 1: Create src/pages/LoginPage.jsx**

```jsx
import { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import useAuthStore from '../store/authStore';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const doLogin  = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { access_token } = await login(email, password);
      doLogin(access_token);
      navigate('/');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'grey.100' }}>
      <Card sx={{ width: 380 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" mb={3} textAlign="center">University Analytics</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Email"    value={email}    onChange={(e) => setEmail(e.target.value)}    sx={{ mb: 2 }} type="email"    required />
            <TextField fullWidth label="Password" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 3 }} type="password" required />
            <Button fullWidth variant="contained" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
```

- [ ] **Step 2: Create src/App.js**

```jsx
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
```

- [ ] **Step 3: Verify app compiles**

```bash
cd frontend && npm start
```
Open `http://localhost:3000` — should redirect to `/login`.  
Expected: login form visible.

- [ ] **Step 4: Test login**

Enter `admin@uni.kz` / `admin123` → should navigate to `/` (Dashboard).  
Expected: Layout with sidebar visible.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/
git commit -m "feat(frontend): add login page and router"
```

---

### Task 6: Dashboard page with KPI chart

**Files:**
- Create: `frontend/src/components/KPIChart.jsx`
- Create: `frontend/src/pages/DashboardPage.jsx`

- [ ] **Step 1: Create src/components/KPIChart.jsx**

```jsx
import { BarChart } from '@mui/x-charts/BarChart';
import { Box, Typography } from '@mui/material';

export default function KPIChart({ data }) {
  // data: [{ teacher_name, total_score }]
  if (!data || data.length === 0) return <Typography color="text.secondary">No KPI data for selected period.</Typography>;

  return (
    <Box sx={{ width: '100%', height: 350 }}>
      <BarChart
        dataset={data.map((d) => ({ name: d.teacher_name, score: Number(d.total_score) || 0 }))}
        xAxis={[{ scaleType: 'band', dataKey: 'name' }]}
        series={[{ dataKey: 'score', label: 'KPI Score', color: '#1565c0' }]}
        height={350}
      />
    </Box>
  );
}
```

- [ ] **Step 2: Create src/pages/DashboardPage.jsx**

```jsx
import { useEffect, useState } from 'react';
import { Box, Grid, Typography, Stack } from '@mui/material';
import StatCard        from '../components/StatCard';
import KPIChart        from '../components/KPIChart';
import PeriodSelector  from '../components/PeriodSelector';
import useFilterStore  from '../store/filterStore';
import { getKPISummary } from '../api/kpi';
import { getTeachers }   from '../api/teachers';
import { getDepartments } from '../api/departments';

export default function DashboardPage() {
  const { timeId } = useFilterStore();
  const [summary,     setSummary]     = useState(null);
  const [teacherCount, setTeacherCount] = useState(0);
  const [deptCount,   setDeptCount]   = useState(0);

  useEffect(() => {
    getTeachers().then((d) => setTeacherCount(d.length)).catch(() => {});
    getDepartments().then((d) => setDeptCount(d.length)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!timeId) return;
    getKPISummary(timeId).then(setSummary).catch(() => setSummary(null));
  }, [timeId]);

  const topScore = summary?.teachers?.[0]?.total_score ?? '—';
  const avgScore = summary?.teachers?.length
    ? (summary.teachers.reduce((s, t) => s + Number(t.total_score || 0), 0) / summary.teachers.length).toFixed(1)
    : '—';

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Dashboard</Typography>
        <PeriodSelector />
      </Stack>

      <Grid container spacing={2} mb={4}>
        <Grid item><StatCard label="Teachers"    value={teacherCount} /></Grid>
        <Grid item><StatCard label="Departments" value={deptCount} /></Grid>
        <Grid item><StatCard label="Top KPI"     value={topScore} color="success.main" /></Grid>
        <Grid item><StatCard label="Avg KPI"     value={avgScore} color="warning.main" /></Grid>
      </Grid>

      <Typography variant="h6" mb={2}>KPI by Teacher</Typography>
      <KPIChart data={summary?.teachers || []} />
    </Box>
  );
}
```

- [ ] **Step 3: Verify dashboard**

Navigate to `/` after login. Select a period from the dropdown.  
Expected: stat cards show counts; bar chart shows KPI scores for 5 teachers.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/
git commit -m "feat(frontend): add Dashboard with KPI chart"
```

---

### Task 7: Teachers pages

**Files:**
- Create: `frontend/src/pages/TeachersPage.jsx`
- Create: `frontend/src/pages/TeacherProfilePage.jsx`

- [ ] **Step 1: Create src/pages/TeachersPage.jsx**

```jsx
import { useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { getTeachers } from '../api/teachers';

const COLUMNS = [
  { field: 'id',        headerName: 'ID',         width: 60 },
  { field: 'full_name', headerName: 'Name',        flex: 1 },
  { field: 'email',     headerName: 'Email',       flex: 1 },
];

export default function TeachersPage() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getTeachers().then(setRows).finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Typography variant="h5" mb={2}>Teachers</Typography>
      <DataGrid
        rows={rows}
        columns={[
          ...COLUMNS,
          {
            field: 'actions',
            headerName: '',
            width: 100,
            renderCell: (p) => (
              <Button size="small" onClick={() => navigate(`/teachers/${p.row.id}`)}>View</Button>
            ),
          },
        ]}
        loading={loading}
        autoHeight
        pageSizeOptions={[10, 25]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      />
    </Box>
  );
}
```

- [ ] **Step 2: Create src/pages/TeacherProfilePage.jsx**

```jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Tabs, Tab, Chip, Stack } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { getTeacher } from '../api/teachers';
import { getPublications } from '../api/publications';
import { getProjects }     from '../api/projects';
import { getKPIScores }    from '../api/kpi';

function TabPanel({ value, index, children }) {
  return value === index ? <Box mt={2}>{children}</Box> : null;
}

export default function TeacherProfilePage() {
  const { id }    = useParams();
  const [teacher,      setTeacher]      = useState(null);
  const [publications, setPublications] = useState([]);
  const [projects,     setProjects]     = useState([]);
  const [kpiScores,    setKpiScores]    = useState([]);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    getTeacher(id).then(setTeacher);
    getPublications({ teacher_id: id }).then(setPublications);
    getProjects({ teacher_id: id }).then(setProjects);
    getKPIScores({ teacher_id: id }).then(setKpiScores);
  }, [id]);

  if (!teacher) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h5" mb={1}>{teacher.full_name}</Typography>
      <Stack direction="row" spacing={1} mb={3}>
        {teacher.position   && <Chip label={teacher.position?.name}   />}
        {teacher.degree     && <Chip label={teacher.degree?.name}     color="primary" />}
        {teacher.department && <Chip label={teacher.department?.name} color="secondary" />}
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Publications" />
        <Tab label="Projects" />
        <Tab label="KPI History" />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <DataGrid rows={publications} columns={[
          { field: 'title',    headerName: 'Title',    flex: 2 },
          { field: 'type',     headerName: 'Type',     width: 100 },
          { field: 'quartile', headerName: 'Quartile', width: 100 },
        ]} autoHeight pageSizeOptions={[10]} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} />
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <DataGrid rows={projects} columns={[
          { field: 'title',          headerName: 'Title',          flex: 2 },
          { field: 'funding_source', headerName: 'Funding Source', flex: 1 },
          { field: 'budget',         headerName: 'Budget',         width: 130 },
        ]} autoHeight pageSizeOptions={[10]} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} />
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <DataGrid rows={kpiScores} columns={[
          { field: 'time_id',           headerName: 'Period',      width: 100 },
          { field: 'teaching_score',    headerName: 'Teaching',    width: 110 },
          { field: 'research_score',    headerName: 'Research',    width: 110 },
          { field: 'project_score',     headerName: 'Projects',    width: 110 },
          { field: 'achievement_score', headerName: 'Achievements', width: 130 },
          { field: 'total_score',       headerName: 'Total',       width: 100 },
        ]} autoHeight pageSizeOptions={[10]} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} />
      </TabPanel>
    </Box>
  );
}
```

- [ ] **Step 3: Verify**

Navigate to `/teachers` — expected: DataGrid with 5 rows.  
Click "View" on any teacher — expected: profile page with tabs.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/
git commit -m "feat(frontend): add Teachers and Teacher Profile pages"
```

---

### Task 8: Activity pages (Teaching Load, Publications, Patents, Achievements, Projects)

**Files:**
- Create: `frontend/src/pages/TeachingLoadPage.jsx`
- Create: `frontend/src/pages/PublicationsPage.jsx`
- Create: `frontend/src/pages/PatentsPage.jsx`
- Create: `frontend/src/pages/AchievementsPage.jsx`
- Create: `frontend/src/pages/ProjectsPage.jsx`

- [ ] **Step 1: Create src/pages/TeachingLoadPage.jsx**

```jsx
import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import PeriodSelector from '../components/PeriodSelector';
import { Stack } from '@mui/material';
import { getTeachingLoad } from '../api/teachingLoad';
import useFilterStore from '../store/filterStore';

export default function TeachingLoadPage() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const { timeId } = useFilterStore();

  useEffect(() => {
    const params = timeId ? { time_id: timeId } : {};
    getTeachingLoad(params).then(setRows).finally(() => setLoading(false));
  }, [timeId]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Teaching Load</Typography>
        <PeriodSelector />
      </Stack>
      <DataGrid
        rows={rows}
        columns={[
          { field: 'teacher_id', headerName: 'Teacher ID', width: 110 },
          { field: 'subject_id', headerName: 'Subject ID', width: 110 },
          { field: 'group_id',   headerName: 'Group ID',   width: 100 },
          { field: 'time_id',    headerName: 'Period ID',  width: 100 },
          { field: 'hours',      headerName: 'Hours',      width: 90 },
        ]}
        loading={loading}
        autoHeight
        pageSizeOptions={[10, 25]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      />
    </Box>
  );
}
```

- [ ] **Step 2: Create src/pages/PublicationsPage.jsx**

```jsx
import { useEffect, useState } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import PeriodSelector from '../components/PeriodSelector';
import { getPublications } from '../api/publications';
import useFilterStore from '../store/filterStore';

export default function PublicationsPage() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const { timeId } = useFilterStore();

  useEffect(() => {
    const params = timeId ? { time_id: timeId } : {};
    getPublications(params).then(setRows).finally(() => setLoading(false));
  }, [timeId]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Publications</Typography>
        <PeriodSelector />
      </Stack>
      <DataGrid
        rows={rows}
        columns={[
          { field: 'teacher_id', headerName: 'Teacher', width: 100 },
          { field: 'title',      headerName: 'Title',   flex: 2 },
          { field: 'type',       headerName: 'Type',    width: 100 },
          { field: 'quartile',   headerName: 'Quartile', width: 100 },
        ]}
        loading={loading}
        autoHeight
        pageSizeOptions={[10, 25]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      />
    </Box>
  );
}
```

- [ ] **Step 3: Create src/pages/PatentsPage.jsx**

```jsx
import { useEffect, useState } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import PeriodSelector from '../components/PeriodSelector';
import { getPatents } from '../api/patents';
import useFilterStore from '../store/filterStore';

export default function PatentsPage() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const { timeId } = useFilterStore();

  useEffect(() => {
    const params = timeId ? { time_id: timeId } : {};
    getPatents(params).then(setRows).finally(() => setLoading(false));
  }, [timeId]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Patents</Typography>
        <PeriodSelector />
      </Stack>
      <DataGrid
        rows={rows}
        columns={[
          { field: 'teacher_id',          headerName: 'Teacher',             width: 100 },
          { field: 'title',               headerName: 'Title',               flex: 2 },
          { field: 'registration_number', headerName: 'Registration Number', flex: 1 },
        ]}
        loading={loading}
        autoHeight
        pageSizeOptions={[10, 25]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      />
    </Box>
  );
}
```

- [ ] **Step 4: Create src/pages/AchievementsPage.jsx**

```jsx
import { useEffect, useState } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import PeriodSelector from '../components/PeriodSelector';
import { getAchievements } from '../api/achievements';
import useFilterStore from '../store/filterStore';

export default function AchievementsPage() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const { timeId } = useFilterStore();

  useEffect(() => {
    const params = timeId ? { time_id: timeId } : {};
    getAchievements(params).then(setRows).finally(() => setLoading(false));
  }, [timeId]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Achievements</Typography>
        <PeriodSelector />
      </Stack>
      <DataGrid
        rows={rows}
        columns={[
          { field: 'teacher_id', headerName: 'Teacher', width: 100 },
          { field: 'title',      headerName: 'Title',   flex: 2 },
          { field: 'level',      headerName: 'Level',   width: 140 },
        ]}
        loading={loading}
        autoHeight
        pageSizeOptions={[10, 25]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      />
    </Box>
  );
}
```

- [ ] **Step 5: Create src/pages/ProjectsPage.jsx**

```jsx
import { useEffect, useState } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import PeriodSelector from '../components/PeriodSelector';
import { getProjects } from '../api/projects';
import useFilterStore from '../store/filterStore';

export default function ProjectsPage() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const { timeId } = useFilterStore();

  useEffect(() => {
    const params = timeId ? { time_id: timeId } : {};
    getProjects(params).then(setRows).finally(() => setLoading(false));
  }, [timeId]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Projects</Typography>
        <PeriodSelector />
      </Stack>
      <DataGrid
        rows={rows}
        columns={[
          { field: 'teacher_id',     headerName: 'Teacher',        width: 100 },
          { field: 'title',          headerName: 'Title',          flex: 2 },
          { field: 'funding_source', headerName: 'Funding Source', flex: 1 },
          { field: 'budget',         headerName: 'Budget',         width: 130 },
          { field: 'start_date',     headerName: 'Start',          width: 110 },
          { field: 'end_date',       headerName: 'End',            width: 110 },
        ]}
        loading={loading}
        autoHeight
        pageSizeOptions={[10, 25]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      />
    </Box>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/
git commit -m "feat(frontend): add activity pages (teaching load, publications, patents, achievements, projects)"
```

---

### Task 9: KPI page and Reports page

**Files:**
- Create: `frontend/src/pages/KPIPage.jsx`
- Create: `frontend/src/pages/ReportsPage.jsx`

- [ ] **Step 1: Create src/pages/KPIPage.jsx**

```jsx
import { useEffect, useState } from 'react';
import { Box, Typography, Stack, Button, Alert } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import PeriodSelector from '../components/PeriodSelector';
import { getKPIScores, calculateKPI } from '../api/kpi';
import useFilterStore from '../store/filterStore';

export default function KPIPage() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const { timeId, year, semester } = useFilterStore();

  const load = () => {
    const params = timeId ? { time_id: timeId } : {};
    getKPIScores(params).then(setRows).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [timeId]);

  const handleCalculate = async () => {
    setMessage('');
    try {
      const result = await calculateKPI(year, semester);
      setMessage(`Calculated for ${result.calculated} teachers.`);
      load();
    } catch {
      setMessage('Error during calculation.');
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">KPI Scores</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <PeriodSelector />
          <Button variant="contained" onClick={handleCalculate}>Recalculate KPI</Button>
        </Stack>
      </Stack>
      {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}
      <DataGrid
        rows={rows}
        columns={[
          { field: 'teacher_id',        headerName: 'Teacher',      width: 100 },
          { field: 'teaching_score',    headerName: 'Teaching',     width: 110 },
          { field: 'research_score',    headerName: 'Research',     width: 110 },
          { field: 'project_score',     headerName: 'Projects',     width: 110 },
          { field: 'achievement_score', headerName: 'Achievements', width: 130 },
          { field: 'total_score',       headerName: 'Total',        width: 100 },
        ]}
        loading={loading}
        autoHeight
        pageSizeOptions={[10, 25]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      />
    </Box>
  );
}
```

- [ ] **Step 2: Create src/pages/ReportsPage.jsx**

```jsx
import { Box, Typography, Stack, Button, Card, CardContent } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import client from '../api/client';
import useFilterStore from '../store/filterStore';

async function downloadFile(url, filename) {
  const response = await client.get(url, { responseType: 'blob' });
  const href = URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}

export default function ReportsPage() {
  const { year, semester } = useFilterStore();

  return (
    <Box>
      <Typography variant="h5" mb={3}>Reports & Exports</Typography>
      <Stack spacing={2}>
        <Card sx={{ maxWidth: 500 }}>
          <CardContent>
            <Typography variant="h6" mb={1}>KPI Summary Export</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Download KPI scores for all teachers for the selected period as CSV.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => downloadFile(`/kpi/scores?format=csv`, `kpi_${year}_s${semester}.csv`)}
            >
              Download CSV
            </Button>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
```

- [ ] **Step 3: Verify KPI page**

Navigate to `/kpi`, select a period, click "Recalculate KPI".  
Expected: alert shows "Calculated for 5 teachers." and table updates.

- [ ] **Step 4: Final commit**

```bash
git add frontend/src/pages/
git commit -m "feat(frontend): add KPI and Reports pages — frontend complete"
```

---

## Layer Complete

**Readiness check:** Frontend layer is done when:
- [ ] `npm start` runs without errors
- [ ] Login with `admin@uni.kz` / `admin123` works
- [ ] Dashboard shows stat cards and KPI bar chart (after selecting period)
- [ ] Teachers DataGrid shows 5 rows; profile page shows tabs
- [ ] KPI page recalculate button works
- [ ] All sidebar navigation links load correct pages

**Next:** Plan 4 — ETL Pipeline (Pandas + CSV export)

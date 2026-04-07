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

import { Drawer, Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material';
import DashboardIcon   from '@mui/icons-material/Dashboard';
import PeopleIcon      from '@mui/icons-material/People';
import SchoolIcon      from '@mui/icons-material/School';
import ArticleIcon     from '@mui/icons-material/Article';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BuildIcon       from '@mui/icons-material/Build';
import AssignmentIcon  from '@mui/icons-material/Assignment';
import BarChartIcon    from '@mui/icons-material/BarChart';
import DownloadIcon    from '@mui/icons-material/Download';
import SettingsIcon    from '@mui/icons-material/Settings';
import GroupsIcon      from '@mui/icons-material/Groups';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const NAV = [
  { label: 'Dashboard',     icon: DashboardIcon,   path: '/',               group: 'overview' },
  { label: 'Преподаватели', icon: PeopleIcon,       path: '/teachers',       group: 'data' },
  { label: 'Студенты',     icon: GroupsIcon,       path: '/students',       group: 'data', advisorVisible: true },
  { label: 'Нагрузка',      icon: SchoolIcon,       path: '/teaching-load',  group: 'data' },
  { label: 'Публикации',    icon: ArticleIcon,      path: '/publications',   group: 'data' },
  { label: 'Патенты',       icon: BuildIcon,        path: '/patents',        group: 'data' },
  { label: 'Достижения',    icon: EmojiEventsIcon,  path: '/achievements',   group: 'data' },
  { label: 'Проекты',       icon: AssignmentIcon,   path: '/projects',       group: 'data' },
  { label: 'KPI',           icon: BarChartIcon,     path: '/kpi',            group: 'analytics' },
  { label: 'Отчёты',        icon: DownloadIcon,     path: '/reports',        group: 'analytics', adminOnly: true },
  { label: 'Настройки',     icon: SettingsIcon,     path: '/settings',       group: 'system',    adminOnly: true },
];

const GROUP_LABELS = {
  overview:  null,
  data:      'Данные',
  analytics: 'Аналитика',
  system:    'Система',
};

export default function Sidebar({ drawerWidth = 240, appBarHeight = 56 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user     = useAuthStore((s) => s.user);

  const visible = NAV.filter((item) => {
    if (item.adminOnly    && user?.role !== 'admin')                              return false;
    if (item.advisorVisible && user?.role !== 'admin' && user?.role !== 'advisor') return false;
    return true;
  });

  const groups = [];
  let lastGroup = null;
  for (const item of visible) {
    if (item.group !== lastGroup) {
      groups.push({ type: 'label', group: item.group, key: `lbl-${item.group}` });
      lastGroup = item.group;
    }
    groups.push({ type: 'item', ...item });
  }

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Toolbar sx={{ minHeight: `${appBarHeight}px !important` }} />

      <Box sx={{ borderBottom: '1px solid #e2e8f2', mx: 2, mb: 1 }} />

      <Box sx={{ overflowY: 'auto', overflowX: 'hidden', flexGrow: 1, py: 1 }}>
        <List disablePadding>
          {groups.map((entry) => {
            if (entry.type === 'label') {
              const label = GROUP_LABELS[entry.group];
              if (!label) return null;
              return (
                <Typography
                  key={entry.key}
                  sx={{
                    px: 2.5,
                    pt: 2,
                    pb: 0.5,
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#c8d0e0',
                    fontFamily: '"Outfit", sans-serif',
                  }}
                >
                  {label}
                </Typography>
              );
            }

            const Icon   = entry.icon;
            const active = isActive(entry.path);

            return (
              <ListItem key={entry.path} disablePadding sx={{ px: 1.5, py: 0.2 }}>
                <ListItemButton
                  onClick={() => navigate(entry.path)}
                  sx={{
                    borderRadius: '7px',
                    py: 0.85,
                    px: 1.5,
                    position: 'relative',
                    transition: 'background 0.15s',
                    bgcolor: active ? 'rgba(176,125,42,0.08)' : 'transparent',
                    '&::before': active
                      ? {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: '20%',
                          height: '60%',
                          width: '3px',
                          borderRadius: '0 3px 3px 0',
                          bgcolor: '#b07d2a',
                        }
                      : {},
                    '&:hover': {
                      bgcolor: active ? 'rgba(176,125,42,0.10)' : 'rgba(0,0,0,0.04)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 34,
                      color: active ? '#b07d2a' : '#b0bcd0',
                      transition: 'color 0.15s',
                      '& svg': { fontSize: '1.1rem' },
                    }}
                  >
                    <Icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={entry.label}
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: '0.85rem',
                          fontWeight: active ? 600 : 400,
                          color: active ? '#1a2540' : '#7a8aaa',
                          fontFamily: '"Outfit", sans-serif',
                          transition: 'color 0.15s',
                        },
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Version stamp */}
      <Box sx={{ borderTop: '1px solid #e2e8f2', mx: 2, py: 1.5, px: 0.5 }}>
        <Typography sx={{ fontSize: '0.65rem', color: '#d0d8e8', letterSpacing: '0.06em', fontFamily: '"JetBrains Mono", monospace' }}>
          v1.0 · KPI Platform
        </Typography>
      </Box>
    </Drawer>
  );
}

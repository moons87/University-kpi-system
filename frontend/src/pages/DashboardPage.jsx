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
  const [summary,      setSummary]      = useState(null);
  const [teacherCount, setTeacherCount] = useState('—');
  const [deptCount,    setDeptCount]    = useState('—');

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
      {/* Page header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography
            sx={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#1a2540',
              lineHeight: 1.1,
            }}
          >
            Басты бет
</Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8', mt: 0.25 }}>
            Кафедра көрсеткіштерінің жалпы суреті
          </Typography>
        </Box>
        <PeriodSelector />
      </Stack>

      {/* KPI stat cards */}
      <Grid container spacing={2} mb={4}>
        <Grid item>
          <StatCard label="Оқытушылар"  value={teacherCount} color="primary.main" delay={0} />
        </Grid>
        <Grid item>
          <StatCard label="Кафедралар"  value={deptCount}    color="info.main"    delay={60} />
        </Grid>
        <Grid item>
          <StatCard label="Жоғары KPI"  value={topScore}     color="success.main" delay={120} />
        </Grid>
        <Grid item>
          <StatCard label="Орташа KPI"  value={avgScore}     color="warning.main" delay={180} />
        </Grid>
      </Grid>

      {/* Chart section */}
      <Box
        sx={{
          border: '1px solid #e2e8f2',
          borderRadius: '10px',
          bgcolor: '#ffffff',
          overflow: 'hidden',
          boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
        }}
      >
        <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #e2e8f2' }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a2540' }}>
            Оқытушылар бойынша KPI
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', mt: 0.25 }}>
            {timeId ? 'Таңдалған кезең деректері' : 'Кезеңді таңдаңыз'}
          </Typography>
        </Box>
        <Box sx={{ px: 2, py: 2 }}>
          <KPIChart data={summary?.teachers || []} />
        </Box>
      </Box>
    </Box>
  );
}

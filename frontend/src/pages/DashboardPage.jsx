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
  const [teacherCount, setTeacherCount] = useState(0);
  const [deptCount,    setDeptCount]    = useState(0);

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

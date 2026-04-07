import { useEffect, useState, useCallback } from 'react';
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

  const load = useCallback(() => {
    const params = timeId ? { time_id: timeId } : {};
    getKPIScores(params).then(setRows).finally(() => setLoading(false));
  }, [timeId]);

  useEffect(() => { load(); }, [load]);

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

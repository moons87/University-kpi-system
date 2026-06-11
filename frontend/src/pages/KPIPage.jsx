import { useEffect, useState, useCallback, useRef } from 'react';
import { Box, Typography, Stack, Button, Alert, CircularProgress, Chip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import PeriodSelector from '../components/PeriodSelector';
import { getKPIScores, calculateKPI, getJobStatus } from '../api/kpi';
import useFilterStore from '../store/filterStore';
import useAuthStore from '../store/authStore';

export default function KPIPage() {
  const [rows,       setRows]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [jobStatus,  setJobStatus]  = useState(null); // 'queued' | 'running' | 'done' | 'error'
  const [message,    setMessage]    = useState('');
  const { timeId, year, semester } = useFilterStore();
  const user = useAuthStore((s) => s.user);
  const pollRef = useRef(null);

  const load = useCallback(() => {
    const params = timeId ? { time_id: timeId } : {};
    getKPIScores(params).then(setRows).finally(() => setLoading(false));
  }, [timeId]);

  useEffect(() => { load(); }, [load]);

  // Stop polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const pollJob = (jobId) => {
    pollRef.current = setInterval(async () => {
      try {
        const job = await getJobStatus(jobId);
        setJobStatus(job.status);

        if (job.status === 'done') {
          clearInterval(pollRef.current);
          setCalculating(false);
          setMessage(`${job.result?.calculated ?? 0} оқытушы үшін қайта есептеу аяқталды.`);
          load();
        } else if (job.status === 'error') {
          clearInterval(pollRef.current);
          setCalculating(false);
          setMessage(`Қайта есептеуде қате: ${job.error}`);
        }
      } catch {
        clearInterval(pollRef.current);
        setCalculating(false);
        setMessage('Тапсырма мәртебесін алу мүмкін болмады.');
      }
    }, 1500); // опрашивать каждые 1.5 секунды
  };

  const handleCalculate = async () => {
    setMessage('');
    setJobStatus('queued');
    setCalculating(true);
    try {
      const { job_id } = await calculateKPI(year, semester);
      pollJob(job_id);
    } catch (err) {
      setCalculating(false);
      setJobStatus(null);
      setMessage('Қайта есептеуді іске қосу мүмкін болмады: ' + (err.response?.data?.detail || err.message));
    }
  };

  const statusColor = { queued: 'warning', running: 'info', done: 'success', error: 'error' };
  const statusLabel = { queued: 'Кезекте...', running: 'Орындалуда...', done: 'Дайын', error: 'Қате' };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">KPI Бағалары</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <PeriodSelector />
          {jobStatus && jobStatus !== 'done' && jobStatus !== 'error' && (
            <Chip
              icon={<CircularProgress size={14} color="inherit" />}
              label={statusLabel[jobStatus]}
              color={statusColor[jobStatus]}
              variant="outlined"
            />
          )}
          {user?.role === 'admin' && (
            <Button
              variant="contained"
              onClick={handleCalculate}
              disabled={calculating}
              startIcon={calculating ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {calculating ? 'Есептелуде...' : 'KPI қайта есептеу'}
            </Button>
          )}
        </Stack>
      </Stack>

      {message && (
        <Alert
          severity={message.includes('қате') || message.includes('мүмкін') ? 'error' : 'success'}
          sx={{ mb: 2 }}
          onClose={() => setMessage('')}
        >
          {message}
        </Alert>
      )}

      <DataGrid
        rows={rows}
        columns={[
          { field: 'teacher_id',        headerName: 'Оқытушы',      width: 100 },
          { field: 'teaching_score',    headerName: 'Жүктеме',      width: 110 },
          { field: 'research_score',    headerName: 'Зерттеу',      width: 110 },
          { field: 'project_score',     headerName: 'Жобалар',      width: 110 },
          { field: 'achievement_score', headerName: 'Жетістіктер',  width: 130 },
          { field: 'total_score',       headerName: 'Жиыны',        width: 100 },
        ]}
        loading={loading}
        autoHeight
        pageSizeOptions={[10, 25]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      />
    </Box>
  );
}

import { BarChart } from '@mui/x-charts/BarChart';
import { Box, Typography } from '@mui/material';

export default function KPIChart({ data }) {
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

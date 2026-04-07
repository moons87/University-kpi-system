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

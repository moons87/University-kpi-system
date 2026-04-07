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
